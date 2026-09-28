# Feature Specification: Case Management

## 1. Overview
The Case Management system allows investigators to organize multiple blockchain traces under a single FIR/Case. This matches competitor features (Crypto-Tracer) while maintaining our lightweight, Redis-only architecture.

## 2. Redis Data Model
Key Pattern: `vasp:case:{case_id}` (Hash)
Fields:
- `id`: UUID string
- `fir_number`: string
- `complainant_name`: string
- `loss_amount_inr`: float
- `loss_amount_crypto`: float
- `chain`: string (ETH/TRON/MULTICHAIN)
- `status`: draft | active | under_review | closed
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp
- `traces`: JSON string (list of trace UUIDs)
- `notes`: JSON string (list of note objects: `{timestamp, user, content}`)

## 3. Pydantic Models
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CaseCreate(BaseModel):
    fir_number: str
    complainant_name: str
    loss_amount_inr: float
    chain: str

class CaseResponse(CaseCreate):
    id: str
    status: str
    created_at: datetime
    traces: List[str]
```

## 4. Backend API Endpoints
- `POST /api/v1/cases`: Create case.
- `GET /api/v1/cases`: List all cases.
- `GET /api/v1/cases/{id}`: Get case detail.
- `PATCH /api/v1/cases/{id}`: Update case (e.g. status).
- `POST /api/v1/cases/{id}/notes`: Append note.
- `POST /api/v1/cases/{id}/traces`: Link trace ID.

## 5. Frontend UI
- `/cases`: Main case dashboard with data table.
- `/cases/[id]`: Detail view showing case metadata, linked traces (mini graph view), and chronological case notes.
- "Link to Case" button in the Trace results view.
