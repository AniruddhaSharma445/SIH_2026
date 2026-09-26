import React from 'react';
import {
  FileText,
  Landmark,
  Phone,
  Car,
  Calendar,
  HardDrive,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { EntityType } from '../types';

export interface CaseDocumentItem {
  id: string;
  title: string;
  type: string; // The tag: e.g. 'Police Legal Record', 'Core Financial Mandate', etc.
  category: 'fir' | 'financial' | 'telecom' | 'vehicle';
  fileSize: string;
  summary: string;
  date: string;
  caseNumber?: string;
  docketNumber?: string;
  modalType: 'fir' | 'banking' | 'call' | 'vehicle' | 'generic';
  entities?: Array<{ name: string; type: EntityType }>;
  notes?: string;
}

export interface DocumentCardProps {
  document: CaseDocumentItem;
  onClick: (doc: CaseDocumentItem) => void;
}

export interface DocumentRowProps {
  document: CaseDocumentItem;
  onClick: (doc: CaseDocumentItem) => void;
}

/**
 * Returns icon, subtle tint background, and color mappings
 * matching the established EntityBadge visual language.
 */
export const getDocumentTypeMeta = (typeOrCategory: string) => {
  const normalized = typeOrCategory.toLowerCase();
  if (normalized.includes('telecom') || normalized.includes('cdr') || normalized.includes('phone')) {
    return {
      icon: Phone,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Telecom CDR',
    };
  }
  if (normalized.includes('financial') || normalized.includes('bank') || normalized.includes('mandate')) {
    return {
      icon: Landmark,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      label: 'Financial Flow',
    };
  }
  if (normalized.includes('vehicle') || normalized.includes('anpr') || normalized.includes('fastag') || normalized.includes('car')) {
    return {
      icon: Car,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Vehicle Telemetry',
    };
  }
  // Default to FIR / Legal
  return {
    icon: FileText,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Legal Record',
  };
};

/**
 * Interactive Grid Card (3 columns on desktop, 1 on mobile)
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick }) => {
  const meta = getDocumentTypeMeta(document.type || document.category);
  const IconComponent = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(document)}
      className="bg-[#fffefb] rounded-xl border border-[#ddd6c6] shadow-2xs hover:border-[#a94e2c] hover:shadow-md transition-all duration-200 text-left p-5 flex flex-col justify-between group cursor-pointer w-full relative focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#a94e2c]"
      aria-label={`Preview document ${document.title}`}
    >
      <div>
        {/* Top meta row: Category Icon + Tag Pill + Case Number */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg ${meta.bgColor} ${meta.borderColor} border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
            >
              <IconComponent className={`w-4 h-4 ${meta.iconColor}`} />
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.badgeBg}`}
            >
              {document.type}
            </span>
          </div>

          {document.caseNumber && (
            <span className="font-mono text-[10px] text-slate-400 bg-[#f4f2ea] border border-[#ddd6c6] px-1.5 py-0.5 rounded">
              {document.caseNumber}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-serif font-bold text-slate-900 group-hover:text-[#a94e2c] transition-colors text-sm sm:text-base leading-snug line-clamp-2">
          {document.title}
        </h4>

        {/* Summary Description */}
        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {document.summary}
        </p>

        {/* Related Entities Preview */}
        {document.entities && document.entities.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#f0ede6]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Linked Entities ({document.entities.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {document.entities.slice(0, 3).map((ent) => (
                <span
                  key={ent.name}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#f4f2ea] text-slate-700 border border-[#e5e0d8]"
                >
                  {ent.name}
                </span>
              ))}
              {document.entities.length > 3 && (
                <span className="text-[10px] font-medium text-slate-500 self-center">
                  +{document.entities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: File metadata & date */}
      <div className="mt-4 pt-3 border-t border-[#f0ede6] flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px] text-slate-500">{document.fileSize}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-[11px] text-slate-600">{document.date}</span>
          <ExternalLink className="w-3 h-3 text-[#a94e2c] opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
      </div>
    </button>
  );
};

/**
 * Interactive List View Row
 */
export const DocumentRow: React.FC<DocumentRowProps> = ({ document, onClick }) => {
  const meta = getDocumentTypeMeta(document.type || document.category);
  const IconComponent = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(document)}
      className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#faf8f4] transition-all text-left group cursor-pointer focus:outline-hidden focus-visible:bg-[#faf8f4] focus-visible:ring-2 focus-visible:ring-[#a94e2c]"
      aria-label={`Preview document ${document.title}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className={`w-9 h-9 rounded-lg ${meta.bgColor} ${meta.borderColor} border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}
        >
          <IconComponent className={`w-4 h-4 ${meta.iconColor}`} />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-serif text-sm font-bold text-slate-900 group-hover:text-[#a94e2c] transition-colors truncate">
              {document.title}
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeBg}`}
            >
              {document.type}
            </span>
            {document.caseNumber && (
              <span className="font-mono text-[10px] text-slate-400 bg-[#f4f2ea] border border-[#ddd6c6] px-1.5 py-0.5 rounded">
                {document.caseNumber}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 line-clamp-1">
            {document.summary}
          </p>

          {document.entities && document.entities.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Entities:</span>
              {document.entities.map((ent) => (
                <span
                  key={ent.name}
                  className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#f4f2ea] text-slate-700 border border-[#e5e0d8]"
                >
                  {ent.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-center pl-12 sm:pl-0">
        <div className="text-right">
          <span className="font-mono text-[11px] text-slate-400 block">{document.fileSize}</span>
          <span className="text-[11px] text-slate-600 font-medium block">{document.date}</span>
        </div>

        <div className="w-7 h-7 rounded-md border border-[#ddd6c6] group-hover:border-[#a94e2c] group-hover:bg-[#a94e2c] group-hover:text-white text-slate-400 flex items-center justify-center transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
