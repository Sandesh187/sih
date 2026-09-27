from typing import List, Dict, Any
from app.blockchain.models import RiskScore

class RiskScorer:
    def __init__(self):
        # Known risky entities could be loaded from DB/config
        self.known_mixers = set(["Tornado Cash", "Blender.io"])
        self.sanctioned_entities = set(["Lazarus Group", "Hydra"])
        self.darknet_markets = set(["Silk Road", "AlphaBay", "Genesis"])
        
    def calculate_risk(
        self, 
        address: str, 
        chain: str, 
        transactions: List[Dict[str, Any]], 
        cluster_info: Dict[str, Any] = None
    ) -> RiskScore:
        
        score = 0.0
        factors = []
        breakdown = {
            "mixer_interaction": 0.0,
            "darknet_exposure": 0.0,
            "high_frequency": 0.0,
            "new_wallet": 0.0,
            "sanctioned_proximity": 0.0
        }
        
        tx_count = len(transactions)
        
        # 1. High frequency transfers
        if tx_count > 1000:
            breakdown["high_frequency"] = 15.0
            factors.append("High transaction frequency indicating potential automated sweeping")
            score += 15.0
        elif tx_count > 100:
            breakdown["high_frequency"] = 5.0
            score += 5.0
            
        # 2. Check for interactions with mixers/sanctioned entities (mock implementation)
        # In a real engine, we would check the counterparty addresses against a threat intel DB
        has_mixer = False
        has_darknet = False
        has_sanctioned = False
        
        # Pseudo-check from cluster info or tags
        if cluster_info:
            category = cluster_info.get("category", "")
            if category == "mixer":
                has_mixer = True
            elif category == "darknet":
                has_darknet = True
            elif category == "sanctioned":
                has_sanctioned = True
                
        if has_mixer:
            breakdown["mixer_interaction"] = 30.0
            factors.append("Direct interaction with known cryptocurrency mixer")
            score += 30.0
            
        if has_darknet:
            breakdown["darknet_exposure"] = 25.0
            factors.append("Exposure to darknet market addresses")
            score += 25.0
            
        if has_sanctioned:
            breakdown["sanctioned_proximity"] = 40.0
            factors.append("Proximity to sanctioned entities")
            score += 40.0
            
        # Ensure score is bound between 0 and 100
        final_score = min(max(score, 0.0), 100.0)
        
        if final_score == 0:
            factors.append("No clear risk indicators detected")
            
        return RiskScore(
            address=address,
            chain=chain,
            score=final_score,
            factors=factors,
            breakdown=breakdown
        )
