import React from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Calendar,
  HardDrive,
  ExternalLink,
  AlertTriangle,
  FolderOpen,
  Hash,
  Download,
} from 'lucide-react';
import { CaseDocumentItem, getDocumentTypeMeta } from './DocumentCard';
import { EntityBadge } from './EntityBadge';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: CaseDocumentItem | null;
  onSelectEntity?: (entityName: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onSelectEntity,
}) => {
  if (!isOpen || !document) return null;

  const meta = getDocumentTypeMeta(document.type || document.category);
  const IconComponent = meta.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
    >
      <div className="bg-[#fffefb] w-full max-w-2xl rounded-xl border border-[#ddd6c6] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header matching CallRecordsModal / BankingLedgerModal */}
        <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between bg-[#faf8f4]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div
              className={`w-9 h-9 rounded-lg ${meta.bgColor} ${meta.borderColor} border flex items-center justify-center shrink-0`}
            >
              <IconComponent className={`w-5 h-5 ${meta.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h3 id="doc-modal-title" className="text-sm font-bold text-slate-900 font-serif truncate">
                {document.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                {document.docketNumber || document.id} • {document.caseNumber || 'CASE-2026-014'} • Forensic Evidence Dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close document preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Metadata Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#f4f2ea] rounded-lg border border-[#ddd6c6]">
            <div>
              <span className="text-slate-400 block font-medium">Record Date</span>
              <span className="text-slate-900 font-bold">{document.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">File Format / Size</span>
              <span className="font-mono text-slate-900 font-bold">{document.fileSize}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Classification</span>
              <span className="text-slate-900 font-bold truncate block">{document.type}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">CCTNS Status</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Intact
              </span>
            </div>
          </div>

          {/* Document Summary & Forensic Context */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Document Abstract &amp; Legal Context
            </h4>
            <div className="p-3.5 bg-white rounded-lg border border-[#e5e0d8] text-slate-700 text-xs leading-relaxed">
              {document.summary}
            </div>
          </div>

          {/* Linked Entities with Clickable EntityBadges */}
          {document.entities && document.entities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Linked Entities in Docket ({document.entities.length})
                </h4>
                <span className="text-[11px] text-slate-400">Click entity to cross-reference</span>
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-[#e5e0d8]">
                {document.entities.map((ent) => (
                  <button
                    key={ent.name}
                    type="button"
                    onClick={() => onSelectEntity && onSelectEntity(ent.name)}
                    className="inline-flex items-center hover:opacity-85 transition-opacity cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#a94e2c] rounded-md"
                    title={`Cross-reference ${ent.name}`}
                  >
                    <EntityBadge type={ent.type} label={ent.name} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Forensic Evidentiary Text Details */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Chain of Custody &amp; Cryptographic Hash
            </h4>
            <div className="bg-[#faf8f4] p-3 rounded-lg border border-[#e5e0d8] space-y-1 font-mono text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">SHA-256 Digest:</span>
                <span className="text-slate-700 truncate max-w-[280px]">
                  9a4f78c10be649c2a71d88204b7e19904d9a...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ingestion Pipeline:</span>
                <span className="text-slate-700">ANVESHAK-AUTO-INGEST-V4 (Verified)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jurisdiction Reference:</span>
                <span className="text-slate-700">Nagpur Cyber &amp; Financial Crime Cell</span>
              </div>
            </div>
          </div>

          {/* Verification Warning Box matching established copy */}
          <div className="p-3 bg-[#faf8f4] rounded-lg border border-amber-200/80 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-900">
                This is a source record — verify before use in any action
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Automated extractions require secondary manual confirmation by an assigned case investigator prior to filing judicial affidavits.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer matching CallRecordsModal / BankingLedgerModal */}
        <div className="px-6 py-3.5 border-t border-[#ece8df] bg-[#faf8f4] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Protected under Case 24/2026 judicial access controls • Human verification mandatory</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg border border-[#ddd6c6] transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
