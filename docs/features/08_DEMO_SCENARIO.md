# Feature Specification: Pre-seeded Demo Scenario

## 1. Overview
For the SIH 2026 judging panel, a fully populated canonical scenario is required to demonstrate the platform's capabilities without waiting for live blockchain indexing. The demo features an Indian cybercrime case (task-based investment scam).

## 2. Canonical Scenario Details
- **FIR**: FIR-2026-MH-CY-1234
- **Victim**: Priya Sharma
- **Modus Operandi**: Telegram task-based investment scam
- **Loss**: ₹25,00,000 (approx. 30,000 USDT equivalent)
- **Chain**: Ethereum
- **Root Suspect Address**: `0xdac17f958d2ee523a2206206994597c13d831ec7` (Tether USD contract, used as a placeholder for a high-volume address in demo context, or a specific known scammer address)

## 3. Demo Data Payloads

### 3.1 Case Record JSON
```json
{
  "id": "demo-case-1234",
  "fir_number": "FIR-2026-MH-CY-1234",
  "title": "Telegram Investment Scam - Priya Sharma",
  "description": "Victim defrauded of 30,000 USDT via Telegram task-based scam.",
  "status": "OPEN",
  "chain": "ethereum",
  "created_at": "2026-09-28T10:00:00Z"
}
```

### 3.2 Pre-computed Trace Graph JSON
```json
{
  "trace_id": "demo-trace-1",
  "case_id": "demo-case-1234",
  "nodes": [
    {"id": "0xVictimAddress", "label": "Victim Wallet", "type": "EOA"},
    {"id": "0xScammerAddress", "label": "Scammer Node", "type": "EOA"},
    {"id": "0xMixerAddress", "label": "Tornado Cash", "type": "CONTRACT"}
  ],
  "edges": [
    {"source": "0xVictimAddress", "target": "0xScammerAddress", "value": "30000", "asset": "USDT"},
    {"source": "0xScammerAddress", "target": "0xMixerAddress", "value": "29900", "asset": "USDT"}
  ]
}
```

### 3.3 Evidence Items
```json
[
  {
    "id": "ev-1",
    "type": "OBSERVED",
    "description": "Initial transfer from victim to scammer",
    "tx_hash": "0xabc123..."
  }
]
```

### 3.4 Findings
```json
[
  {
    "id": "find-1",
    "case_id": "demo-case-1234",
    "type": "mixer_detected",
    "severity": "high",
    "title": "Tornado Cash Interaction",
    "description": "Funds traced to known Tornado Cash mixer contract."
  }
]
```

## 4. API Endpoint

**POST** `/api/v1/demo/seed`
Populates Redis with the predefined JSON objects. 

```python
@router.post("/demo/seed")
async def seed_demo_data(redis: Redis = Depends(get_redis)):
    # Load JSON payloads and inject into Redis
    # case:demo-case-1234
    # trace:demo-trace-1
    # ...
    return {"message": "Demo data seeded successfully"}
```

## 5. Frontend Integration
In the Dashboard page (`app/dashboard/page.tsx`), include a "Load Demo Scenario" button.

```tsx
<Button onClick={handleSeedDemo} variant="secondary">
    Load SIH Demo Scenario
</Button>
```

## 6. Walkthrough Script for Judges
1. **Login/Dashboard**: Click "Load Demo Scenario". The dashboard populates with `FIR-2026-MH-CY-1234`.
2. **Case Detail**: Click on the case. View victim details and initial ledger entries.
3. **Trace View**: Navigate to the "Trace Graph" tab. The pre-computed graph visualizes the flow from Victim -> Scammer -> Mixer.
4. **Findings**: Go to the "Findings" tab to see auto-detected alerts (e.g., Mixer detected).
5. **Report Generation**: Click "Generate Court-Admissible Report" to download the PDF.
