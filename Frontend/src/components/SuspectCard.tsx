import React from 'react';
import {
  User,
  Phone,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import { Entity } from '../types';
import { EntityBadge, RiskBadge } from './EntityBadge';

interface SuspectCardProps {
  entity: Entity;
  onWhyFlagged: (entity: Entity) => void;
  onInspectGraph?: (entityId: string) => void;
}

export const SuspectCard: React.FC<SuspectCardProps> = ({
  entity,
  onWhyFlagged,
  onInspectGraph,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <EntityBadge type={entity.type} size="sm" />
            <RiskBadge level={entity.riskLevel} size="sm" />
          </div>

          <button
            type="button"
            onClick={() => onWhyFlagged(entity)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full transition-colors"
          >
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            <span>Why Flagged?</span>
          </button>
        </div>

        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          {entity.name}
        </h4>

        {entity.identifier && (
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {entity.identifier}
          </p>
        )}

        {entity.role && (
          <div className="mt-2 text-xs font-medium text-slate-700">
            <span className="text-slate-400">Role: </span>
            {entity.role}
          </div>
        )}

        {/* Flagged Reasons Preview */}
        {entity.flaggedReasons && entity.flaggedReasons.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Flagged Indicators
            </p>
            <ul className="space-y-1">
              {entity.flaggedReasons.slice(0, 2).map((reason, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ingested Sources Badges */}
        {entity.dataSources && entity.dataSources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1">
            {entity.dataSources.map((ds) => (
              <span
                key={ds}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
              >
                {ds}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">
          {entity.riskScore ? `Risk Score: ${entity.riskScore}/100` : 'Evaluated'}
        </span>

        {onInspectGraph && (
          <button
            type="button"
            onClick={() => onInspectGraph(entity.id)}
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>Locate in Graph</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
