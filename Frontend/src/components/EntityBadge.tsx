import React from 'react';
import {
  User,
  Phone,
  Landmark,
  Car,
  MapPin,
  FileText,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { EntityType, RiskLevel } from '../types';

interface EntityBadgeProps {
  type: EntityType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
  className?: string;
}

export const entityColors: Record<
  EntityType,
  {
    bg: string;
    text: string;
    border: string;
    iconColor: string;
    dotColor: string;
    label: string;
  }
> = {
  person: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    dotColor: 'bg-blue-600',
    label: 'Person',
  },
  phone: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    dotColor: 'bg-emerald-600',
    label: 'Phone / CDR',
  },
  account: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    iconColor: 'text-purple-600',
    dotColor: 'bg-purple-600',
    label: 'Bank Account',
  },
  vehicle: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    dotColor: 'bg-amber-600',
    label: 'Vehicle',
  },
  location: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    iconColor: 'text-rose-600',
    dotColor: 'bg-rose-600',
    label: 'Location',
  },
  fir: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    iconColor: 'text-slate-600',
    dotColor: 'bg-slate-600',
    label: 'FIR Record',
  },
  case: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    dotColor: 'bg-indigo-600',
    label: 'Case File',
  },
};

export const getEntityIcon = (type: EntityType, className = 'w-3.5 h-3.5') => {
  switch (type) {
    case 'person':
      return <User className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'account':
      return <Landmark className={className} />;
    case 'vehicle':
      return <Car className={className} />;
    case 'location':
      return <MapPin className={className} />;
    case 'fir':
      return <FileText className={className} />;
    case 'case':
      return <Briefcase className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

export const EntityBadge: React.FC<EntityBadgeProps> = ({
  type,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const meta = entityColors[type] || entityColors.person;
  const displayText = label || meta.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <span className={meta.iconColor}>{getEntityIcon(type, size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')}</span>}
      <span>{displayText}</span>
    </span>
  );
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'sm',
  className = '',
}) => {
  const configs: Record<
    RiskLevel,
    { bg: string; text: string; border: string; label: string; icon: React.ReactNode }
  > = {
    high: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      label: 'High Risk',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: 'Flagged / Warning',
      icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
    },
    verified: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'Verified Link',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    },
    neutral: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      label: 'Standard Entity',
      icon: null,
    },
  };

  const c = configs[level] || configs.neutral;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${c.bg} ${c.text} ${c.border} ${padding} ${className}`}
    >
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};
