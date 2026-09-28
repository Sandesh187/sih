# Feature Specification: Forensic Findings and Review System

## 1. Overview
The Forensic Findings and Review System is an automated analysis layer for the SIH26182 VASP Attribution Engine. During the graph traversal and tracing phase, the system automatically detects suspicious topological patterns (e.g., peel chains, mixers) and flags them as structured "Findings". Investigators can review, escalate, or dismiss these findings, incorporating them into their final forensic report.

## 2. Core Entities & Data Models

### 2.1 Finding Status and Severity Enums
```python
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class FindingStatus(str, Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    ESCALATED = "escalated"
    DISMISSED = "dismissed"

class FindingType(str, Enum):
    MIXER_DETECTED = "mixer_detected"
    LARGE_TRANSFER = "large_transfer"
    PEEL_CHAIN = "peel_chain"
    RAPID_SWEEP = "rapid_sweep"
    SANCTIONED_INTERACTION = "sanctioned_interaction"
    CROSS_CHAIN_BRIDGE = "cross_chain_bridge"
    UNUSUAL_PATTERN = "unusual_pattern"
```

### 2.2 Finding Model
```python
class ForensicFinding(BaseModel):
    id: str
    case_id: str
    trace_id: str
    type: FindingType
    severity: FindingSeverity
    title: str
    description: str
    affected_addresses: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    status: FindingStatus = FindingStatus.NEW
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForensicFindingCreate(BaseModel):
    case_id: str
    trace_id: str
    type: FindingType
    severity: FindingSeverity
    title: str
    description: str
    affected_addresses: List[str]
    evidence_ids: List[str]

class ForensicFindingReview(BaseModel):
    status: FindingStatus
    reviewed_by: str
```

## 3. Auto-Detection Logic (`tracer.py`)
Findings are generated based on graph topology metrics computed during or after the trace.

```python
import networkx as nx

def detect_findings(G: nx.DiGraph, trace_id: str, case_id: str) -> List[ForensicFindingCreate]:
    findings = []
    
    # 1. Mixer Detection (High in-degree and high out-degree)
    for node in G.nodes():
        in_deg = G.in_degree(node)
        out_deg = G.out_degree(node)
        if in_deg > 50 and out_deg > 50:
            findings.append(ForensicFindingCreate(
                case_id=case_id,
                trace_id=trace_id,
                type=FindingType.MIXER_DETECTED,
                severity=FindingSeverity.HIGH,
                title="Potential Mixer Identified",
                description=f"Address {node} exhibits behavior typical of a mixer/tumbler with {in_deg} inputs and {out_deg} outputs.",
                affected_addresses=[node],
                evidence_ids=[]
            ))
            
    # 2. Peel Chain Detection
    # Identify linear chains of transactions with decreasing values
    # Simplified logic:
    # ...

    return findings
```

## 4. API Endpoints

### 4.1 List Findings for a Case
**GET** `/api/v1/cases/{case_id}/findings`
- **Response**: `List[ForensicFinding]`

### 4.2 List Findings for a Trace
**GET** `/api/v1/traces/{trace_id}/findings`
- **Response**: `List[ForensicFinding]`

### 4.3 Review Finding
**POST** `/api/v1/cases/{case_id}/findings/{finding_id}/review`
- **Request Body**: `ForensicFindingReview`
- **Response**: `ForensicFinding` (updated)

## 5. Frontend Implementation (Next.js 16 + React 19)

### 5.1 Findings Tab Component
Located in `components/cases/FindingsTab.tsx`.

Displays a grid/list of findings.

```tsx
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const FindingsTab = ({ findings }) => {
    return (
        <div className="space-y-4">
            {findings.map(finding => (
                <div key={finding.id} className="border p-4 rounded-lg bg-white shadow-sm flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg">{finding.title}</h4>
                        <Badge variant={finding.severity === 'critical' ? 'destructive' : 'default'}>
                            {finding.severity.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-gray-600">{finding.description}</p>
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">Accept</Button>
                        <Button variant="outline" size="sm">Escalate</Button>
                        <Button variant="ghost" size="sm" className="text-red-500">Dismiss</Button>
                    </div>
                </div>
            ))}
        </div>
    );
};
```

## 6. Storage in Redis
Findings will be stored in Redis Hashes.
- Key format: `case:{case_id}:finding:{finding_id}`
- Set format for case findings: `case:{case_id}:findings` (Set of finding_ids)
