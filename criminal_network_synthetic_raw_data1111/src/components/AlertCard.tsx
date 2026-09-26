import React from 'react';
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { AlertItem } from '../types';

interface AlertCardProps {
  alert: AlertItem;
  onView?: (alert: AlertItem) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onView }) => {
  const configs = {
    high: {
      bg: 'bg-rose-50/70 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: AlertTriangle,
    },
    warning: {
      bg: 'bg-amber-50/70 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50/70 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Info,
    },
  }[alert.severity] || {
    bg: 'bg-slate-50 border-slate-200',
    iconBg: 'bg-slate-100 text-slate-700',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Info,
  };

  const Icon = configs.icon;

  return (
    <div
      className={`rounded-xl border p-4 shadow-xs transition-all ${configs.bg}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${configs.iconBg}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {alert.title}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {alert.timestamp}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {alert.message}
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-blue-700">
                {alert.caseNumber}
              </span>
              {alert.entityName && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Target: <strong className="text-slate-800 font-medium">{alert.entityName}</strong>
                  </span>
                </>
              )}
            </div>

            {onView && (
              <button
                type="button"
                onClick={() => onView(alert)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>Investigate</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
