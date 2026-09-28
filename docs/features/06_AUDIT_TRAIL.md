# Feature 06: Immutable Case Audit Trail & Chain of Custody

## 1. Context & Statutory Purpose

In Indian criminal investigations, electronic evidence must maintain an unbroken, verifiable **Chain of Custody** from initial intake to courtroom presentation. Under **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)**:
- The prosecution must submit an official certificate signed by the person in lawful charge of the electronic computer system.
- The certificate must state whether the system was operating reliably, details of any software interventions, and an exhaustive chronological record of who accessed the data and what analytical steps were executed.

Without an automated, tamper-resistant **Audit Trail**, defense attorneys routinely challenge blockchain evidence on grounds of analyst bias, undocumented manual tampering, or unauthorized data alterations.

---

## 2. Architecture & Event Taxonomy

The Audit Trail records every substantive system and investigator action as an immutable append-only event stored in Redis.

```
[Investigator UI / API Client]
        │
        ▼ (HTTP Request with Analyst Context)
[FastAPI Audit Middleware / Endpoint Handlers]
        │
        ▼ (Asynchronous Append)
[Redis Sorted Set: Timeline Score = Timestamp]
        │
        ▼ (Audit Event Hash)
[vasp:audit:{case_id}:{event_id}]
```

### Standardized Event Types (`AuditEventType`)

| Event Code | Category | Trigger Condition | Severity |
|---|---|---|---|
| `CASE_CREATED` | Case Management | Investigator registers new FIR case profile | INFO |
| `CASE_UPDATED` | Case Management | Officer edits case notes, victim details, or status | INFO |
| `TRACE_SUBMITTED` | Forensics | New multi-hop trace job enqueued | INFO |
| `TRACE_COMPLETED` | Forensics | Trace engine completes graph traversal & VASP search | INFO |
| `ATTRIBUTION_ACCEPTED`| Legal Decision | Investigating Officer formally validates VASP hypothesis | CRITICAL |
| `ATTRIBUTION_REJECTED`| Legal Decision | IO dismisses VASP match due to manual counter-evidence | WARNING |
| `FINDING_REVIEWED` | Forensics | Officer marks finding as Escalated / Dismissed | INFO |
| `DOSSIER_GENERATED` | Reporting | Section 63 BSA Evidence Dossier PDF compiled | CRITICAL |
| `BNSS94_GENERATED` | Legal Document | Section 94 BNSS Legal Production Notice compiled | CRITICAL |
| `EVIDENCE_VERIFIED` | Integrity | Cryptographic RFC-8785 hash chain walked & verified | INFO |
| `TAMPER_DETECTED` | Security | Integrity check discovers corrupted hash sequence | ALERT |

---

## 3. Data Models (Pydantic v2)

```python
# backend/app/blockchain/audit_models.py
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class AuditEventType(str, Enum):
    CASE_CREATED = "CASE_CREATED"
    CASE_UPDATED = "CASE_UPDATED"
    TRACE_SUBMITTED = "TRACE_SUBMITTED"
    TRACE_COMPLETED = "TRACE_COMPLETED"
    ATTRIBUTION_ACCEPTED = "ATTRIBUTION_ACCEPTED"
    ATTRIBUTION_REJECTED = "ATTRIBUTION_REJECTED"
    FINDING_REVIEWED = "FINDING_REVIEWED"
    DOSSIER_GENERATED = "DOSSIER_GENERATED"
    BNSS94_GENERATED = "BNSS94_GENERATED"
    EVIDENCE_VERIFIED = "EVIDENCE_VERIFIED"
    TAMPER_DETECTED = "TAMPER_DETECTED"


class AuditEvent(BaseModel):
    id: str = Field(..., description="Unique event identifier (e.g. AUD-0812-001)")
    case_id: str = Field(..., description="Associated investigation case ID")
    actor_id: str = Field(..., description="Officer badge ID or SYSTEM daemon")
    actor_role: str = Field(default="INVESTIGATING_OFFICER", description="Role: INVESTIGATOR, SUPERVISOR, ADMIN, AUDITOR")
    event_type: AuditEventType
    action_summary: str = Field(..., max_length=255, description="Clear plain-English log line for court testimony")
    target_entity: Optional[str] = Field(None, description="Affected wallet address, trace ID, or document ID")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Contextual parameters, diffs, or hashes")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    client_ip: Optional[str] = Field(default="127.0.0.1")
```

---

## 4. Redis Storage Strategy

The audit trail is organized in Redis using an append-only Sorted Set paired with individual event hash maps:

| Redis Key Pattern | Redis Type | Purpose | TTL |
|---|---|---|---|
| `vasp:audit:timeline:{case_id}` | Sorted Set (`ZSET`) | Ordered list of `event_id` scored by epoch millisecond timestamp | Permanent |
| `vasp:audit:{case_id}:{event_id}` | String (`JSON`) | Serialized `AuditEvent` payload | Permanent |
| `vasp:audit:count:{case_id}` | Counter (`INCR`) | Monotonic counter generating incremental IDs (`AUD-001`, `AUD-002`) | Permanent |

### Fast Keyset Pagination Query
To fetch audit entries chronologically:
```python
# Fetch latest 50 audit events for a case
event_ids = await redis.zrevrangebyscore(
    f"vasp:audit:timeline:{case_id}",
    max="+inf",
    min="-inf",
    start=0,
    num=50
)
```

---

## 5. API Endpoints Contract

### 1. Retrieve Case Audit Trail
- **Endpoint:** `GET /api/v1/cases/{case_id}/audit`
- **Query Params:** `limit` (default: 50), `offset` (default: 0), `event_type` (optional filter)
- **Response:**
```json
{
  "case_id": "case_9d81f2ab",
  "total_events": 14,
  "events": [
    {
      "id": "AUD-014",
      "case_id": "case_9d81f2ab",
      "actor_id": "IO_SHARMA_DELHI_CYBER",
      "actor_role": "INVESTIGATING_OFFICER",
      "event_type": "BNSS94_GENERATED",
      "action_summary": "Generated Section 94 BNSS Written Production Notice addressed to Binance Legal Compliance Desk.",
      "target_entity": "TBinanceUserDepositCandidate333333",
      "metadata": {
        "report_id": "REP-BNSS-9921",
        "sha256": "4a7b9c...31e"
      },
      "timestamp": "2026-09-28T11:45:00Z",
      "client_ip": "10.0.4.12"
    },
    {
      "id": "AUD-013",
      "case_id": "case_9d81f2ab",
      "actor_id": "IO_SHARMA_DELHI_CYBER",
      "actor_role": "INVESTIGATING_OFFICER",
      "event_type": "ATTRIBUTION_ACCEPTED",
      "action_summary": "Officer accepted attribution hypothesis linking candidate wallet to Binance.",
      "target_entity": "TBinanceUserDepositCandidate333333",
      "metadata": {
        "confidence": 0.816,
        "vasp": "Binance"
      },
      "timestamp": "2026-09-28T11:40:12Z",
      "client_ip": "10.0.4.12"
    }
  ]
}
```

### 2. Manual Investigator Action Log
- **Endpoint:** `POST /api/v1/cases/{case_id}/audit`
- **Request Body:**
```json
{
  "event_type": "CASE_UPDATED",
  "action_summary": "Added note: Called complainant to verify initial deposit tx hash.",
  "metadata": {"note_length": 56}
}
```

---

## 6. Integration with Section 63 BSA Dossier

When the Section 63 BSA PDF report is compiled, the system queries `GET /api/v1/cases/{case_id}/audit` and embeds the complete chronological table as **Appendix B: Forensic Audit Ledger & Chain of Custody**. 

This allows investigating officers to place the printed PDF directly into the court Case Diary (CD) with zero additional paperwork.
