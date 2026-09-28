# Master Architecture Document: SIH26182 VASP Attribution Engine

## 1. Executive Summary
The VASP Attribution Engine is a specialized law-enforcement blockchain forensic platform designed to trace illicit cryptocurrency flows across Ethereum and Tron blockchains. By leveraging Graph Neural Networks (GNN) and a priority-queue Breadth-First Search (BFS) combined with a hop-decay risk model, the platform attributes anonymous addresses to known Virtual Asset Service Providers (VASPs).

## 2. Current State vs Target State

### Current State
```ascii
[ Next.js Frontend ] ---> [ FastAPI Backend ]
  (React Flow)                (Python 3.14)
       |                            |
       v                            v
[ Local State ]               [ Redis ] (24h TTL)
                            [ GNN / Priority BFS ]
```

### Target State
```ascii
                                            [ Docker Compose Network ]
[ Next.js Frontend ] ---> [ Nginx Proxy ] ---> [ FastAPI Backend ]
(Pages: Dashboard,                                |   |   |
 Trace, Clusters,                                 |   |   |
 Reports, Alerts, Cases)                          |   |   +--> [ Redis (Case Data + Job Queue) ]
       |                                          |   |
       v                                          |   +--> [ GNN Inference Engine (PyTorch) ]
[ React Query / Zustand ]                         |
                                                  +--> [ PDF Generator (ReportLab) ]
                                                  |
                                                  +--> [ Evidence Hash Chain (SHA-256) ]
```

## 3. Feature Roadmap (9 New Features)
1. **Legal Framework Update**: Transition from CrPC/IEA to BSA/BNSS 2023.
2. **Case Management**: Organize traces into case dossiers.
3. **PDF Export**: Court-admissible reports with SHA-256 evidence hashing.
4. **Evidence DAG**: Tamper-proof logging of trace progression.
5. **RBAC Authentication**: Role-based access control (Admin, Investigator, Analyst).
6. **Audit Trail**: Immutable activity logs for chain-of-custody.
7. **Time-Machine Slider**: Temporal graph visualization to view address states at specific timestamps.
8. **Dual-Chain Correlation**: Link Ethereum and Tron traces.
9. **Dockerization**: Complete containerized deployment for on-premise execution.

## 4. Component Architecture
* **Frontend**: Next.js 16 (App Router), React 19, React Flow & Cytoscape (Graph Vis), Tailwind CSS.
* **Backend**: FastAPI (Python 3.14), Redis (Primary Datastore), PyTorch (GraphSAGE GNN), ReportLab (PDFs).

## 5. Data Flow
- **Trace Flow**: User input address -> API `/trace` -> Redis Job Queue -> BFS Worker -> GNN Inference -> Redis Result -> Client Polling.
- **Case Flow**: Create Case -> Link Traces -> Add Notes -> Change Status.

## 6. Redis Key Schema
- `vasp:case:{case_id}`: Hash mapping case data.
- `vasp:trace:{trace_id}`: JSON trace result.
- `vasp:audit:{case_id}`: List of audit trail entries.

## 7. API Endpoint Inventory
- `POST /api/v1/trace`
- `GET /api/v1/trace/{id}`
- `POST /api/v1/cases`
- `GET /api/v1/cases`
- `POST /api/v1/reports/dossier`

## 8. Deployment Model
Docker Compose target with isolated networks for web, app, and cache tiers. No external database required to simplify LEA on-prem deployment.
