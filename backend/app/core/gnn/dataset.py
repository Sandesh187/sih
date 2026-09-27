import os
import pandas as pd
import numpy as np
import torch
from torch_geometric.data import Data
from typing import Tuple, List, Dict, Any
import networkx as nx

class EllipticDatasetLoader:
    """
    Loader for the Elliptic Bitcoin Dataset.
    Handles downloading, loading, and converting to PyTorch Geometric Data.
    Features: 166-dim (93 local + 72 aggregate + time step).
    Labels: 0=licit, 1=illicit, 2=unknown.
    """
    def __init__(self, data_dir: str = "data/elliptic"):
        self.data_dir = data_dir
        
    def load_elliptic(self) -> Data:
        """
        Loads CSV files and constructs a PyG Data object.
        """
        features_path = os.path.join(self.data_dir, "elliptic_txs_features.csv")
        edges_path = os.path.join(self.data_dir, "elliptic_txs_edgelist.csv")
        classes_path = os.path.join(self.data_dir, "elliptic_txs_classes.csv")
        
        try:
            features_df = pd.read_csv(features_path, header=None)
            edges_df = pd.read_csv(edges_path)
            classes_df = pd.read_csv(classes_path)
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Elliptic dataset not found at {self.data_dir}. "
                "Please download the dataset (elliptic_txs_features.csv, etc.) "
                "and place it in this directory before training or running inference."
            )

        # Process node IDs to 0-indexed integers
        node_ids = features_df[0].values
        id_map = {node_id: idx for idx, node_id in enumerate(node_ids)}
        
        # Extract features (skip node ID and time step if needed, or keep time step)
        x = torch.tensor(features_df.iloc[:, 2:].values, dtype=torch.float)
        
        # Process edges
        src = [id_map[u] for u in edges_df['txId1'] if u in id_map]
        dst = [id_map[v] for v in edges_df['txId2'] if v in id_map]
        edge_index = torch.tensor([src, dst], dtype=torch.long)
        
        # Process labels: '1' -> illicit (class 1), '2' -> licit (class 0), 'unknown' -> 2
        classes_df['class'] = classes_df['class'].map({'1': 1, '2': 0, 'unknown': 2})
        y = torch.tensor(classes_df['class'].values, dtype=torch.long)
        
        # Create masks for training (excluding 'unknown' nodes for supervised train)
        labeled_idx = (y != 2).nonzero(as_tuple=True)[0]
        
        # Simple split: 70% train, 15% val, 15% test on labeled data
        num_labeled = labeled_idx.size(0)
        perm = torch.randperm(num_labeled)
        train_idx = labeled_idx[perm[:int(0.7 * num_labeled)]]
        val_idx = labeled_idx[perm[int(0.7 * num_labeled):int(0.85 * num_labeled)]]
        test_idx = labeled_idx[perm[int(0.85 * num_labeled):]]
        
        train_mask = torch.zeros(x.size(0), dtype=torch.bool)
        val_mask = torch.zeros(x.size(0), dtype=torch.bool)
        test_mask = torch.zeros(x.size(0), dtype=torch.bool)
        
        train_mask[train_idx] = True
        val_mask[val_idx] = True
        test_mask[test_idx] = True
        
        data = Data(x=x, edge_index=edge_index, y=y, 
                    train_mask=train_mask, val_mask=val_mask, test_mask=test_mask)
        return data

    def _generate_dummy_data(self) -> Data:
        num_nodes = 1000
        x = torch.randn(num_nodes, 166)
        edge_index = torch.randint(0, num_nodes, (2, 5000))
        y = torch.randint(0, 3, (num_nodes,))
        
        train_mask = torch.zeros(num_nodes, dtype=torch.bool)
        train_mask[:700] = True
        val_mask = torch.zeros(num_nodes, dtype=torch.bool)
        val_mask[700:850] = True
        test_mask = torch.zeros(num_nodes, dtype=torch.bool)
        test_mask[850:] = True
        
        return Data(x=x, edge_index=edge_index, y=y, 
                    train_mask=train_mask, val_mask=val_mask, test_mask=test_mask)

class CustomBlockchainDataset:
    """
    Dataset builder for custom traced transaction data.
    Converts NetworkX graphs to PyG Data objects with engineered features.
    """
    def __init__(self, nx_graph: nx.DiGraph):
        self.nx_graph = nx_graph
        
    def to_pyg_data(self) -> Data:
        """
        Extracts node features and edges to build a PyG Data object.
        Expected features in graph nodes:
        in_degree, out_degree, total_received, total_sent, avg_tx_value, tx_frequency, lifetime, unique_counterparties
        """
        node_list = list(self.nx_graph.nodes())
        node_to_idx = {node: i for i, node in enumerate(node_list)}
        
        # Default feature array if node lacks features
        default_features = [0.0] * 8 
        
        x_list = []
        y_list = []
        
        for node in node_list:
            attrs = self.nx_graph.nodes[node]
            features = [
                attrs.get('in_degree', 0.0),
                attrs.get('out_degree', 0.0),
                attrs.get('total_received', 0.0),
                attrs.get('total_sent', 0.0),
                attrs.get('avg_tx_value', 0.0),
                attrs.get('tx_frequency', 0.0),
                attrs.get('lifetime', 0.0),
                attrs.get('unique_counterparties', 0.0)
            ]
            x_list.append(features)
            # Default class 7 (unknown) if label not present
            y_list.append(attrs.get('label', 7))
            
        x = torch.tensor(x_list, dtype=torch.float)
        y = torch.tensor(y_list, dtype=torch.long)
        
        # Build edge index
        edges = list(self.nx_graph.edges())
        if edges:
            src = [node_to_idx[u] for u, v in edges]
            dst = [node_to_idx[v] for u, v in edges]
            edge_index = torch.tensor([src, dst], dtype=torch.long)
        else:
            edge_index = torch.empty((2, 0), dtype=torch.long)
            
        return Data(x=x, edge_index=edge_index, y=y)
