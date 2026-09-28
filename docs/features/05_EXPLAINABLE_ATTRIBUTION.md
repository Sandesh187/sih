# Feature 05: Multi-Factor Explainable VASP Attribution Engine

## 1. Executive Summary & Objective

In forensic cryptocurrency investigations, establishing that an unhosted wallet belongs to a custodial Virtual Asset Service Provider (VASP) like Binance, Coinbase, CoinDCX, or WazirX is the critical link required to serve legal freezing orders. 

Existing open-source tools either:
1. Rely purely on direct registry lookups (failing for 99% of user deposit addresses, which are dynamic and untagged).
2. Use opaque black-box constants (e.g., `confidence = 0.9 if peel else 0.7`), which are easily challenged by defense counsel in court.

This feature implements a **deterministic, transparent, 5-factor mathematical attribution model** that combines behavioral on-chain heuristics with Graph Neural Network (GNN) topological embeddings:

$$\text{Confidence Score} = w_1 \cdot \text{Tag} + w_2 \cdot \text{Sweep} + w_3 \cdot \text{FanIn} + w_4 \cdot \text{Temporal} + w_5 \cdot \text{GNN}$$

Every score generated is fully decomposed into its constituent factor weights, values, and explanations, providing a mathematically defensible evidentiary trail for law enforcement and judges.

---

## 2. Mathematical Attribution Formulation

$$\text{AttributionScore}(A) = \sum_{k=1}^{5} w_k \cdot F_k(A)$$

Subject to $\sum_{k=1}^5 w_k = 1.0$, where weights are distributed as:

| Factor | Name | Weight ($w_k$) | Description |
|---|---|---|---|
| $F_1$ | **Effective Tag Score** | **0.25** | Direct registry tag or discount-weighted downstream hot wallet match |
| $F_2$ | **Sweep Consolidation Score** | **0.25** | Proportion of received funds swept into omnibus exchange aggregation pool |
| $F_3$ | **Fan-In Convergence Score** | **0.15** | Sender diversity converging into the target cluster |
| $F_4$ | **Temporal Decay Score** | **0.15** | Programmatic sweep latency ($e^{-\lambda \Delta t}$) characteristic of exchange daemons |
| $F_5$ | **GNN Behavioral Signal** | **0.20** | GraphSAGE inductive node embedding score (**Our Unique Advantage**) |

---

## 3. Factor Breakdown & Formulas

### Factor 1: Effective Tag Score ($F_1$, $w_1 = 0.25$)
Differentiates between direct registry verification and indirect downstream aggregation:

$$F_1 = \begin{cases} 
1.0 & \text{if address } A \in \text{KnownVASPRegistry} \\
0.80 & \text{if } A \to V \text{ where } V \in \text{KnownVASPRegistry (Downstream Sweep)} \\
0.0 & \text{otherwise}
\end{cases}$$

### Factor 2: Sweep Consolidation Ratio ($F_2$, $w_2 = 0.25$)
Exchange deposit addresses are swept almost entirely (typically $>98\%$) to the omnibus hot wallet:

$$\text{SweepRatio} = \frac{\text{Volume Swept to Destination}}{\text{Total Volume Received by } A}$$

$$\text{Concentration} = \frac{\text{Volume to Dominant Outgoing}}{\text{Total Outgoing from } A}$$

$$F_2 = \min\left(1.0, \, \frac{\text{SweepRatio} + \text{Concentration}}{2}\right)$$

### Factor 3: Fan-In Convergence ($F_3$, $w_3 = 0.15$)
Evaluates whether multiple independent senders converge into the candidate or its destination cluster:

$$F_3 = \begin{cases}
1.0 & \text{if unique incoming senders } N \ge 10 \\
0.75 & \text{if } 5 \le N < 10 \\
0.50 & \text{if } 2 \le N < 5 \\
0.20 & \text{if } N = 1 \text{ (single sender)}
\end{cases}$$

### Factor 4: Temporal Sweep Cadence ($F_4$, $w_4 = 0.15$)
Automated exchange daemons sweep customer deposits within minutes of block confirmation (typically 10–45 mins). Human transfers take hours or days:

$$F_4 = e^{-\lambda \cdot \Delta t}$$

Where:
- $\Delta t$ is the time delta in minutes between inbound deposit and outbound sweep.
- $\lambda = 0.02$ (half-life $\approx 35\text{ minutes}$).
- Transfers under 15 minutes score $\approx 0.95+$. Transfers taking $>6\text{ hours}$ decay towards $0.05$.

### Factor 5: GNN Inductive Signal ($F_5$, $w_5 = 0.20$)
Our proprietary 3-layer GraphSAGE classifier analyzes the 2-hop ego graph topology (degrees, volume variances, burst frequencies):

$$F_5 = P(\text{class} = \text{"exchange"} \mid \text{EgoGraph}(A))$$

If the GNN detects mixer or darknet patterns, $F_5$ drops to $0.0$, acting as a guardrail against false-positive exchange attributions.

---

## 4. Confidence Threshold Bands

| Confidence Band | Score Range | Legal Actionability |
|---|---|---|
| **HIGH CONFIDENCE** | $\ge 0.75$ | Sufficient evidentiary basis to issue formal **Section 94 BNSS Legal Production Notice** to VASP. |
| **MEDIUM CONFIDENCE** | $0.50 - 0.74$ | Probabilistic match. Requires secondary hop verification or corroborating victim payment gateway logs. |
| **LOW / UNVERIFIED** | $< 0.50$ | Insufficient forensic basis. Treated as unidentified unhosted wallet. |

---

## 5. Pydantic Models & API Schemas

```python
# backend/app/blockchain/attribution_models.py
from typing import List, Optional
from pydantic import BaseModel, Field


class FactorContribution(BaseModel):
    name: str = Field(..., description="Factor label (e.g. Effective Tag, Sweep Consolidation)")
    raw_value: float = Field(..., ge=0.0, le=1.0, description="Raw normalized factor score (0.0 to 1.0)")
    weight: float = Field(..., ge=0.0, le=1.0, description="Weight assigned in attribution formula")
    weighted_score: float = Field(..., ge=0.0, le=1.0, description="raw_value * weight")
    description: str = Field(..., description="Human-readable forensic rationale for investigator")


class ExplainableAttributionResult(BaseModel):
    candidate_address: str
    chain: str
    attributed_vasp: Optional[str] = None
    destination_hot_wallet: Optional[str] = None
    composite_confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_band: str = Field(..., description="HIGH, MEDIUM, or LOW")
    statutory_actionable: bool = Field(..., description="True if score >= 0.75 for Section 94 BNSS")
    factors: List[FactorContribution]
    methodology_notes: str
```

---

## 6. API Response Example

`GET /api/v1/traces/{trace_id}/attribution`

```json
{
  "candidate_address": "0x71660c4005ba85c37ccec55d0c4493e66fe775d3",
  "chain": "ethereum",
  "attributed_vasp": "Coinbase",
  "destination_hot_wallet": "0x5041ed759dd4afc3a72b8192c143f72f4724081a",
  "composite_confidence": 0.826,
  "confidence_band": "HIGH",
  "statutory_actionable": true,
  "factors": [
    {
      "name": "Effective Tag",
      "raw_value": 0.80,
      "weight": 0.25,
      "weighted_score": 0.200,
      "description": "Downstream sweep verified to Coinbase 4 Omnibus Hot Wallet."
    },
    {
      "name": "Sweep Consolidation",
      "raw_value": 0.98,
      "weight": 0.25,
      "weighted_score": 0.245,
      "description": "98.2% of deposited ETH swept in single immediate transaction."
    },
    {
      "name": "Fan-In Convergence",
      "raw_value": 0.75,
      "weight": 0.15,
      "weighted_score": 0.112,
      "description": "Destination receives convergent sweeps from 8 distinct deposit wallets."
    },
    {
      "name": "Temporal Sweep Cadence",
      "raw_value": 0.86,
      "weight": 0.15,
      "weighted_score": 0.129,
      "description": "Sweep occurred 18 minutes after deposit, consistent with automated daemon."
    },
    {
      "name": "GNN Topological Embedding",
      "raw_value": 0.70,
      "weight": 0.20,
      "weighted_score": 0.140,
      "description": "GraphSAGE 2-hop structural embedding classified node as exchange with 70% probability."
    }
  ],
  "methodology_notes": "Computed using SIH26182 5-Factor attribution engine with GNN topology integration."
}
```

---

## 7. Frontend Visualization (Wireframe)

The `RiskAssessment.tsx` and `TraceResults.tsx` components are updated to render:
1. **Top Badge:** `82.6% - HIGH CONFIDENCE (Statutory Actionable under Section 94 BNSS)`
2. **Decomposed Bar Chart:** 5 horizontal bars with hover tooltips showing raw value, weight, and plain-English legal justification.
3. **Download Statutory Notice Button:** Automatically enabled when `statutory_actionable == true`.
