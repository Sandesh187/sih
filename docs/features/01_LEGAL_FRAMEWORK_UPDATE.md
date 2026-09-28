# Feature Specification: Legal Framework Update (BSA/BNSS 2023)

## 1. Overview
Update all legal document templates and terminology to comply with India's new criminal laws:
- Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 (replacing CrPC)
- Bharatiya Sakshya Adhiniyam (BSA), 2023 (replacing IEA)

## 2. Key Changes
- **Section 91 CrPC** -> **Section 94 BNSS** (Notice to produce documents).
- **Section 65B IEA** -> **Section 63 BSA** (Admissibility of electronic records).
- UI transitional parentheticals: "Section 94 BNSS (formerly Section 91 CrPC)".

## 3. Files to Modify
- `frontend/src/components/legal/Section91Notice.tsx` -> Rename to `Section94Notice.tsx`
- `frontend/src/app/reports/page.tsx`
- `backend/app/templates/legal.py`

## 4. Notice Content (Section 94 BNSS)
```text
NOTICE UNDER SECTION 94 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
(Formerly Section 91 of the Code of Criminal Procedure, 1973)

To: The Compliance Officer, {exchange_name}
Subject: Notice to produce information regarding cryptocurrency transactions.

In connection with the investigation of FIR No. {fir_number}, you are hereby directed under Section 94 of the BNSS, 2023 to produce the following records relating to the deposit address: {deposit_address}.
1. KYC documents and linked bank accounts.
2. Complete transaction logs and IP access logs for the period...
```

## 5. Certificate Content (Section 63 BSA)
```text
CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
(Formerly Section 65B of the Indian Evidence Act, 1872)

I, {investigator_name}, hereby certify that the electronic record contained in this dossier...
```

## 6. UI Updates
Update the "Generate Notice" modals and dropdowns to reflect the new nomenclature. Ensure backward compatibility via transitional text for the first year of rollout.
