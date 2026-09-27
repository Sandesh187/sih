import os
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from app.core.gnn.model import GraphSAGEClassifier

def generate_synthetic_training_data(num_nodes=500):
    """
    Generates a synthetic graph dataset with logical patterns for 8 features:
    [in_degree, out_degree, total_received, total_sent, avg_tx_value, tx_frequency, lifetime, unique_counterparties]
    """
    features = []
    labels = []
    
    for i in range(num_nodes):
        # 0: exchange (high volume, high degree)
        # 1: mining_pool (high out degree, high value, single source)
        # 2: mixer (equal in/out, very high frequency)
        # 3: gambling (high frequency, small values)
        # 4: darknet (low frequency, medium value, high unique counterparties)
        # 5: ransomware (few large incoming, single sweep out)
        # 6: personal (low degree, low frequency, long lifetime)
        # 7: unknown
        
        class_id = i % 8
        if class_id == 0: # exchange
            feat = [100.0, 100.0, 500.0, 500.0, 5.0, 10.0, 365.0, 150.0]
        elif class_id == 1: # mining_pool
            feat = [1.0, 200.0, 50.0, 50.0, 0.25, 5.0, 365.0, 200.0]
        elif class_id == 2: # mixer
            feat = [50.0, 50.0, 100.0, 100.0, 2.0, 20.0, 7.0, 100.0]
        elif class_id == 3: # gambling
            feat = [200.0, 20.0, 10.0, 5.0, 0.05, 50.0, 30.0, 150.0]
        elif class_id == 4: # darknet
            feat = [10.0, 10.0, 20.0, 20.0, 2.0, 0.5, 180.0, 20.0]
        elif class_id == 5: # ransomware
            feat = [5.0, 1.0, 100.0, 100.0, 20.0, 0.1, 10.0, 5.0]
        elif class_id == 6: # personal
            feat = [2.0, 2.0, 5.0, 5.0, 2.5, 0.05, 700.0, 3.0]
        else: # unknown
            feat = [1.0, 1.0, 1.0, 1.0, 1.0, 0.1, 30.0, 1.0]
            
        # Add some noise
        feat = [max(0.0, f + torch.randn(1).item() * (f * 0.1)) for f in feat]
        
        features.append(feat)
        labels.append(class_id)
        
    x = torch.tensor(features, dtype=torch.float)
    y = torch.tensor(labels, dtype=torch.long)
    
    # Create random edges for message passing
    edge_index = torch.randint(0, num_nodes, (2, num_nodes * 3), dtype=torch.long)
    
    return Data(x=x, edge_index=edge_index, y=y)

def train():
    os.makedirs('models', exist_ok=True)
    model_path = 'models/gnn_model.pth'
    
    print("Generating synthetic prototype data for GNN training...")
    data = generate_synthetic_training_data(1000)
    
    model = GraphSAGEClassifier(in_channels=8, out_channels=8)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)
    
    print("Training GraphSAGE model on synthetic topological patterns...")
    model.train()
    for epoch in range(100):
        optimizer.zero_grad()
        out = model(data.x, data.edge_index)
        loss = F.nll_loss(out, data.y)
        loss.backward()
        optimizer.step()
        
        if epoch % 20 == 0:
            pred = out.argmax(dim=1)
            acc = (pred == data.y).sum().item() / data.y.size(0)
            print(f"Epoch {epoch:03d}: Loss: {loss.item():.4f}, Acc: {acc:.4f}")
            
    torch.save(model.state_dict(), model_path)
    print(f"\nModel successfully trained and saved to {model_path}!")
    print("The backend tracer will now detect this model and perform live GNN inference.")

if __name__ == '__main__':
    train()
