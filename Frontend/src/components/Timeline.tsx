import React from 'react';
import {
  FileText,
  PhoneCall,
  Landmark,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
  onSelectEvent?: (event: TimelineEvent) => void;
  title?: string;
  subtitle?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  onSelectEvent,
  title = 'Investigation Timeline',
  subtitle = 'Chronological sequence of evidentiary discoveries and graph link events',
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FIR':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'CDR':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Financial':
        return <Landmark className="w-3.5 h-3.5 text-purple-600" />;
      case 'Network Analysis':
        return <Share2 className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Field Intel':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Flagged':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Analyzed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {events.length} Milestones
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event) => (
          <div
            key={event.id}
            className="relative group cursor-pointer"
            onClick={() => onSelectEvent && onSelectEvent(event)}
          >
            {/* Step marker pin */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-[9px] font-bold text-blue-700 shadow-xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              {event.stepNumber}
            </div>

            {/* Event Content Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {event.stepNumber} —
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    {event.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {event.date} {event.time && `• ${event.time}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {event.description}
              </p>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                  {getCategoryIcon(event.category)}
                  {event.category}
                </span>

                {event.relatedEntityName && (
                  <span className="text-slate-600">
                    Linked Entity:{' '}
                    <strong className="text-slate-900 font-semibold">
                      {event.relatedEntityName}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
