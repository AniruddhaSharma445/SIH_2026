import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  Building2,
  Phone,
  Truck,
  Landmark,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export interface EditorialEntity {
  id: string;
  name: string;
  subtitle: string;
  category: 'person' | 'organization' | 'financial' | 'telecom' | 'vehicle' | 'location' | 'document';
  status: 'Needs review' | 'Resolved';
}

interface EditorialEntitiesListProps {
  selectedEntityId?: string;
  onSelectEntity: (entityId: string) => void;
  statusFilterOverride?: 'Needs review' | 'Resolved' | null;
}

export const EditorialEntitiesList: React.FC<EditorialEntitiesListProps> = ({
  selectedEntityId = 'ent-rahul',
  onSelectEntity,
  statusFilterOverride,
}) => {
  const [filter, setFilter] = useState<'All' | 'Needs review' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const entities: EditorialEntity[] = [
    {
      id: 'ent-rahul',
      name: 'Rahul Sharma',
      subtitle: 'Prime bridge entity • 18 burst calls • 3 aliases',
      category: 'person',
      status: 'Needs review',
    },
    {
      id: 'ent-amit',
      name: 'Amit Verma',
      subtitle: 'Delivery planning • New Market • FIR_001',
      category: 'person',
      status: 'Needs review',
    },
    {
      id: 'ent-suresh',
      name: 'Suresh Patel',
      subtitle: 'Circular mule • Return transfer ₹7,500',
      category: 'person',
      status: 'Needs review',
    },
    {
      id: 'ent-neeraj',
      name: 'Neeraj Khan',
      subtitle: 'Sehore Road meeting • MP04EF9012 • AC-004',
      category: 'person',
      status: 'Needs review',
    },
    {
      id: 'ent-vikram',
      name: 'Vikram Singh',
      subtitle: 'Kolar Road transit • MP04GH3456 • AC-005',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-pooja',
      name: 'Pooja Mehta',
      subtitle: 'Kolar Road companion • Phone 9000010005',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-manish',
      name: 'Manish Gupta',
      subtitle: 'Misrod contact • MP04NP6789 • AC-008',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-farhan',
      name: 'Farhan Ali',
      subtitle: 'MP Nagar correlation • Phone 9000010014',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-imran',
      name: 'Imran Sheikh',
      subtitle: 'Old Bhopal communication • MP04JK7890',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-karan',
      name: 'Karan Joshi',
      subtitle: 'Old Bhopal note • MP04LM2345',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-deepak',
      name: 'Deepak Rao',
      subtitle: 'Misrod rendezvous • Phone 9000010009',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-anjali',
      name: 'Anjali Verma',
      subtitle: 'Misrod rendezvous • Phone 9000010010',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-sameer',
      name: 'Sameer Khan',
      subtitle: 'Connected in CASE-2026-021 • Phone 9000010012',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-nitin',
      name: 'Nitin Tiwari',
      subtitle: 'Intelligence docket • Phone 9000010013',
      category: 'person',
      status: 'Resolved',
    },
    {
      id: 'ent-sbi-acct',
      name: 'A/C 4567891201',
      subtitle: 'Originating account (AC-001) • ₹18.5k sent, ₹7.5k returned',
      category: 'financial',
      status: 'Needs review',
    },
    {
      id: 'ent-acct-suresh',
      name: 'A/C 4567891203',
      subtitle: 'Intermediary mule account (AC-003) • Circular return ledger',
      category: 'financial',
      status: 'Needs review',
    },
    {
      id: 'ent-vehicle-rahul',
      name: 'Scorpio MP04AB1234',
      subtitle: 'Transit vehicle (VH-001) • Registered to Rahul Sharma',
      category: 'vehicle',
      status: 'Needs review',
    },
    {
      id: 'ent-vehicle-amit',
      name: 'Transit Car MP04CD5678',
      subtitle: 'Habibganj sighting (VH-002) • Sighted with Suresh & Amit',
      category: 'vehicle',
      status: 'Resolved',
    },
    {
      id: 'ent-fir-001',
      name: 'FIR_001 Docket',
      subtitle: 'Legal charge sheet • New Market meeting • Sec 420/120B',
      category: 'document',
      status: 'Resolved',
    },
  ];

  // Effective filter
  const effectiveFilter = statusFilterOverride || filter;

  const filteredEntities = useMemo(() => {
    return entities.filter((item) => {
      if (effectiveFilter !== 'All' && item.status !== effectiveFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchSub = item.subtitle.toLowerCase().includes(query);
        if (!matchName && !matchSub) return false;
      }
      return true;
    });
  }, [entities, effectiveFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: entities.length,
      needsReview: entities.filter((e) => e.status === 'Needs review').length,
      resolved: entities.filter((e) => e.status === 'Resolved').length,
    };
  }, [entities]);

  const renderCategoryIcon = (category: EditorialEntity['category']) => {
    switch (category) {
      case 'person':
        return <User className="w-3.5 h-3.5 text-slate-500" />;
      case 'organization':
        return <Building2 className="w-3.5 h-3.5 text-slate-500" />;
      case 'financial':
        return <Landmark className="w-3.5 h-3.5 text-amber-600" />;
      case 'telecom':
        return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'vehicle':
        return <Truck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-xs overflow-hidden flex flex-col h-full">
      {/* 1. Header */}
      <div className="px-5 py-3.5 border-b border-[#ece8df] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Entities of interest
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-[#f4f1ea] px-2 py-0.5 rounded-full">
            {counts.all}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Ranked by centrality
        </span>
      </div>

      {/* 2. Filter Tabs & Search Box */}
      <div className="p-3 border-b border-[#ece8df] bg-[#faf9f6] space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities, aliases, dockets..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#e0dbd1] rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-[#b8533c] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setFilter('All')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              effectiveFilter === 'All'
                ? 'bg-[#1c252e] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-[#e5e0d8] hover:bg-[#f2efe9]'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter('Needs review')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              effectiveFilter === 'Needs review'
                ? 'bg-[#b8533c] text-white shadow-2xs'
                : 'bg-white text-[#b44c35] border border-[#eed7d0] hover:bg-[#fcf0ed]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Review ({counts.needsReview})
          </button>
          <button
            type="button"
            onClick={() => setFilter('Resolved')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              effectiveFilter === 'Resolved'
                ? 'bg-[#2d6a4f] text-white shadow-2xs'
                : 'bg-white text-[#2d6a4f] border border-[#d6eade] hover:bg-[#eef6f0]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Resolved ({counts.resolved})
          </button>
        </div>
      </div>

      {/* 3. Entity Rows */}
      <div className="divide-y divide-[#f2efe9] overflow-y-auto flex-1 max-h-[580px]">
        {filteredEntities.length === 0 ? (
          <div className="py-10 text-center px-4">
            <p className="text-xs text-slate-400 font-medium">No entities match this query</p>
            <button
              type="button"
              onClick={() => {
                setFilter('All');
                setSearchQuery('');
              }}
              className="mt-2 text-[11px] text-[#b8533c] hover:underline font-semibold cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isSelected =
              selectedEntityId === entity.id ||
              selectedEntityId?.replace('ent-', '').replace('-', '_') === entity.id.replace('ent-', '').replace('-', '_') ||
              ((selectedEntityId === 'arjun' || selectedEntityId === 'ent-arjun') && entity.id === 'ent-rahul');
            const isNeedsReview = entity.status === 'Needs review';

            return (
              <div
                key={entity.id}
                onClick={() => onSelectEntity(entity.id)}
                className={`px-5 py-3 flex items-center justify-between gap-3 cursor-pointer transition-all duration-100 relative group ${
                  isSelected
                    ? 'bg-[#faf7f2] shadow-2xs'
                    : 'hover:bg-[#fcfbf9]'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#b8533c]" />
                )}

                {/* Left: Icon + Content */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-white border-[#e0dbd1] shadow-2xs'
                        : 'bg-[#f6f4ee] border-[#ece7de] group-hover:bg-white'
                    }`}
                  >
                    {renderCategoryIcon(entity.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate tracking-tight">
                      {entity.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate leading-tight">
                      {entity.subtitle}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                    isNeedsReview
                      ? 'bg-[#fcf0ed] text-[#b44c35] border-[#f4dad2]'
                      : 'bg-[#eef6f0] text-[#2d6a4f] border-[#d5ecdc]'
                  }`}
                >
                  {entity.status}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-[#fbfaf8] border-t border-[#ece8df] flex items-center justify-between text-[11px] text-slate-400">
        <span>Click an entity to isolate in graph</span>
        <span className="text-slate-500 font-medium">32 verified</span>
      </div>
    </div>
  );
};
