import React, { useState } from 'react';
import {
  MoreVertical,
  Phone,
  Landmark,
  Car,
  MapPin,
  FileText,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  User,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Entity, Relationship } from '../types';

interface CleanEntityDossierProps {
  entity: Entity;
  connectedEdges: Relationship[];
  allNodes: Entity[];
  onSelectConnectedNode?: (node: Entity) => void;
  onViewActivityAll?: () => void;
  onWhyFlagged?: () => void;
}

export const CleanEntityDossier: React.FC<CleanEntityDossierProps> = ({
  entity,
  connectedEdges,
  allNodes,
  onSelectConnectedNode,
  onViewActivityAll,
  onWhyFlagged,
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Connections' | 'Cases' | 'Activity'>('Overview');

  const metadata = entity.metadata || {};

  // Recent activity items matching the synthetic dataset
  const activities = [
    {
      id: 'act-1',
      title: 'Communication spike detected (CDR_SPIKE_01)',
      date: '09 Aug 2026',
      icon: Phone,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'act-2',
      title: 'Circular transfer detected (FIN_001)',
      date: '05 Aug 2026',
      icon: Landmark,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'act-3',
      title: 'Incident filed in FIR_001',
      date: '01 Aug 2026',
      icon: FileText,
      iconBg: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'act-4',
      title: 'Multi-source match across 6 FIRs',
      date: '01 Aug 2026',
      icon: ShieldAlert,
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* 1. Header with Avatar, Name, ID, Pill Badge and Menu */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {entity.metadata?.avatarUrl || entity.id === 'ent-rohan' ? (
              <img
                src={entity.metadata?.avatarUrl || '/assets/rohan_mehta.jpg'}
                alt={entity.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base">
                {entity.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {entity.name}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded-md">
                {metadata.relevanceBadge || 'High Relevance'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {entity.identifier || 'Person • ID: P-1042'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onWhyFlagged}
          title="Entity options & details"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Navigation Tabs: Overview, Connections, Cases, Activity */}
      <div className="flex items-center px-5 border-b border-slate-100 gap-6">
        {(['Overview', 'Connections', 'Cases', 'Activity'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Tab Body */}
      <div className="p-5 overflow-y-auto flex-1 space-y-6">
        {activeTab === 'Overview' && (
          <>
            {/* Key-Value Details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Also Known As:</span>
                <span className="text-slate-800 font-medium text-right">
                  {metadata.alsoKnownAs || 'Rahul K Sharma, R. Sharma'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Date of Birth:</span>
                <span className="text-slate-800 font-medium text-right">
                  {metadata.dateOfBirth || '14 Mar 1990'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Location:</span>
                <span className="text-slate-800 font-medium text-right">
                  {metadata.location || 'Bhopal Central, Madhya Pradesh'}
                </span>
              </div>
              <div className="flex items-start justify-between py-1">
                <span className="text-slate-400 font-medium">Linked Cases:</span>
                <span className="text-slate-800 font-medium text-right">
                  {metadata.linkedCases || 'CASE-2026-014, FIR_001, FIR_003'}
                </span>
              </div>
            </div>

            {/* Linked Entities Grid: 5 circular badges */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Linked Entities
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-1">
                    <Phone className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {metadata.phonesCount || 3}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Phones
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-1">
                    <Landmark className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {metadata.accountsCount || 2}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Accounts
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-1">
                    <Car className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {metadata.vehicleCount || 1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Vehicle
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-1">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {metadata.locationsCount || 2}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Locations
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-1">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {metadata.casesCount || 2}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Cases
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity List matching reference */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Activity
                </h4>
                <button
                  type="button"
                  onClick={onViewActivityAll}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {activities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${act.iconBg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-800">
                          {act.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                        {act.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'Connections' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 mb-3">
              Direct entities mapped to {entity.name} in current case scope:
            </p>
            {connectedEdges.map((edge) => {
              const otherId = edge.source === entity.id ? edge.target : edge.source;
              const otherNode = allNodes.find((n) => n.id === otherId);
              if (!otherNode) return null;

              return (
                <div
                  key={edge.id}
                  onClick={() => onSelectConnectedNode && onSelectConnectedNode(otherNode)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {otherNode.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {edge.label} • {otherNode.role || otherNode.type}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Cases' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">FIR-2024-0876</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs font-medium text-slate-800 mt-1">
                Operation Trinetra
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Primary suspect cited in organized syndicate and communications network.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">FIR-2023-1120</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
                  Archived
                </span>
              </div>
              <p className="text-xs font-medium text-slate-800 mt-1">
                Regional Logistics Fraud
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Historical record referencing vehicle usage and account transactions.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className="space-y-3">
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Communication Spike</span>
                <span className="text-slate-500 text-[11px]">Today, 14:20 • Tower 4 Triangulation</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Funds Transferred</span>
                <span className="text-slate-500 text-[11px]">19 Sep 2026 • ₹50,000 to SBI A/C XXXX9981</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Vehicle Observed</span>
                <span className="text-slate-500 text-[11px]">17 Sep 2026 • MP 04 AB 1234 at North Bypass</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
