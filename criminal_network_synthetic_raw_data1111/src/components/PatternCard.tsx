import React from 'react';
import {
  Activity,
  Repeat,
  GitMerge,
  Layers,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { PatternDetection } from '../types';

interface PatternCardProps {
  pattern: PatternDetection;
  onInspect?: (pattern: PatternDetection) => void;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  onInspect,
}) => {
  const getPatternMeta = (type: PatternDetection['type']) => {
    switch (type) {
      case 'communication_spike':
        return {
          icon: Activity,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'circular_money':
        return {
          icon: Repeat,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'bridge_entity':
        return {
          icon: GitMerge,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'multi_source':
        return {
          icon: Layers,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          icon: TrendingUp,
          color: 'text-slate-600 bg-slate-50 border-slate-200',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const meta = getPatternMeta(pattern.type);
  const Icon = meta.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${meta.color}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {pattern.title}
            </h4>
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 ${meta.badgeColor}`}
            >
              {pattern.badge}
            </span>
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            pattern.severity === 'High Risk'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {pattern.severity}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed mb-3">
        {pattern.description}
      </p>

      {/* Metrics Bar */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 mb-3 text-xs">
        <span className="text-slate-400 font-medium">Metric Signal: </span>
        <span className="font-semibold text-slate-800">{pattern.metrics}</span>
      </div>

      {/* Entities Involved */}
      <div className="mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Entities Correlated
        </p>
        <div className="flex flex-wrap gap-1.5">
          {pattern.entitiesInvolved.map((name) => (
            <span
              key={name}
              className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Analytical Caution Note */}
      <div className="pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500 italic">
        <HelpCircle className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
        <span>{pattern.analyticalNote}</span>
      </div>
    </div>
  );
};
