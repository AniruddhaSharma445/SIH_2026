import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  Landmark,
  Car,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Investigation } from '../types';

interface InvestigationCardProps {
  investigation: Investigation;
  onSelect?: (inv: Investigation) => void;
}

export const InvestigationCard: React.FC<InvestigationCardProps> = ({
  investigation,
  onSelect,
}) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    if (onSelect) {
      onSelect(investigation);
    } else {
      navigate(`/investigations/${investigation.id}`);
    }
  };

  const statusColors = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Closed: 'bg-slate-100 text-slate-700 border-slate-200',
    'Priority Investigation': 'bg-rose-50 text-rose-700 border-rose-200',
  }[investigation.status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100">
              {investigation.caseNumber}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColors}`}
            >
              {investigation.status}
            </span>
          </div>

          <span className="text-[11px] font-semibold text-slate-400">
            {investigation.priority} Priority
          </span>
        </div>

        {/* Case Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
          {investigation.title}
        </h3>

        {/* Summary Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {investigation.description}
        </p>

        {/* Entity Stats Bar */}
        <div className="grid grid-cols-4 gap-2 py-3 px-3 bg-slate-50 rounded-lg border border-slate-100 text-center mb-4">
          <div title="Persons Identified">
            <div className="flex items-center justify-center text-slate-400 mb-0.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {investigation.stats.personsCount}
            </span>
            <span className="block text-[10px] text-slate-400">Persons</span>
          </div>

          <div title="Phones / CDR Links">
            <div className="flex items-center justify-center text-slate-400 mb-0.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {investigation.stats.phonesCount}
            </span>
            <span className="block text-[10px] text-slate-400">Phones</span>
          </div>

          <div title="Bank Accounts">
            <div className="flex items-center justify-center text-slate-400 mb-0.5">
              <Landmark className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {investigation.stats.accountsCount}
            </span>
            <span className="block text-[10px] text-slate-400">Accounts</span>
          </div>

          <div title="High Risk Connections">
            <div className="flex items-center justify-center text-slate-400 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-xs font-bold text-rose-600">
              {investigation.stats.highRiskCount}
            </span>
            <span className="block text-[10px] text-slate-400">High Risk</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {investigation.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Meta & Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {investigation.updatedDate}</span>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>View Case Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
