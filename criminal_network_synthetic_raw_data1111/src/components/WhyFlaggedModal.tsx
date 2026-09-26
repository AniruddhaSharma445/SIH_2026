import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  FileCheck2,
  X,
  ExternalLink,
  PhoneCall,
  Landmark,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Entity } from '../types';
import { EntityBadge, RiskBadge } from './EntityBadge';

interface WhyFlaggedProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGraph?: (entityId: string) => void;
}

export const WhyFlaggedModal: React.FC<WhyFlaggedProps> = ({
  entity,
  isOpen,
  onClose,
  onNavigateToGraph,
}) => {
  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                WHY FLAGGED?
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                AI Pattern Intelligence &amp; Graph Signal Breakdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Target Identity Banner */}
          <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <EntityBadge type={entity.type} size="md" />
                <span className="text-sm font-bold text-slate-900">
                  {entity.name}
                </span>
              </div>
              {entity.identifier && (
                <p className="text-xs text-slate-500 font-mono">
                  {entity.identifier}
                </p>
              )}
              {entity.role && (
                <p className="text-xs font-semibold text-blue-700 mt-1">
                  Role: {entity.role}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Evaluation
              </span>
              <RiskBadge level={entity.riskLevel} size="md" />
            </div>
          </div>

          {/* Core Flagged Reasons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Detected Analytical Triggers
              </h4>
              <span className="text-[11px] text-slate-400">
                Multi-source correlation
              </span>
            </div>

            <div className="space-y-2">
              {(entity.flaggedReasons && entity.flaggedReasons.length > 0
                ? entity.flaggedReasons
                : [
                    'Communication spike detected',
                    'Connected to multiple investigation entities',
                    'Suspicious financial relationship detected',
                    'Appears across multiple data sources',
                  ]
              ).map((reason, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-xs text-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span className="font-medium leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Data Sources */}
          {entity.dataSources && entity.dataSources.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Converged Data Sources
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {entity.dataSources.map((ds) => (
                  <span
                    key={ds}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {ds}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Investigator Notes */}
          {entity.notes && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1.5 text-blue-800">
                <FileCheck2 className="w-3.5 h-3.5" />
                Investigative Annotation
              </p>
              {entity.notes}
            </div>
          )}

          {/* CRITICAL ETHICAL DISCLAIMER */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-900">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="font-bold">Investigator Notice:</strong> ANVESHAK
              is an analytical decision-support system, not an automatic guilt
              detector. The indicators above represent mathematical and temporal
              correlations requiring human investigator verification and legal
              substantiation.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Node: {entity.id}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Close
            </button>
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToGraph(entity.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <span>Inspect in Graph</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
