# Feature Specification: PDF Export & Legal Reports

## 1. Overview
Generate court-admissible PDF documents. We will utilize `reportlab` in the Python backend to construct precise legal templates incorporating trace data, visualizations, and cryptographic hashes.

## 2. Document Types
### A. Section 63 BSA Evidence Dossier
Includes:
- Case details and summary.
- Transaction ledger table (hops, amounts, timestamps).
- Graph snapshot description.
- SHA-256 hash chain of the evidence data.
- Admissibility certificate (Section 63 BSA).

### B. Section 94 BNSS Production Notice
Includes:
- Addressed to VASP compliance officer.
- Statutory language and FIR details.
- Target deposit addresses.
- Demands for KYC, bank accounts, and IP logs.

## 3. Backend Implementation
- Library: `reportlab`
- Output Directory: `backend/generated_reports/`
- Filenames: `{case_id}_{report_type}_{timestamp}.pdf`

### API Endpoints
- `POST /api/v1/cases/{id}/reports/dossier`
  - Body: `{ "include_graphs": true, "trace_ids": [...] }`
  - Returns: `{ "download_url": "/api/v1/reports/dl/{uuid}.pdf" }`
- `POST /api/v1/cases/{id}/reports/bnss94`
  - Body: `{ "exchange_id": "binance", "addresses": [...] }`
  - Returns: `{ "download_url": "/api/v1/reports/dl/{uuid}.pdf" }`
- `GET /api/v1/reports/dl/{filename}`
  - Returns: `application/pdf` binary stream.

## 4. Hashing Mechanism
A SHA-256 hash is generated from the concatenated JSON representation of all included traces. This hash is printed at the footer of every page in the Evidence Dossier to prove non-repudiation.

## 5. Frontend Integration
- Buttons in the Case Details `/cases/[id]` view.
- A dedicated "Generate Notice" modal with VASP auto-completion from `vasp_labels.json`.
