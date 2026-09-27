import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv, GATConv

class GraphSAGEClassifier(torch.nn.Module):
    """
    GraphSAGE (Graph Sample and Aggregate) Model for Node Classification.
    
    This architecture learns node representations by sampling and aggregating 
    features from a node's local neighborhood. Suitable for large, evolving graphs.
    """
    def __init__(self, in_channels: int, hidden_channels: int = 128, out_channels: int = 8, dropout: float = 0.5):
        super(GraphSAGEClassifier, self).__init__()
        # 3-layer architecture
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels)
        self.conv3 = SAGEConv(hidden_channels, hidden_channels)
        
        # Final linear classifier
        self.lin = torch.nn.Linear(hidden_channels, out_channels)
        self.dropout = dropout

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        # Layer 1
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        # Layer 2
        x = self.conv2(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        # Layer 3
        x = self.conv3(x, edge_index)
        x = F.relu(x)
        
        # Classification layer
        x = self.lin(x)
        return F.log_softmax(x, dim=1)


class GATClassifier(torch.nn.Module):
    """
    Graph Attention Network (GAT) for Node Classification.
    
    Uses multi-head attention to weigh the importance of neighbor nodes,
    allowing the model to focus on the most relevant connections.
    """
    def __init__(self, in_channels: int, hidden_channels: int = 64, out_channels: int = 8, heads: int = 4, dropout: float = 0.5):
        super(GATClassifier, self).__init__()
        self.dropout = dropout
        
        # Multi-head attention layer 1
        self.conv1 = GATConv(in_channels, hidden_channels, heads=heads, dropout=dropout)
        
        # Output attention layer (averages heads by default for the last layer or computes one final head)
        self.conv2 = GATConv(hidden_channels * heads, out_channels, heads=1, concat=False, dropout=dropout)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        # Layer 1 with ELU activation
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv1(x, edge_index)
        x = F.elu(x)
        
        # Layer 2 (Output)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv2(x, edge_index)
        
        return F.log_softmax(x, dim=1)
