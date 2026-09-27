# Verified VASP label registry

Add a label only after checking it against an authoritative source. Every entry must include a valid Ethereum address, `vasp_name`, `chain` (`ethereum`), `source_url`, and `verified_at` in ISO 8601 date format.

```json
{
  "address": "0x...",
  "vasp_name": "Example VASP",
  "chain": "ethereum",
  "source_url": "https://authoritative-source.example/record",
  "verified_at": "2026-09-27"
}
```
