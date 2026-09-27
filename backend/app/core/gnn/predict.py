import torch
import torch.nn.functional as F
import networkx as nx
from typing import Dict, Any, List
from .model import GraphSAGEClassifier
from .dataset import CustomBlockchainDataset

class WalletClassifier:
    """
    Inference Engine for classifying crypto wallets using a trained GNN model.
    """
    def __init__(self, model_path: str, in_channels: int, num_classes: int = 8):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = GraphSAGEClassifier(in_channels=in_channels, out_channels=num_classes)
        
        self.model_loaded = False
        try:
            self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
            self.model_loaded = True
        except FileNotFoundError:
            print(f"Warning: Trained GNN model not found at {model_path}. Inference will return 'Unknown'.")
            
        self.model.to(self.device)
        self.model.eval()
        
        self.classes = [
            "exchange", "mining_pool", "mixer", "gambling", 
            "darknet", "ransomware", "personal", "unknown"
        ]

    def _apply_temperature_scaling(self, logits: torch.Tensor, temperature: float = 1.5) -> torch.Tensor:
        """Calibrates confidence scores using temperature scaling."""
        return F.softmax(logits / temperature, dim=1)

    def classify_wallet(self, address: str, transaction_graph: nx.DiGraph) -> Dict[str, Any]:
        """
        Extracts 2-hop ego graph for the wallet, runs inference, and returns predictions.
        """
        # Build ego-graph (2-hop neighborhood)
        ego_graph = nx.ego_graph(transaction_graph, address, radius=2, undirected=False)
        
        if len(ego_graph.nodes) == 0:
            return {"error": "Address not found in transaction graph"}
            
        if not self.model_loaded:
            return {
                "predicted_class": "unknown",
                "confidence": 0.0,
                "all_scores": {c: 0.0 for c in self.classes},
                "explanation": "Model not trained/loaded. Fallback to unknown."
            }

        dataset = CustomBlockchainDataset(ego_graph)
        data = dataset.to_pyg_data().to(self.device)
        
        # Find index of the target address
        nodes_list = list(ego_graph.nodes())
        target_idx = nodes_list.index(address)
        
        with torch.no_grad():
            logits = self.model(data.x, data.edge_index)
            # Revert log_softmax for temperature scaling
            raw_logits = logits # Assuming the model outputs log_softmax, we'll just use it directly or exp it
            probs = torch.exp(logits) # simple exp since it's log_softmax
            
            # Optionally apply temperature scaling if raw logits were returned:
            # probs = self._apply_temperature_scaling(raw_logits)
            
        target_probs = probs[target_idx].cpu().numpy()
        pred_class_idx = target_probs.argmax()
        
        confidence_scores = {self.classes[i]: float(target_probs[i]) for i in range(len(self.classes))}
        
        return {
            "address": address,
            "predicted_class": self.classes[pred_class_idx],
            "confidence_scores": confidence_scores,
            "explanation": f"Classified as {self.classes[pred_class_idx]} with {target_probs[pred_class_idx]:.2%} confidence based on {len(ego_graph.nodes)} neighborhood nodes."
        }

    def classify_batch(self, addresses: List[str], transaction_graph: nx.DiGraph) -> Dict[str, Dict[str, Any]]:
        """Batch classification for multiple addresses."""
        results = {}
        for addr in addresses:
            results[addr] = self.classify_wallet(addr, transaction_graph)
        return results

    def get_feature_importance(self, address: str) -> Dict[str, float]:
        """
        Estimates feature importance (placeholder implementation).
        In a real scenario, could use Integrated Gradients or GNNExplainer.
        """
        # Placeholder for GNNExplainer integration
        return {
            "total_received": 0.35,
            "tx_frequency": 0.25,
            "unique_counterparties": 0.20,
            "lifetime": 0.20
        }
