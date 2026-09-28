import React, { useRef, useState } from 'react';
import { InvestigationReport } from '@/types';
import { FileDown, Printer, Shield, Download } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  report: InvestigationReport;
  onClose: () => void;
}

const vaspContacts: Record<string, { email: string; entity: string; address: string }> = {
  Binance: { email: 'lawenforcement@binance.com', entity: 'Binance Holdings Limited', address: 'Global Law Enforcement Portal' },
  WazirX: { email: 'lawenforcement@wazirx.com', entity: 'Zanmai Labs Pvt Ltd', address: 'Mumbai, Maharashtra, India' },
  CoinDCX: { email: 'compliance@coindcx.com', entity: 'Neblio Technologies Pvt Ltd', address: 'Mumbai, Maharashtra, India' },
  Kraken: { email: 'lawenforcement@kraken.com', entity: 'Payward, Inc.', address: 'San Francisco, CA, USA' },
  Coinbase: { email: 'lawenforcement@coinbase.com', entity: 'Coinbase, Inc.', address: 'San Francisco, CA, USA' },
  Bitbns: { email: 'compliance@bitbns.com', entity: 'Buyhatke Internet Pvt Ltd', address: 'Bangalore, Karnataka, India' },
  Unknown: { email: 'compliance@[exchange].com', entity: 'Compliance Officer', address: 'To be determined' },
};

export default function Section91Notice({ report, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const vaspName = report.identifiedVasp || 'Binance';
  const contactInfo = vaspContacts[vaspName] || vaspContacts['Unknown'];
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const mockNoticeNumber = `CYBER/${new Date().getFullYear()}/${report.traceId.substring(0, 6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      // Try downloading generated PDF from backend
      const blob = await api.downloadBNSSNotice('case_demo_delhi_0812', report.suspectWallet, vaspName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Section94_BNSS_${report.traceId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#f8f9fa] text-black rounded-lg shadow-2xl my-8">
        
        {/* Toolbar (Not printed) */}
        <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b rounded-t-lg print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-gray-800">Section 94 BNSS Legal Production Notice</h3>
            </div>
            <p className="text-xs text-gray-500">Statutory notice under Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Section 91 CrPC)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              <Download className="w-4 h-4" /> {downloading ? 'Compiling...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Notice Content */}
        <div ref={printRef} className="p-12 bg-white print:p-0 print:m-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase underline mb-2">
              ORDER FOR PRODUCTION OF ELECTRONIC RECORDS
            </h1>
            <p className="text-lg font-bold">
              UNDER SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (BNSS)
            </p>
            <p className="text-sm italic text-gray-600">
              (Formerly Section 91 of the Code of Criminal Procedure, 1973 - CrPC)
            </p>
          </div>

          <div className="flex justify-between mb-8">
            <div className="text-left">
              <p><strong>Notice Reference No:</strong> {mockNoticeNumber}</p>
              <p><strong>Police Station:</strong> Cyber Crime Investigation Police Station</p>
            </div>
            <div className="text-right">
              <p><strong>Date of Requisition:</strong> {today}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-1"><strong>TO:</strong></p>
            <p className="ml-4">The Nodal Officer / Law Enforcement Inquiries & Compliance Desk</p>
            <p className="ml-4"><strong>{contactInfo.entity}</strong> ({vaspName})</p>
            <p className="ml-4">{contactInfo.address}</p>
            <p className="ml-4">Email: {contactInfo.email}</p>
          </div>

          <div className="mb-6 font-bold underline">
            <p>Subject: Requisition of electronic user records and immediate freeze of cryptocurrency deposit funds (Trace Ref: {report.traceId}).</p>
          </div>

          <div className="space-y-4 text-justify leading-relaxed">
            <p>
              WHEREAS, an investigation into a formal cyber-financial crime complaint is in progress at this authority regarding unauthorized diversion and laundering of defrauded investor funds.
            </p>
            
            <p>
              Through advanced blockchain forensic analysis via the SAHYOG VASP Attribution Engine, it is established that proceeds of crime originated from suspect address <strong>{report.suspectWallet}</strong> and have been swept into your custodial exchange infrastructure (<strong>{vaspName}</strong>).
            </p>

            <div className="p-4 border border-gray-300 bg-gray-50 my-4 text-sm font-mono">
              <p><strong>Identified VASP Entity:</strong> {vaspName}</p>
              <p><strong>Target Deposit Address:</strong> {report.suspectWallet}</p>
              <p><strong>Attribution Confidence:</strong> {Math.round(report.confidence * 100)}% (HIGH STATUTORY CONFIDENCE)</p>
              <p><strong>Composite Forensic Risk Score:</strong> {report.riskScore}/100</p>
            </div>

            <p>
              NOW THEREFORE, under the statutory powers conferred by <strong>Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023</strong>, you are hereby directed to produce the following records within <strong>48 hours</strong> of receipt of this notice:
            </p>

            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Complete Know-Your-Customer (KYC) identity documentation (Govt Photo ID, Aadhaar, Passport, verified phone and email).</li>
              <li>Linked fiat banking withdrawal channels (Bank Account Numbers, IFSC codes, UPI Virtual Payment Addresses).</li>
              <li>IP login telemetry, access logs, and device fingerprints associated with the deposit account.</li>
              <li>Complete deposit and withdrawal ledger history associated with the target address.</li>
            </ol>

            <p className="mt-6 p-4 border-2 border-red-800 bg-red-50 text-red-900 font-bold">
              FURTHERMORE, you are directed under Section 106 BNSS to IMMEDIATELY FREEZE AND HOLD all cryptocurrency and fiat balances in the associated deposit account to prevent dissipation of proceeds of crime.
            </p>

            <p>
              Non-compliance with this statutory requisition shall invite prosecution under Section 223 of the Bharatiya Nyaya Sanhita, 2023 (BNS).
            </p>
          </div>

          <div className="mt-16 flex justify-between items-end">
            <div>
              <p className="text-xs font-mono text-gray-500">Certificate of Electronic Record: S.63 BSA</p>
              <p className="text-xs font-mono text-gray-500">Hash-Verified Evidence DAG Attached</p>
            </div>
            <div className="text-center">
              <div className="w-48 h-16 border-b border-gray-400 mb-2 border-dashed flex items-end justify-center text-gray-400 text-sm italic">
                (Official Digital Signature)
              </div>
              <p className="font-bold">Investigating Officer</p>
              <p>Cyber Crime Investigation Police Station</p>
              <p>SAHYOG Intelligence Platform</p>
            </div>
          </div>
          
          <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-center text-gray-500 font-mono">
            Generated securely by SAHYOG VASP Attribution Engine | Trace ID: {report.traceId} | Timestamp: {new Date().toISOString()}
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .fixed { position: absolute; }
          .bg-black\\/80 { background: transparent; }
          .shadow-2xl { box-shadow: none; }
          .my-8 { margin: 0; }
          .max-w-4xl { max-width: 100%; }
          .p-12 { padding: 0 !important; }
          .bg-\\[\\#f8f9fa\\] { background: white !important; }
          div[style*="font-family"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          div[style*="font-family"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
