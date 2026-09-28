import torch
import torch.nn.functional as F

try:
    from torch_geometric.nn import SAGEConv, GATConv
    HAS_PYG = True
except ImportError:
    HAS_PYG = False
    # Mock classes if missing
    class SAGEConv: pass
    class GATConv: pass

class GraphSAGEClassifier(torch.nn.Module):
    """
    GraphSAGE (Graph Sample and Aggregate) Model for Node Classification.
    """
    def __init__(self, in_channels: int, hidden_channels: int = 128, out_channels: int = 8, dropout: float = 0.5):
        super(GraphSAGEClassifier, self).__init__()
        if not HAS_PYG:
            self.lin = torch.nn.Linear(in_channels, out_channels)
            return
            
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels)
        self.conv3 = SAGEConv(hidden_channels, hidden_channels)
        self.lin = torch.nn.Linear(hidden_channels, out_channels)
        self.dropout = dropout

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        if not HAS_PYG:
            return F.log_softmax(self.lin(x), dim=1)
            
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        x = self.conv2(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        x = self.conv3(x, edge_index)
        x = F.relu(x)
        
        x = self.lin(x)
        return F.log_softmax(x, dim=1)

class GATClassifier(torch.nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int = 64, out_channels: int = 8, heads: int = 4, dropout: float = 0.5):
        super(GATClassifier, self).__init__()
        self.dropout = dropout
        if not HAS_PYG:
            self.lin = torch.nn.Linear(in_channels, out_channels)
            return
            
        self.conv1 = GATConv(in_channels, hidden_channels, heads=heads, dropout=dropout)
        self.conv2 = GATConv(hidden_channels * heads, out_channels, heads=1, concat=False, dropout=dropout)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        if not HAS_PYG:
            return F.log_softmax(self.lin(x), dim=1)
            
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv1(x, edge_index)
        x = F.elu(x)
        
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv2(x, edge_index)
        
        return F.log_softmax(x, dim=1)
