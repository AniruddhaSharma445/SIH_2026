import React from 'react';
import { X, FileText, Shield, User, MapPin, Calendar, ExternalLink } from 'lucide-react';

interface FirDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  firNumber?: string;
}

export const FirDocumentModal: React.FC<FirDocumentModalProps> = ({
  isOpen,
  onClose,
  firNumber = 'FIR_001/2026',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official First Information Report (FIR) Extract
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {firNumber} • Bhopal Central Crime Branch • CCTNS Ref: MP-BPL-2026-001
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Metadata banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Filing Date</span>
              <span className="text-slate-900 font-bold">01 Aug 2026, 11:30</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Investigating Officer</span>
              <span className="text-slate-900 font-bold">Insp. R.K. Mishra</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Jurisdiction</span>
              <span className="text-slate-900 font-bold">PS TT Nagar / New Market, Bhopal</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Legal Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Under Active Investigation
              </span>
            </div>
          </div>

          {/* Applicable IPC / BNS Sections */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">
              Charged Penal Sections
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">Section 420 IPC</span>
                <span className="text-slate-500 text-[11px]">Cheating and dishonestly inducing delivery of property</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">Section 120B IPC</span>
                <span className="text-slate-500 text-[11px]">Punishment of criminal conspiracy</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block">Section 406 IPC</span>
                <span className="text-slate-500 text-[11px]">Punishment for criminal breach of trust</span>
              </div>
            </div>
          </div>

          {/* Named Accused / Persons of Interest */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">
              Named Accused & Field Associates
            </h4>
            <div className="space-y-1.5 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-900">1. Rahul Sharma (alias Rahul K Sharma, R. Sharma)</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold text-[10px]">Prime Bridge Entity</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-800">2. Amit Verma (Delivery Coordination)</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">Associate</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-slate-800">3. Suresh Patel (Habibganj Station Contact)</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">Mule Account Holder</span>
              </div>
            </div>
          </div>

          {/* Brief Facts */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5 text-[11px]">
              Evidentiary Summary from Police Case Diary
            </h4>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              In FIR_001, reliable intelligence and surveillance confirmed Rahul K Sharma met Amit Verma near New Market, Bhopal, to finalize coordinated delivery routes. Corroborating vehicle sighting logs placed vehicle MP04AB1234 (Scorpio) and MP04CD5678 in the immediate perimeter. Subsequent financial trace identified cyclic transfers in FIN_001 involving accounts AC-001, AC-002, and AC-003, with an 18-call communication burst logged on 09-Aug-2026.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">Authenticated via Ministry of Home Affairs CCTNS Police Portal</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
