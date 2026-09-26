import React from 'react';

interface EditorialMetricsBarProps {
  activeMetricFilter?: string | null;
  onSelectMetricFilter?: (filterKey: string | null) => void;
}

export const EditorialMetricsBar: React.FC<EditorialMetricsBarProps> = ({
  activeMetricFilter,
  onSelectMetricFilter,
}) => {
  const metrics = [
    {
      id: 'records',
      value: '186',
      label: 'Records reviewed',
      color: 'text-slate-900',
      badge: '+12 today',
      badgeColor: 'bg-slate-100 text-slate-600',
    },
    {
      id: 'people',
      value: '32',
      label: 'People identified',
      color: 'text-slate-900',
      badge: '4 primary',
      badgeColor: 'bg-slate-100 text-slate-600',
    },
    {
      id: 'connections',
      value: '74',
      label: 'Connections mapped',
      color: 'text-slate-900',
      badge: 'Verified',
      badgeColor: 'bg-slate-100 text-slate-600',
    },
    {
      id: 'locations',
      value: '11',
      label: 'Locations referenced',
      color: 'text-[#2d6a4f]',
      badge: '2 checkpoints',
      badgeColor: 'bg-[#eef6f0] text-[#2d6a4f]',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-xs overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#f0ede6]">
        {metrics.map((metric) => {
          const isSelected = activeMetricFilter === metric.id;
          return (
            <button
              key={metric.id}
              type="button"
              onClick={() => {
                if (onSelectMetricFilter) {
                  onSelectMetricFilter(isSelected ? null : metric.id);
                }
              }}
              className={`text-left px-5 py-4 transition-all duration-150 cursor-pointer group relative ${
                isSelected
                  ? 'bg-[#faf8f4]'
                  : 'hover:bg-[#fcfbf9]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#b8533c]" />
              )}
              <div className="flex items-baseline justify-between gap-2">
                <div className={`text-2xl lg:text-[28px] font-bold tracking-tight font-sans ${metric.color}`}>
                  {metric.value}
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${metric.badgeColor}`}>
                  {metric.badge}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
                <span>{metric.label}</span>
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Filter
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
