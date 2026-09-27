import os
import torch
import torch.nn.functional as F
from torch.optim.lr_scheduler import ReduceLROnPlateau
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from typing import Dict, Any

def train_model(model: torch.nn.Module, data, epochs: int = 200, lr: float = 0.01, save_dir: str = "backend/models/") -> torch.nn.Module:
    """
    Training pipeline for the GNN model with early stopping, LR scheduling, 
    and class weight handling for imbalanced datasets.
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    data = data.to(device)
    
    # Calculate class weights for CrossEntropyLoss to handle imbalance
    train_labels = data.y[data.train_mask]
    class_counts = torch.bincount(train_labels)
    total_samples = train_labels.size(0)
    class_weights = total_samples / (len(class_counts) * class_counts.float())
    # Handle potentially zero counts
    class_weights[torch.isinf(class_weights)] = 1.0
    class_weights = class_weights.to(device)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=5e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=10, verbose=True)
    
    best_val_acc = 0.0
    patience = 20
    patience_counter = 0
    best_model_state = None
    
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "best_gnn_model.pth")
    
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()
        out = model(data.x, data.edge_index)
        loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask], weight=class_weights)
        loss.backward()
        optimizer.step()
        
        # Validation
        model.eval()
        with torch.no_grad():
            pred = model(data.x, data.edge_index).argmax(dim=1)
            correct = (pred[data.val_mask] == data.y[data.val_mask]).sum()
            val_acc = int(correct) / int(data.val_mask.sum())
            
        scheduler.step(val_acc)
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            best_model_state = model.state_dict()
            torch.save(best_model_state, save_path)
        else:
            patience_counter += 1
            
        if epoch % 10 == 0:
            print(f'Epoch {epoch:03d}, Loss: {loss:.4f}, Val Acc: {val_acc:.4f}')
            
        if patience_counter >= patience:
            print(f"Early stopping at epoch {epoch}")
            break
            
    if best_model_state:
        model.load_state_dict(best_model_state)
        
    return model

def evaluate_model(model: torch.nn.Module, data) -> Dict[str, Any]:
    """
    Evaluates the trained model on the test set and calculates metrics:
    Confusion Matrix, Classification Report, and ROC-AUC.
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    data = data.to(device)
    model.eval()
    
    with torch.no_grad():
        out = model(data.x, data.edge_index)
        probs = torch.exp(out) # Since we use log_softmax
        pred = out.argmax(dim=1)
        
    y_test = data.y[data.test_mask].cpu().numpy()
    pred_test = pred[data.test_mask].cpu().numpy()
    probs_test = probs[data.test_mask].cpu().numpy()
    
    conf_matrix = confusion_matrix(y_test, pred_test)
    report = classification_report(y_test, pred_test, output_dict=True, zero_division=0)
    
    # Calculate ROC-AUC per class (One-vs-Rest) if applicable
    try:
        if probs_test.shape[1] == 2:
            roc_auc = roc_auc_score(y_test, probs_test[:, 1])
        else:
            roc_auc = roc_auc_score(y_test, probs_test, multi_class='ovr')
    except Exception as e:
        roc_auc = None # E.g., if only one class is present in test set
        
    return {
        "confusion_matrix": conf_matrix,
        "classification_report": report,
        "roc_auc": roc_auc
    }
