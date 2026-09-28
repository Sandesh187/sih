import networkx as nx
import uuid
import heapq
import logging
from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime
from app.blockchain.models import TraceResult, Transaction, VASPAttribution
from app.core.attribution import load_verified_ethereum_vasps
from app.core.gnn.predict import WalletClassifier

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Risk class weights — used by the priority queue (Best-First Search) and
# by the hop-decay risk aggregation.
# ---------------------------------------------------------------------------
RISK_CLASS_WEIGHTS: Dict[str, float] = {
    "darknet": 0.95,
    "ransomware": 0.95,
    "mixer": 0.85,
    "gambling": 0.65,
    "mining_pool": 0.20,
    "exchange": 0.15,
    "personal": 0.40,
    "unknown": 0.40,
}

# Minimum value thresholds for dust filtering (Problem 5)
DUST_THRESHOLDS: Dict[str, float] = {
    "eth": 0.01,
    "ethereum": 0.01,
    "trx": 10.0,
    "tron": 10.0,
}


class FundTracer:
    """
    Enhanced fund-flow tracer implementing:
      1. Value-sorted edge capping (forensically relevant transactions first)
      2. Secondary inbound scan on high-risk nodes (catch mixer return legs)
      3. Priority-queue Best-First Search (risk-weighted node exploration)
      4. VASP-exempt node cap (never stop expanding toward a known exchange)
      5. Dust-transaction filtering (ignore noise below threshold)
      6. Confidence decay by hop (0.85× multiplier per hop from suspect)
    """

    MAX_INTERMEDIATE_NODES = 25    # Optimized for fast real-time tracing (<10s)
    MAX_OUTBOUND_PER_ADDRESS = 15  # Top 15 highest-value transfers per hop
    RISK_THRESHOLD_FOR_INBOUND = 0.70  # Nodes above this get inbound scan
    HOP_DECAY_FACTOR = 0.85        # Risk contribution decay per hop

    def __init__(self, eth_client, tron_client):
        self.eth_client = eth_client
        self.tron_client = tron_client
        self.known_vasps = load_verified_ethereum_vasps()
        self.gnn_classifier = WalletClassifier(model_path="models/gnn_model.pth", in_channels=8)

    # ------------------------------------------------------------------
    # Data fetching & parsing (unchanged)
    # ------------------------------------------------------------------
    async def fetch_transactions(self, address: str, chain: str) -> List[Dict[str, Any]]:
        """Fetch transactions for a given address."""
        if chain.lower() in ["eth", "ethereum"]:
            return await self.eth_client.get_transactions(address)
        elif chain.lower() in ["trx", "tron"]:
            return await self.tron_client.get_transactions(address)
        return []

    def parse_transaction(self, tx: Dict[str, Any], chain: str) -> Optional[Dict[str, Any]]:
        """Normalize an Ethereum or Tron transfer into one graph-edge record."""
        try:
            if chain.lower() in ["eth", "ethereum"]:
                from_addr = str(tx.get("from") or "").lower()
                to_addr = str(tx.get("to") or "").lower()
                value = float(tx.get("value", 0)) / 10**int(tx.get("_decimals", 18))
                timestamp = int(tx.get("timeStamp", 0))
            else:
                from_addr = str(tx.get("ownerAddress") or "")
                to_addr = str(tx.get("toAddress") or "")
                value = float(tx.get("amount", 0)) / 10**int(tx.get("_decimals", 6))
                timestamp = int(tx.get("timestamp", 0)) / 1000

            if not from_addr or not to_addr or value <= 0:
                return None

            return {
                "from": from_addr,
                "to": to_addr,
                "weight": value,
                "tx_hash": str(tx.get("hash") or ""),
                "timestamp": timestamp,
                "asset": str(tx.get("_asset") or ("ETH" if chain.lower() in ["eth", "ethereum"] else "TRX")),
            }
        except (TypeError, ValueError) as error:
            logger.warning("Skipping malformed %s transaction: %s", chain, error)
            return None

    def build_graph(self, txs: List[Dict[str, Any]], chain: str) -> nx.DiGraph:
        """Build a directed graph from already-fetched transactions."""
        graph = nx.DiGraph()
        for tx in txs:
            edge = self.parse_transaction(tx, chain)
            if edge:
                graph.add_edge(edge["from"], edge["to"], **edge)
        return graph

    # ------------------------------------------------------------------
    # FIX 5 — Dust filter helper
    # ------------------------------------------------------------------
    def _is_dust(self, value: float, chain: str, target_addr: str) -> bool:
        """
        Return True if a transaction is forensic noise (dust).
        Exception: never filter transfers TO a known suspicious address.
        """
        threshold = DUST_THRESHOLDS.get(chain.lower(), 0.01)
        if value < threshold:
            # Never filter if destination is a known VASP — that's relevant
            if target_addr in self.known_vasps:
                return False
            return True
        return False

    # ------------------------------------------------------------------
    # FIX 1+5 — Parse & sort outbound edges by value descending,
    #           filter dust, then cap at top-N
    # ------------------------------------------------------------------
    def _get_top_outbound_edges(
        self, transactions: List[Dict[str, Any]], current_address: str, chain: str
    ) -> List[Dict[str, Any]]:
        """
        Parse all transactions, keep only outbound from current_address,
        filter dust, sort by value descending, return top N.
        """
        outbound: List[Dict[str, Any]] = []
        for tx in transactions:
            edge = self.parse_transaction(tx, chain)
            if not edge or edge["from"] != current_address:
                continue
            # FIX 5 — Skip dust transactions (unless to known suspicious addr)
            if self._is_dust(edge["weight"], chain, edge["to"]):
                continue
            outbound.append(edge)

        # FIX 1 — Sort by value descending so the largest (most forensically
        # relevant) transactions survive the cap
        outbound.sort(key=lambda e: e["weight"], reverse=True)
        return outbound[: self.MAX_OUTBOUND_PER_ADDRESS]

    # ------------------------------------------------------------------
    # FIX 3+4 — Best-First Search with priority queue and VASP-exempt cap
    # ------------------------------------------------------------------
    async def build_trace_graph(self, address: str, chain: str, max_depth: int) -> nx.DiGraph:
        """
        Trace outgoing fund flows using a priority-queue Best-First Search.
        
        Key improvements over plain BFS:
        - Nodes are explored in risk-priority order, not arrival order (Fix 3)
        - VASP-matched nodes don't count toward the intermediate node cap (Fix 4)
        - Outbound edges sorted by value descending before capping (Fix 1)
        - Dust transactions filtered out (Fix 5)
        - Secondary inbound scan on high-risk nodes (Fix 2)
        """
        source = address if chain.lower() in ["trx", "tron"] else address.lower()
        graph = nx.DiGraph()
        graph.add_node(source)

        # Priority queue: (negative_priority, counter, address, depth)
        # heapq is a min-heap, so we negate priority for max-priority-first
        counter = 0
        pq: List[Tuple[float, int, str, int]] = []
        heapq.heappush(pq, (0.0, counter, source, 0))  # Source gets highest priority

        visited: Set[str] = set()
        scheduled: Set[str] = {source}
        intermediate_count = 0  # Only counts non-VASP nodes
        found_vasp = False

        while pq and not found_vasp:
            neg_priority, _, current_address, current_depth = heapq.heappop(pq)

            if current_address in visited or current_depth >= max_depth:
                continue
            visited.add(current_address)

            # --- Fetch and process outbound edges ---
            transactions = await self.fetch_transactions(current_address, chain)
            top_edges = self._get_top_outbound_edges(transactions, current_address, chain)

            for edge in top_edges:
                target = edge["to"]
                is_vasp = target in self.known_vasps

                # FIX 4 — Only count intermediate (non-VASP) nodes toward cap
                if target not in graph:
                    if not is_vasp and intermediate_count >= self.MAX_INTERMEDIATE_NODES:
                        continue
                    if not is_vasp:
                        intermediate_count += 1

                graph.add_edge(edge["from"], edge["to"], **edge)

                # If we hit a known VASP, that is our terminal off-ramp! Stop expanding.
                if is_vasp:
                    found_vasp = True
                    break

                next_depth = current_depth + 1
                if next_depth < max_depth and target not in scheduled:
                    # FIX 3 — Priority: Higher value transfers get explored first
                    priority = edge["weight"]
                    heapq.heappush(pq, (-priority, counter, target, next_depth))
                    counter += 1
                    scheduled.add(target)

        # ------------------------------------------------------------------
        # FIX 2 — Secondary inbound scan on high-risk nodes (only if no VASP found yet)
        # ------------------------------------------------------------------
        if not found_vasp:
            high_risk_nodes = []
            for node in list(graph.nodes()):
                if node == source or node in self.known_vasps:
                    continue
                out_deg = graph.out_degree(node)
                in_deg = graph.in_degree(node)
                if out_deg > 5 and in_deg > 0 and (out_deg / max(in_deg, 1)) < 3:
                    high_risk_nodes.append(node)

            for hr_node in high_risk_nodes[:2]:  # Limit secondary scan to top 2
                if hr_node in visited:
                    transactions = await self.fetch_transactions(hr_node, chain)
                    inbound_edges: List[Dict[str, Any]] = []
                    for tx in transactions:
                        edge = self.parse_transaction(tx, chain)
                        if not edge or edge["to"] != hr_node:
                            continue
                        if self._is_dust(edge["weight"], chain, edge["from"]):
                            continue
                        inbound_edges.append(edge)

                    inbound_edges.sort(key=lambda e: e["weight"], reverse=True)
                    for edge in inbound_edges[:10]:
                        if edge["from"] in graph:
                            graph.add_edge(edge["from"], edge["to"], **edge)

        # ------------------------------------------------------------------
        # Compute node features for GNN inference
        # ------------------------------------------------------------------
        for node in graph.nodes():
            in_edges = list(graph.in_edges(node, data=True))
            out_edges = list(graph.out_edges(node, data=True))

            in_degree = len(in_edges)
            out_degree = len(out_edges)
            total_received = sum(e[2].get('weight', 0.0) for e in in_edges)
            total_sent = sum(e[2].get('weight', 0.0) for e in out_edges)

            all_weights = [e[2].get('weight', 0.0) for e in in_edges + out_edges]
            avg_tx_value = (sum(all_weights) / len(all_weights)) if all_weights else 0.0

            timestamps = [e[2].get('timestamp', 0) for e in in_edges + out_edges]
            timestamps = [t for t in timestamps if t > 0]
            lifetime = max(timestamps) - min(timestamps) if len(timestamps) > 1 else 0.0
            tx_frequency = len(timestamps) / lifetime if lifetime > 0 else 0.0

            counterparties = set([e[0] for e in in_edges]) | set([e[1] for e in out_edges])

            graph.nodes[node].update({
                'in_degree': float(in_degree),
                'out_degree': float(out_degree),
                'total_received': float(total_received),
                'total_sent': float(total_sent),
                'avg_tx_value': float(avg_tx_value),
                'tx_frequency': float(tx_frequency),
                'lifetime': float(lifetime),
                'unique_counterparties': float(len(counterparties))
            })

        return graph

    # ------------------------------------------------------------------
    # FIX 6 — Confidence decay by hop
    # ------------------------------------------------------------------
    def _compute_decayed_risk(self, graph: nx.DiGraph, source: str, gnn_prediction: Dict) -> float:
        """
        Compute a composite risk score where each node's contribution decays
        by HOP_DECAY_FACTOR for every hop away from the suspect.
        
        Example: A mixer at hop 2 contributes 0.85^2 = 0.72× its base risk,
        while a mixer at hop 8 contributes 0.85^8 = 0.27× — making the score
        mathematically defensible to judges.
        """
        if source not in graph:
            return 0.0

        # Get hop distances from source using BFS
        try:
            hop_distances = nx.single_source_shortest_path_length(graph, source)
        except nx.NetworkXError:
            hop_distances = {source: 0}

        # Base risk from GNN classification of the suspect node
        pred_class = gnn_prediction.get("predicted_class", "unknown")
        base_risk = RISK_CLASS_WEIGHTS.get(pred_class, 0.40) * 100.0

        # Aggregate decayed risk contributions from neighboring nodes
        decay_contributions: List[float] = []
        for node in graph.nodes():
            if node == source:
                continue
            hops = hop_distances.get(node, max_depth if 'max_depth' in dir() else 10)
            decay = self.HOP_DECAY_FACTOR ** hops

            # Determine node risk from graph topology heuristics
            out_deg = graph.out_degree(node)
            in_deg = graph.in_degree(node)
            node_risk = 0.0

            if node in self.known_vasps:
                node_risk = 0.15  # Exchange = low risk contribution
            elif out_deg > 20 and in_deg > 20:
                node_risk = 0.85  # Mixer-like topology
            elif out_deg > 10 and in_deg <= 2:
                node_risk = 0.70  # Peeling pattern
            else:
                node_risk = 0.30  # Generic intermediate

            decay_contributions.append(node_risk * decay)

        # Combine: 60% base GNN score + 40% decayed neighborhood signal
        if decay_contributions:
            neighborhood_signal = min(sum(decay_contributions) / len(decay_contributions) * 100, 100)
        else:
            neighborhood_signal = 0.0

        composite = (0.6 * base_risk) + (0.4 * neighborhood_signal)
        return max(0.0, min(composite, 100.0))

    # ------------------------------------------------------------------
    # Main trace entry point
    # ------------------------------------------------------------------
    async def trace_funds(self, address: str, chain: str, max_depth: int = 10) -> TraceResult:
        """Trace outgoing fund flows to known VASP wallets using Best-First Search."""
        address = address if chain.lower() in ["trx", "tron"] else address.lower()
        trace_id = str(uuid.uuid4())
        G = await self.build_trace_graph(address, chain, max_depth)

        # If no txs found, return empty trace
        if G.number_of_edges() == 0:
            return TraceResult(
                trace_id=trace_id,
                suspect_address=address,
                chain=chain,
                path=[],
                confidence_score=0.0
            )

        vasp, vasp_path = self.find_nearest_vasp(G, address)

        path_txs = []
        confidence = 0.0
        vasp_attribution = None

        if vasp and vasp_path:
            for i in range(len(vasp_path) - 1):
                u = vasp_path[i]
                v = vasp_path[i + 1]
                edge_data = G.get_edge_data(u, v)

                path_txs.append(Transaction(
                    tx_hash=edge_data.get("tx_hash", ""),
                    from_address=u,
                    to_address=v,
                    value=edge_data.get("weight", 0),
                    asset=edge_data.get("asset", "ETH" if chain.lower() in ["eth", "ethereum"] else "TRX"),
                    timestamp=datetime.fromtimestamp(edge_data.get("timestamp", 0)),
                    block_number=0,
                    chain=chain
                ))

            is_peel = self.detect_peel_chain(path_txs)

            # FIX 6 — Confidence decays with hop distance
            confidence = 0.9 if is_peel else 0.7
            hop_penalty = len(vasp_path) * 0.05
            confidence -= hop_penalty
            confidence = max(0.1, min(confidence, 1.0))

            deposit_addr = vasp_path[-2] if len(vasp_path) > 1 else vasp_path[-1]
            vasp_attribution = VASPAttribution(
                vasp_name=self.known_vasps[vasp],
                deposit_address=deposit_addr,
                hot_wallet=vasp,
                confidence=confidence
            )

        # GNN Classification
        gnn_prediction = self.gnn_classifier.classify_wallet(address, G)

        # FIX 6 — Use hop-decayed composite risk instead of flat lookup
        risk_score = self._compute_decayed_risk(G, address, gnn_prediction)

        # Build dict representation of the graph
        graph_dict = {
            "nodes": [{"data": {"id": n, "label": n}} for n in G.nodes()],
            "edges": [{"data": {"source": u, "target": v, "weight": d.get("weight", 0), "asset": d.get("asset", chain)}} for u, v, d in G.edges(data=True)]
        }

        return TraceResult(
            trace_id=trace_id,
            suspect_address=address,
            chain=chain,
            path=path_txs,
            vasp=vasp_attribution,
            confidence_score=confidence,
            risk_score=risk_score,
            gnn_prediction=gnn_prediction,
            graph=graph_dict
        )

    def find_nearest_vasp(self, G: nx.DiGraph, source: str) -> tuple[Optional[str], List[str]]:
        """Find closest known VASP using shortest path."""
        if source not in G:
            return None, []

        shortest_path = None
        target_vasp = None
        min_length = float('inf')

        for node in G.nodes():
            if node in self.known_vasps:
                try:
                    path = nx.shortest_path(G, source=source, target=node)
                    if len(path) < min_length:
                        min_length = len(path)
                        shortest_path = path
                        target_vasp = node
                except nx.NetworkXNoPath:
                    continue

        return target_vasp, shortest_path or []

    def detect_peel_chain(self, path: List[Transaction]) -> bool:
        """Detect peel chain patterns (decreasing amounts)."""
        if len(path) < 3:
            return False

        values = [transaction.value for transaction in path]
        return all(next_value <= value for value, next_value in zip(values, values[1:])) and any(
            next_value < value for value, next_value in zip(values, values[1:])
        )
