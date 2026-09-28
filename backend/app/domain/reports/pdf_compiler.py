"""
Court-Admissible PDF Report Compiler using ReportLab.
Implements:
1. Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA) Certificate of Electronic Evidence (formerly Section 65B IEA).
2. Section 94 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) Production Notice (formerly Section 91 CrPC).
"""

import os
import io
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfgen import canvas

from app.blockchain.models import Case, EvidenceItem, AuditEvent, ExplainableAttributionResult, TraceResult


class ForensicReportCanvas(canvas.Canvas):
    """Running header and footer for court-admissible electronic records."""
    def __init__(self, *args, **kwargs):
        kwargs["pageCompression"] = 0
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1E3A8A"))

        # Top banner
        self.drawString(40, 762, "SAHYOG INTELLIGENCE PLATFORM // FORENSIC VASP ATTRIBUTION ENGINE")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(572, 762, "CONFIDENTIAL // LAW ENFORCEMENT ONLY")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 756, 572, 756)

        # Bottom footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 38, 572, 38)
        self.drawString(40, 26, "Generated via SIH26182 VASP Attribution Engine | Statutory Compliance (BSA 2023 & BNSS 2023)")
        self.drawRightString(572, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


class ForensicPDFCompiler:
    """Compiles binary PDFs in memory."""

    @classmethod
    def compile_bnss94_notice(
        cls,
        case: Case,
        candidate_address: str,
        vasp_name: str,
        destination_hot_wallet: Optional[str] = None,
        confidence_percent: float = 84.5,
        investigator_name: str = "Inspector R. K. Sharma",
        police_station: str = "Cyber Crime Police Station",
    ) -> Tuple[bytes, str]:
        """
        Compiles Section 94 BNSS Written Production Order.
        Addressed to the Exchange Compliance Desk to produce KYC and freeze account.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=48,
            bottomMargin=50,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "LegalTitle",
            parent=styles["Heading1"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#0F172A"),
            fontName="Helvetica-Bold",
            alignment=1,
        )
        subtitle_style = ParagraphStyle(
            "LegalSubtitle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
            alignment=1,
        )
        body_style = ParagraphStyle(
            "LegalBody",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#1E293B"),
        )
        bold_body = ParagraphStyle(
            "LegalBold",
            parent=body_style,
            fontName="Helvetica-Bold",
        )

        elements = []
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("ORDER FOR PRODUCTION OF ELECTRONIC RECORDS & WRITTEN STATEMENT", title_style))
        elements.append(Paragraph("UNDER SECTION 94, BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (BNSS)", subtitle_style))
        elements.append(Paragraph("<i>(Corresponding to Section 91, Code of Criminal Procedure, 1973 - CrPC)</i>", subtitle_style))
        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

        # Addressee Table
        elements.append(Paragraph(f"<b>TO:</b> Legal Compliance & Law Enforcement Inquiries Desk", bold_body))
        elements.append(Paragraph(f"<b>ENTITY:</b> {vasp_name} (Virtual Asset Service Provider)", bold_body))
        elements.append(Paragraph(f"<b>FROM:</b> Office of the Investigating Officer, {case.police_station}", body_style))
        elements.append(Paragraph(f"<b>FIR NUMBER:</b> {case.fir_number}", bold_body))
        elements.append(Paragraph(f"<b>COMPLAINANT / VICTIM:</b> {case.complainant_name}", body_style))
        elements.append(Paragraph(f"<b>DEFRAUDED AMOUNT:</b> INR {case.loss_amount_inr:,.2f} ({case.loss_amount_crypto:,.2f} {case.crypto_symbol})", body_style))
        elements.append(Spacer(1, 14))

        # Notice Body
        p1 = (
            f"WHEREAS, an investigation into formal cybercrime complaint under FIR No. <b>{case.fir_number}</b> "
            f"is being conducted at this police station regarding financial fraud and unauthorized fund diversion. "
            f"On-chain forensic investigation has established that stolen digital assets were transferred and "
            f"consolidated into candidate deposit address: <b>{candidate_address}</b>, which is attributed to your "
            f"custodial infrastructure (<b>{vasp_name}</b>) with an explainable forensic attribution confidence of "
            f"<b>{confidence_percent:.1f}%</b>."
        )
        elements.append(Paragraph(p1, body_style))
        elements.append(Spacer(1, 10))

        directives_title = Paragraph("<b>MANDATORY STATUTORY DIRECTIVES (48 HOURS):</b>", bold_body)
        elements.append(directives_title)
        elements.append(Spacer(1, 6))

        directives = [
            "1. Produce complete Know-Your-Customer (KYC) records, registered identification documents (Aadhaar / Passport / Voter ID), and registered mobile/email of the account holder associated with deposit address.",
            "2. Produce complete fiat banking withdrawal telemetry, including linked Indian bank account numbers, IFSC codes, and UPI VPA identifiers.",
            "3. Produce all IP login access logs, device fingerprints, and timestamps for the account from genesis to present.",
            "4. IMMEDIATELY place an administrative debit freeze on any remaining balance associated with said user account to prevent off-ramp liquidation.",
        ]
        for d in directives:
            elements.append(Paragraph(d, body_style))
            elements.append(Spacer(1, 4))

        elements.append(Spacer(1, 14))

        # Sign-off block
        elements.append(Paragraph(f"Given under my hand and seal of the Police Station this {datetime.utcnow().strftime('%d %B %Y')}.", body_style))
        elements.append(Spacer(1, 30))

        sig_table = Table([
            [Paragraph("___________________________________", body_style), Paragraph("___________________________________", body_style)],
            [Paragraph(f"<b>{investigator_name}</b><br/>Investigating Officer<br/>{police_station}", body_style),
             Paragraph("<b>OFFICIAL SEAL & STAMP</b><br/>Cyber Crime Police Station", body_style)],
        ], colWidths=[260, 260])
        elements.append(sig_table)

        doc.build(elements, canvasmaker=ForensicReportCanvas)
        pdf_bytes = buffer.getvalue()
        sha256 = hashlib.sha256(pdf_bytes).hexdigest()
        return pdf_bytes, sha256

    @classmethod
    def compile_bsa63_dossier(
        cls,
        case: Case,
        evidence_items: List[EvidenceItem],
        audit_events: List[AuditEvent],
        attribution: Optional[ExplainableAttributionResult] = None,
        investigator_name: str = "Inspector R. K. Sharma",
        police_station: str = "Cyber Crime Police Station",
    ) -> Tuple[bytes, str]:
        """
        Compiles Section 63 BSA Evidence Dossier PDF with:
        - Case & FIR Metadata
        - Cryptographic Evidence Ledger (OBSERVED, DERIVED, INFERRED)
        - 5-Factor Attribution Decomposition
        - Chain of Custody Audit Trail (Appendix B)
        - Section 63(4) Statutory Certificate
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=48,
            bottomMargin=50,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DossierTitle",
            parent=styles["Heading1"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#0F172A"),
            fontName="Helvetica-Bold",
            alignment=1,
        )
        subtitle_style = ParagraphStyle(
            "DossierSubtitle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
            alignment=1,
        )
        h2_style = ParagraphStyle(
            "DossierH2",
            parent=styles["Heading2"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1E3A8A"),
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "DossierBody",
            parent=styles["Normal"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#1E293B"),
        )

        elements = []
        elements.append(Paragraph("FORENSIC INVESTIGATION REPORT & EVIDENCE DOSSIER", title_style))
        elements.append(Paragraph("CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63, BHARATIYA SAKSHYA ADHINIYAM, 2023", subtitle_style))
        elements.append(Paragraph("<i>(Replacing Section 65B of the Indian Evidence Act, 1872)</i>", subtitle_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))

        # Case Metadata Table
        meta_data = [
            [Paragraph("<b>FIR Number:</b>", body_style), Paragraph(case.fir_number, body_style),
             Paragraph("<b>Case Status:</b>", body_style), Paragraph(case.status.value.upper(), body_style)],
            [Paragraph("<b>Complainant:</b>", body_style), Paragraph(case.complainant_name, body_style),
             Paragraph("<b>Police Station:</b>", body_style), Paragraph(case.police_station, body_style)],
            [Paragraph("<b>Reported Loss:</b>", body_style), Paragraph(f"INR {case.loss_amount_inr:,.2f}", body_style),
             Paragraph("<b>Crypto Loss:</b>", body_style), Paragraph(f"{case.loss_amount_crypto:,.2f} {case.crypto_symbol}", body_style)],
            [Paragraph("<b>Root Suspect:</b>", body_style), Paragraph(case.root_suspect_address, body_style),
             Paragraph("<b>Network:</b>", body_style), Paragraph(case.chain.upper(), body_style)],
        ]
        t_meta = Table(meta_data, colWidths=[90, 175, 90, 175])
        t_meta.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 10))

        # Section 1: 5-Factor Attribution Summary
        if attribution:
            elements.append(Paragraph("1. VASP ATTRIBUTION ANALYSIS & MATHEMATICAL DECOMPOSITION", h2_style))
            attr_summary = (
                f"Candidate deposit wallet <b>{attribution.candidate_address}</b> has been attributed to "
                f"<b>{attribution.attributed_vasp or 'Unknown VASP'}</b> with a composite confidence score of "
                f"<b>{attribution.composite_confidence * 100:.1f}% ({attribution.confidence_band} CONFIDENCE)</b>. "
                f"Statutory actionability threshold met: <b>{'YES' if attribution.statutory_actionable else 'NO'}</b>."
            )
            elements.append(Paragraph(attr_summary, body_style))
            elements.append(Spacer(1, 6))

            attr_rows = [["Factor Name", "Raw Value", "Weight", "Contribution", "Forensic Rationale"]]
            for f in attribution.factors:
                attr_rows.append([
                    Paragraph(f.name, body_style),
                    f"{f.raw_value:.2f}",
                    f"{f.weight:.2f}",
                    f"{f.weighted_score:.3f}",
                    Paragraph(f.description, body_style),
                ])
            t_attr = Table(attr_rows, colWidths=[110, 50, 45, 55, 270])
            t_attr.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]))
            elements.append(t_attr)
            elements.append(Spacer(1, 10))

        # Section 2: Cryptographic Evidence Ledger
        elements.append(Paragraph(f"2. CRYPTOGRAPHIC EVIDENCE LEDGER ({len(evidence_items)} RECORDS)", h2_style))
        ev_rows = [["Seq", "Tier", "Evidence Title", "Content Hash (SHA-256)", "Chained Ledger Hash"]]
        for e in evidence_items[:15]:  # Show top 15 in summary table
            ev_rows.append([
                str(e.sequence_number),
                e.tier.value,
                Paragraph(e.title, body_style),
                f"{e.content_hash[:16]}...",
                f"{e.chain_hash[:16]}...",
            ])
        t_ev = Table(ev_rows, colWidths=[30, 60, 160, 140, 140])
        t_ev.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(t_ev)
        elements.append(Spacer(1, 10))

        # Section 3: Statutory Certification
        elements.append(Paragraph("3. CERTIFICATE UNDER SECTION 63(4), BHARATIYA SAKSHYA ADHINIYAM, 2023", h2_style))
        cert_text = (
            f"I, <b>{investigator_name}</b>, {police_station}, do hereby certify that: "
            f"(a) The electronic records set forth herein were produced by the forensic computer system during "
            f"the regular course of official cybercrime investigation. "
            f"(b) Throughout the material period, the computer system operated properly without technical impairment. "
            f"(c) All transactions, graph nodes, and metrics have been hashed using RFC-8785 canonical serialization "
            f"and SHA-256 digest chains to guarantee tamper-proof chain of custody for judicial proceedings."
        )
        elements.append(Paragraph(cert_text, body_style))
        elements.append(Spacer(1, 20))

        sig_table = Table([
            [Paragraph("___________________________________", body_style), Paragraph("___________________________________", body_style)],
            [Paragraph(f"<b>{investigator_name}</b><br/>Certifying Officer", body_style),
             Paragraph("<b>FORENSIC EXAMINER SEAL</b><br/>Cyber Crime Forensic Unit", body_style)],
        ], colWidths=[260, 260])
        elements.append(sig_table)

        doc.build(elements, canvasmaker=ForensicReportCanvas)
        pdf_bytes = buffer.getvalue()
        sha256 = hashlib.sha256(pdf_bytes).hexdigest()
        return pdf_bytes, sha256
