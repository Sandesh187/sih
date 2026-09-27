import numpy as np
from typing import List, Dict, Any
from sklearn.preprocessing import StandardScaler

class NodeFeatureExtractor:
    """
    Feature Engineering module for extracting behavioral and network features 
    from a node's transaction history.
    """
    def __init__(self):
        self.scaler = StandardScaler()

    def extract_features(self, address: str, transactions: List[Dict[str, Any]], network_metrics: Dict[str, Any] = None) -> np.ndarray:
        """
        Computes local and aggregated features for a given address.
        
        Args:
            address: The target crypto address.
            transactions: List of transaction dictionaries related to the address.
            network_metrics: Dictionary containing pre-computed network metrics (e.g., PageRank).
            
        Returns:
            numpy array of computed features.
        """
        if not transactions:
            return np.zeros(16) # 16 feature dimensions

        in_txs = [tx for tx in transactions if tx.get('to') == address]
        out_txs = [tx for tx in transactions if tx.get('from') == address]
        
        in_count = len(in_txs)
        out_count = len(out_txs)
        
        in_values = [float(tx.get('value', 0)) for tx in in_txs]
        out_values = [float(tx.get('value', 0)) for tx in out_txs]
        all_values = in_values + out_values
        
        total_in = sum(in_values)
        total_out = sum(out_values)
        
        avg_tx_value = np.mean(all_values) if all_values else 0.0
        median_tx_value = np.median(all_values) if all_values else 0.0
        max_tx_value = max(all_values) if all_values else 0.0
        std_tx_value = np.std(all_values) if all_values else 0.0
        
        timestamps = sorted([int(tx.get('timestamp', 0)) for tx in transactions if 'timestamp' in tx])
        if len(timestamps) > 1:
            lifetime = timestamps[-1] - timestamps[0]
            avg_time_between_txs = lifetime / (len(timestamps) - 1)
        else:
            lifetime = 0
            avg_time_between_txs = 0
            
        counterparties = set([tx.get('from') for tx in in_txs]) | set([tx.get('to') for tx in out_txs])
        unique_counterparties = len(counterparties)
        
        # Network metrics (default to 0 if not provided)
        network_metrics = network_metrics or {}
        in_degree = network_metrics.get('in_degree', in_count)
        out_degree = network_metrics.get('out_degree', out_count)
        clustering_coeff = network_metrics.get('clustering_coeff', 0.0)
        pagerank = network_metrics.get('pagerank', 0.0)
        is_contract = 1.0 if network_metrics.get('is_contract', False) else 0.0
        balance = total_in - total_out
        
        features = [
            in_count + out_count,  # 1. Total Tx Count
            total_in,              # 2. Total In
            total_out,             # 3. Total Out
            avg_tx_value,          # 4. Avg Tx Value
            median_tx_value,       # 5. Median Tx Value
            max_tx_value,          # 6. Max Tx Value
            std_tx_value,          # 7. Std Dev of Tx Values
            lifetime,              # 8. Lifetime
            avg_time_between_txs,  # 9. Avg time between txs
            unique_counterparties, # 10. Unique counterparties
            in_degree,             # 11. In-degree
            out_degree,            # 12. Out-degree
            clustering_coeff,      # 13. Clustering coeff
            pagerank,              # 14. PageRank
            is_contract,           # 15. Is Contract
            balance                # 16. Current Balance
        ]
        
        return np.array(features, dtype=np.float32)

    def normalize_features(self, features_matrix: np.ndarray, fit: bool = False) -> np.ndarray:
        """Normalizes a batch of feature arrays using StandardScaler."""
        if fit:
            return self.scaler.fit_transform(features_matrix)
        return self.scaler.transform(features_matrix)
