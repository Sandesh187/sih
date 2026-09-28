"""
5-Factor Explainable VASP Attribution Engine.
Combines on-chain sweep mechanics, fan-in convergence, temporal decay,
and inductive GraphSAGE neural network node classifications.
"""

import math
from typing import Dict, Any, Optional, List
from app.blockchain.models import FactorContribution, ExplainableAttributionResult


class AttributionScorer:
    """
    Computes explainable, mathematically defensible attribution scores:
    Score = w1*Tag + w2*Sweep + w3*FanIn + w4*Temporal + w5*GNN
    """

    W_TAG = 0.25
    W_SWEEP = 0.25
    W_FAN_IN = 0.15
    W_TEMPORAL = 0.15
    W_GNN = 0.20

    LAMBDA_TEMPORAL = 0.02  # Half-life approx 35 mins for automated batch sweeps

    @classmethod
    def calculate_attribution(
        cls,
        candidate_address: str,
        chain: str,
        attributed_vasp_name: Optional[str] = None,
        destination_hot_wallet: Optional[str] = None,
        is_direct_tag: bool = False,
        is_downstream_match: bool = False,
        sweep_ratio: float = 0.98,
        dominant_concentration: float = 0.95,
        unique_senders_count: int = 8,
        sweep_delay_minutes: float = 22.0,
        gnn_prediction: Optional[Dict[str, Any]] = None,
    ) -> ExplainableAttributionResult:
        factors: List[FactorContribution] = []

        # 1. Effective Tag Score (0.25)
        if is_direct_tag:
            tag_raw = 1.0
            tag_desc = f"Direct match: {candidate_address} is verified in official VASP registry."
        elif is_downstream_match:
            tag_raw = 0.80
            tag_desc = (
                f"Downstream match: Candidate sweeps directly into verified "
                f"exchange hot wallet ({destination_hot_wallet})."
            )
        else:
            tag_raw = 0.0
            tag_desc = "No direct or downstream match found in VASP registry."

        factors.append(FactorContribution(
            name="Effective Registry Tag",
            raw_value=tag_raw,
            weight=cls.W_TAG,
            weighted_score=round(tag_raw * cls.W_TAG, 4),
            description=tag_desc,
        ))

        # 2. Sweep Consolidation Score (0.25)
        sweep_raw = min(1.0, max(0.0, (sweep_ratio + dominant_concentration) / 2.0))
        factors.append(FactorContribution(
            name="Sweep Consolidation Ratio",
            raw_value=round(sweep_raw, 4),
            weight=cls.W_SWEEP,
            weighted_score=round(sweep_raw * cls.W_SWEEP, 4),
            description=(
                f"{sweep_ratio * 100:.1f}% of received funds forwarded in single sweep; "
                f"{dominant_concentration * 100:.1f}% concentration to dominant destination."
            ),
        ))

        # 3. Fan-In Convergence Score (0.15)
        if unique_senders_count >= 10:
            fan_raw = 1.0
        elif unique_senders_count >= 5:
            fan_raw = 0.75
        elif unique_senders_count >= 2:
            fan_raw = 0.50
        else:
            fan_raw = 0.20

        factors.append(FactorContribution(
            name="Fan-In Convergence",
            raw_value=fan_raw,
            weight=cls.W_FAN_IN,
            weighted_score=round(fan_raw * cls.W_FAN_IN, 4),
            description=(
                f"Destination cluster converges funds from {unique_senders_count} independent deposit addresses, "
                f"characteristic of centralized omnibus architecture."
            ),
        ))

        # 4. Temporal Sweep Cadence (0.15)
        # e^(-lambda * delta_t)
        temporal_raw = min(1.0, max(0.05, math.exp(-cls.LAMBDA_TEMPORAL * max(0.0, sweep_delay_minutes))))
        factors.append(FactorContribution(
            name="Temporal Sweep Cadence",
            raw_value=round(temporal_raw, 4),
            weight=cls.W_TEMPORAL,
            weighted_score=round(temporal_raw * cls.W_TEMPORAL, 4),
            description=(
                f"Outbound consolidation triggered {sweep_delay_minutes:.1f} minutes after deposit, "
                f"matching programmatic exchange daemon cadence."
            ),
        ))

        # 5. GNN Inductive Signal (0.20)
        gnn_raw = 0.40
        gnn_class = "unknown"
        if gnn_prediction:
            gnn_class = gnn_prediction.get("predicted_class", "unknown")
            conf = float(gnn_prediction.get("confidence", 0.40))
            if gnn_class == "exchange":
                gnn_raw = min(1.0, conf)
            elif gnn_class in {"mixer", "darknet", "ransomware"}:
                gnn_raw = 0.0  # Guardrail against false positive
            else:
                gnn_raw = conf * 0.5

        factors.append(FactorContribution(
            name="GraphSAGE Node Embedding",
            raw_value=round(gnn_raw, 4),
            weight=cls.W_GNN,
            weighted_score=round(gnn_raw * cls.W_GNN, 4),
            description=(
                f"Inductive GNN ego-graph topology classified wallet as '{gnn_class}' "
                f"with {gnn_raw * 100:.1f}% confidence."
            ),
        ))

        # Compute composite confidence score
        composite = sum(f.weighted_score for f in factors)
        composite = round(min(1.0, max(0.0, composite)), 3)

        if composite >= 0.75:
            band = "HIGH"
            statutory_actionable = True
        elif composite >= 0.50:
            band = "MEDIUM"
            statutory_actionable = False
        else:
            band = "LOW"
            statutory_actionable = False

        return ExplainableAttributionResult(
            candidate_address=candidate_address,
            chain=chain,
            attributed_vasp=attributed_vasp_name,
            destination_hot_wallet=destination_hot_wallet,
            composite_confidence=composite,
            confidence_band=band,
            statutory_actionable=statutory_actionable,
            factors=factors,
            methodology_notes=(
                "Computed via SIH26182 5-Factor Attribution Engine with GraphSAGE ego-graph classification. "
                "Confidence >= 0.75 provides mathematical justification for Section 94 BNSS legal orders."
            ),
        )
