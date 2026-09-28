"""
Centralized Redis Key Namespaces for SIH26182 VASP Attribution Engine.
Ensures zero key collisions, structured namespace hierarchy, and unified access patterns.
"""

# Case Management
KEY_CASE_PREFIX = "vasp:case:"                   # vasp:case:{case_id} -> Hash/JSON of Case
KEY_CASE_LIST = "vasp:cases:all"                 # Sorted set or Set of all case_ids
KEY_CASE_NOTES_PREFIX = "vasp:case:notes:"       # vasp:case:notes:{case_id} -> List of Note JSONs

# Evidence DAG & Hash Chaining
KEY_EVIDENCE_PREFIX = "vasp:evidence:"           # vasp:evidence:{case_id}:{evidence_id} -> EvidenceItem JSON
KEY_EVIDENCE_LIST_PREFIX = "vasp:evidence:list:" # vasp:evidence:list:{case_id} -> List of evidence_ids in order
KEY_EVIDENCE_CHAIN_HEAD = "vasp:evidence:head:"  # vasp:evidence:head:{case_id} -> Latest chain_hash string
KEY_EVIDENCE_DAG_PREFIX = "vasp:evidence:dag:"   # vasp:evidence:dag:{case_id} -> Set of "parent:child" edges

# Audit Trail
KEY_AUDIT_PREFIX = "vasp:audit:"                 # vasp:audit:{case_id}:{event_id} -> AuditEvent JSON
KEY_AUDIT_TIMELINE_PREFIX = "vasp:audit:timeline:" # vasp:audit:timeline:{case_id} -> ZSET (score: timestamp_ms)
KEY_AUDIT_COUNTER_PREFIX = "vasp:audit:count:"   # vasp:audit:count:{case_id} -> INCR integer

# Forensic Findings
KEY_FINDINGS_PREFIX = "vasp:findings:"           # vasp:findings:{case_id}:{finding_id} -> Finding JSON
KEY_FINDINGS_LIST_PREFIX = "vasp:findings:list:" # vasp:findings:list:{case_id} -> List of finding_ids

# Tracing Engine & Jobs (Retaining active worker compatibility)
TRACE_QUEUE_KEY = "vasp:trace:queue"             # List of pending TraceJobs
TRACE_PROCESSING_KEY = "vasp:trace:processing"   # List of active in-flight jobs
TRACE_STATE_PREFIX = "vasp:trace:state:"         # vasp:trace:state:{trace_id} -> status & result
KEY_RECENT_TRACES = "vasp:traces:recent"         # List of recent completed trace_ids

# Generated Reports & PDF Metadata
KEY_REPORTS_PREFIX = "vasp:reports:"             # vasp:reports:{case_id}:{report_id} -> Report Metadata JSON
KEY_REPORTS_LIST_PREFIX = "vasp:reports:list:"   # vasp:reports:list:{case_id} -> List of report_ids

def case_key(case_id: str) -> str:
    return f"{KEY_CASE_PREFIX}{case_id}"

def evidence_key(case_id: str, evidence_id: str) -> str:
    return f"{KEY_EVIDENCE_PREFIX}{case_id}:{evidence_id}"

def evidence_list_key(case_id: str) -> str:
    return f"{KEY_EVIDENCE_LIST_PREFIX}{case_id}"

def evidence_head_key(case_id: str) -> str:
    return f"{KEY_EVIDENCE_CHAIN_HEAD}{case_id}"

def evidence_dag_key(case_id: str) -> str:
    return f"{KEY_EVIDENCE_DAG_PREFIX}{case_id}"

def audit_event_key(case_id: str, event_id: str) -> str:
    return f"{KEY_AUDIT_PREFIX}{case_id}:{event_id}"

def audit_timeline_key(case_id: str) -> str:
    return f"{KEY_AUDIT_TIMELINE_PREFIX}{case_id}"

def audit_counter_key(case_id: str) -> str:
    return f"{KEY_AUDIT_COUNTER_PREFIX}{case_id}"

def findings_key(case_id: str, finding_id: str) -> str:
    return f"{KEY_FINDINGS_PREFIX}{case_id}:{finding_id}"

def findings_list_key(case_id: str) -> str:
    return f"{KEY_FINDINGS_LIST_PREFIX}{case_id}"

def report_key(case_id: str, report_id: str) -> str:
    return f"{KEY_REPORTS_PREFIX}{case_id}:{report_id}"

def report_list_key(case_id: str) -> str:
    return f"{KEY_REPORTS_LIST_PREFIX}{case_id}"
