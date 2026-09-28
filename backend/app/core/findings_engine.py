import uuid
from typing import List, Dict, Any
import networkx as nx

from app.blockchain.models import Finding, FindingSeverity, TraceResult

def generate_findings_for_trace(case_id: str, trace_result: TraceResult) -> List[Finding]:
    findings = []
    
    # Check if there is a graph
    if not trace_result.graph or "edges" not in trace_result.graph:
        return findings
        
    edges = trace_result.graph["edges"]
    
    # Finding 1: Peel Chain
    if len(trace_result.path) > 3:
        values = [tx.value for tx in trace_result.path]
        is_peel = all(next_value <= value for value, next_value in zip(values, values[1:])) and any(
            next_value < value for value, next_value in zip(values, values[1:])
        )
        if is_peel:
            findings.append(Finding(
                id=f"FIND-{uuid.uuid4().hex[:8]}",
                case_id=case_id,
                trace_id=trace_result.trace_id,
                type="Peel Chain Pattern",
                severity=FindingSeverity.MEDIUM,
                title="Potential Peel Chain",
                description="Sequential small transfers detected indicating possible UTXO/account consolidation.",
                affected_addresses=[trace_result.suspect_address]
            ))
            
    # Finding 2: Large Transfer
    for tx in trace_result.path:
        # Assuming values are native units, > 50 ETH or equivalent is large
        if tx.value > 50:
            findings.append(Finding(
                id=f"FIND-{uuid.uuid4().hex[:8]}",
                case_id=case_id,
                trace_id=trace_result.trace_id,
                type="Large Transfer",
                severity=FindingSeverity.HIGH,
                title="Unusual Volume Spike",
                description=f"Wallet moved {tx.value:.2f} {tx.asset} in a single transaction.",
                affected_addresses=[tx.from_address, tx.to_address] if tx.to_address else [tx.from_address]
            ))
            
    # Finding 3: High Risk GNN Class
    if trace_result.gnn_prediction:
        pred_class = trace_result.gnn_prediction.get("predicted_class")
        if pred_class in ["mixer", "darknet", "ransomware"]:
            findings.append(Finding(
                id=f"FIND-{uuid.uuid4().hex[:8]}",
                case_id=case_id,
                trace_id=trace_result.trace_id,
                type="High Risk Entity",
                severity=FindingSeverity.CRITICAL,
                title=f"{pred_class.capitalize()} Interaction Detected",
                description=f"GraphSAGE classified an entity in the trace path as {pred_class}.",
                affected_addresses=[]
            ))

    return findings
