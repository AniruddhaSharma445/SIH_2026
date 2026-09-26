import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'navy' | 'blue' | 'purple' | 'red';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  trend,
}) => {
  const iconVariants = {
    navy: 'bg-slate-100 text-slate-800 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  }[variant];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
            {trend && (
              <span className="text-xs font-medium text-emerald-600">
                {trend}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1">
              {subtext}
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${iconVariants}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
