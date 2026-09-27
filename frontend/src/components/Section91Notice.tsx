import React, { useRef } from 'react';
import { InvestigationReport } from '@/types';
import { FileDown, Printer } from 'lucide-react';

interface Props {
  report: InvestigationReport;
  onClose: () => void;
}

const vaspContacts: Record<string, { email: string, entity: string, address: string }> = {
  'Binance': { email: 'lawenforcement@binance.com', entity: 'Binance Holdings Limited', address: 'Global Law Enforcement Portal' },
  'WazirX': { email: 'lawenforcement@wazirx.com', entity: 'Zanmai Labs Pvt Ltd', address: 'Mumbai, Maharashtra, India' },
  'CoinDCX': { email: 'compliance@coindcx.com', entity: 'Neblio Technologies Pvt Ltd', address: 'Mumbai, Maharashtra, India' },
  'Kraken': { email: 'lawenforcement@kraken.com', entity: 'Payward, Inc.', address: 'San Francisco, CA, USA' },
  'Unknown': { email: 'compliance@[exchange].com', entity: 'Compliance Officer', address: 'To be determined' },
};

export default function Section91Notice({ report, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const vaspName = report.identifiedVasp || 'Unknown';
  const contactInfo = vaspContacts[vaspName] || vaspContacts['Unknown'];
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const mockNoticeNumber = `CYBER/${new Date().getFullYear()}/${report.traceId.substring(0, 6).toUpperCase()}`;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#f8f9fa] text-black rounded-lg shadow-2xl my-8">
        
        {/* Toolbar (Not printed) */}
        <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b rounded-t-lg print:hidden">
          <div>
            <h3 className="font-bold text-gray-800">Generated Section 91 CrPC Notice</h3>
            <p className="text-sm text-gray-500">Ready for official dispatch to {contactInfo.email}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors">
              Close
            </button>
          </div>
        </div>

        {/* Notice Content */}
        <div ref={printRef} className="p-12 bg-white print:p-0 print:m-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase underline mb-2">Notice Under Section 91 of the Code of Criminal Procedure, 1973</h1>
            <p className="text-lg font-bold">(Or Section 94 of Bharatiya Nagarik Suraksha Sanhita, 2023)</p>
          </div>

          <div className="flex justify-between mb-8">
            <div className="text-left">
              <p><strong>Notice No:</strong> {mockNoticeNumber}</p>
              <p><strong>Police Station:</strong> Cyber Crime Cell, Headquarters</p>
            </div>
            <div className="text-right">
              <p><strong>Date:</strong> {today}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-1"><strong>To,</strong></p>
            <p className="ml-4">The Nodal Officer / Compliance Department</p>
            <p className="ml-4"><strong>{contactInfo.entity}</strong> ({vaspName})</p>
            <p className="ml-4">{contactInfo.address}</p>
            <p className="ml-4">Email: {contactInfo.email}</p>
          </div>

          <div className="mb-6 font-bold underline">
            <p>Subject: Requisition of information and immediate freezing of cryptocurrency funds related to Cyber Crime Investigation (Ref: Trace {report.traceId}).</p>
          </div>

          <div className="space-y-4 text-justify leading-relaxed">
            <p>
              Whereas an investigation is being conducted into a cyber fraud case, and it has been brought to the notice of this authority that proceeds of crime (stolen cryptocurrency assets) have been routed to a wallet address hosted on your exchange.
            </p>
            
            <p>
              Through advanced blockchain forensic analysis via the SAHYOG Intelligence Engine, it is confirmed that the suspect address <strong>{report.suspectWallet}</strong> has transferred illicit funds to your infrastructure.
            </p>

            <div className="p-4 border border-gray-300 bg-gray-50 my-4 text-sm font-mono">
              <p><strong>Target VASP Address:</strong> {report.suspectWallet} (or intermediate cluster)</p>
              <p><strong>Confidence Score:</strong> {Math.round(report.confidence * 100)}% Match</p>
              <p><strong>Risk Score:</strong> {report.riskScore}/100</p>
            </div>

            <p>
              Under the provisions of <strong>Section 91 CrPC, 1973 / Section 94 BNSS, 2023</strong>, you are hereby directed to provide the following information regarding the user account associated with the above-mentioned receiving addresses:
            </p>

            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Complete KYC details of the account holder (Name, Email, Phone, Address, Govt ID).</li>
              <li>IP login logs with timestamps for the last 6 months.</li>
              <li>Complete transaction history (Deposits and Withdrawals) linked to the account.</li>
              <li>Bank account details linked for fiat withdrawals.</li>
            </ol>

            <p className="mt-6 p-4 border-2 border-red-800 bg-red-50 text-red-900 font-bold">
              FURTHERMORE, you are directed under Section 102 CrPC / Section 106 BNSS to IMMEDIATELY FREEZE / HOLD all cryptocurrency and fiat balances in the associated account(s) to prevent the dissipation of proceeds of crime, pending further orders from this authority.
            </p>

            <p>
              Please provide the requested information to the undersigned within 24 hours of receiving this notice. Failure to comply may invite legal action under Section 175 of the Indian Penal Code (or Section 208 BNS).
            </p>
          </div>

          <div className="mt-16 flex justify-end">
            <div className="text-center">
              <div className="w-48 h-16 border-b border-gray-400 mb-2 border-dashed flex items-end justify-center text-gray-400 text-sm italic">
                (Digital/Physical Signature)
              </div>
              <p className="font-bold">Investigating Officer</p>
              <p>Cyber Crime Investigation Cell</p>
              <p>SAHYOG Portal Generate</p>
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
