# Backend services

Tracing requires Redis and a worker process. Configure Redis with persistence enabled in production.

For full setup instructions, please see the `README.md` at the root of the repository, or use the `start_windows.bat` script provided in the main directory.

Trace status and completed results are kept in Redis for `TRACE_RESULT_TTL_SECONDS` (24 hours by default). The API creates jobs, while the worker executes them. A worker restart requeues jobs that were claimed but not completed.
