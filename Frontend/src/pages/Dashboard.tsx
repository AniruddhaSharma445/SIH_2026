import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Investigation,
  Entity,
  Relationship,
  AlertItem,
} from '../types';
import { CleanNetworkGraph } from '../components/CleanNetworkGraph';
import { CleanEntityDossier } from '../components/CleanEntityDossier';
import { CleanAlertsTable } from '../components/CleanAlertsTable';
import { CallRecordsModal } from '../components/CallRecordsModal';
import { WhyFlaggedModal } from '../components/WhyFlaggedModal';
import { BankingLedgerModal } from '../components/BankingLedgerModal';
import { VehicleLogsModal } from '../components/VehicleLogsModal';
import { FirDocumentModal } from '../components/FirDocumentModal';
import { LocationMapModal } from '../components/LocationMapModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeCase, setActiveCase] = useState<Investigation | null>(null);
  const [nodes, setNodes] = useState<Entity[]>([]);
  const [edges, setEdges] = useState<Relationship[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected target entity (defaults to Rahul Sharma)
  const [selectedEntityId, setSelectedEntityId] = useState<string>('ent-rahul');

  // Date filter state
  const [dateFilter, setDateFilter] = useState('Last 6 months');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [callRecordsOpen, setCallRecordsOpen] = useState(false);
  const [bankingLedgerOpen, setBankingLedgerOpen] = useState(false);
  const [vehicleLogsOpen, setVehicleLogsOpen] = useState(false);
  const [firDocumentOpen, setFirDocumentOpen] = useState(false);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [whyFlaggedEntity, setWhyFlaggedEntity] = useState<Entity | null>(null);
  const [whyFlaggedOpen, setWhyFlaggedOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [caseData, networkData, alertsData] = await Promise.all([
          api.getInvestigationById('INV-TRINETRA-001'),
          api.getNetworkData('INV-TRINETRA-001'),
          api.getAlerts('INV-TRINETRA-001'),
        ]);

        setActiveCase(caseData);
        setNodes(networkData.nodes);
        setEdges(networkData.edges);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Close date menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Target entity for dossier
  const currentEntity = nodes.find((n) => n.id === selectedEntityId) ||
    nodes.find((n) => n.id === 'ent-rohan') ||
    nodes[0];

  // Connected edges for target entity
  const currentConnectedEdges = edges.filter(
    (e) => currentEntity && (e.source === currentEntity.id || e.target === currentEntity.id)
  );

  const handleSelectNode = (node: Entity) => {
    setSelectedEntityId(node.id);
  };

  const handleAlertView = (alert: AlertItem) => {
    if (alert.entityId) {
      setSelectedEntityId(alert.entityId);
    }
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Loading investigation graph...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header matching reference: Title + Subtitle + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Network Analysis
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            Explore relationships between people, accounts, locations and communication data.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div ref={dateMenuRef} className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateMenuOpen(!dateMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateFilter}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {dateMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-40">
              {['Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 1 year', 'All time'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setDateFilter(item);
                    setDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                    dateFilter === item
                      ? 'font-bold text-blue-600 bg-blue-50/50'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Workspace: Two-Column Layout (Graph Canvas on Left, Entity Dossier on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Network Analysis Graph (approx 7 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <CleanNetworkGraph
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedEntityId}
            onSelectNode={handleSelectNode}
            onViewCallRecords={() => setCallRecordsOpen(true)}
            onViewBankingLedger={() => setBankingLedgerOpen(true)}
            onViewVehicleLogs={() => setVehicleLogsOpen(true)}
            onViewFirDocument={() => setFirDocumentOpen(true)}
            onViewLocationMap={() => setLocationMapOpen(true)}
          />
        </div>

        {/* Right Column: Target Suspect / Entity Dossier (approx 5 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          {currentEntity && (
            <CleanEntityDossier
              entity={currentEntity}
              connectedEdges={currentConnectedEdges}
              allNodes={nodes}
              onSelectConnectedNode={handleSelectNode}
              onViewActivityAll={() => {
                const el = document.getElementById('recent-alerts-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onWhyFlagged={() => {
                setWhyFlaggedEntity(currentEntity);
                setWhyFlaggedOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* 3. Bottom Section: Recent Alerts Table matching reference screenshot */}
      <div id="recent-alerts-section">
        <CleanAlertsTable
          alerts={alerts}
          onViewAlert={handleAlertView}
          onViewAll={() => navigate('/investigations')}
        />
      </div>

      {/* Modals */}
      <CallRecordsModal
        isOpen={callRecordsOpen}
        onClose={() => setCallRecordsOpen(false)}
        entityName={currentEntity?.name || 'Rahul Sharma'}
        phoneNumber="+91 90000 10000"
      />

      <BankingLedgerModal
        isOpen={bankingLedgerOpen}
        onClose={() => setBankingLedgerOpen(false)}
        accountName="State Bank of India"
        accountNumber="4567891201 (AC-001)"
      />

      <VehicleLogsModal
        isOpen={vehicleLogsOpen}
        onClose={() => setVehicleLogsOpen(false)}
        plateNumber="MP04AB1234"
        vehicleModel="Mahindra Scorpio (Black)"
      />

      <FirDocumentModal
        isOpen={firDocumentOpen}
        onClose={() => setFirDocumentOpen(false)}
        firNumber="FIR_001"
      />

      <LocationMapModal
        isOpen={locationMapOpen}
        onClose={() => setLocationMapOpen(false)}
        locationName="Bhopal, Madhya Pradesh"
      />

      {whyFlaggedEntity && (
        <WhyFlaggedModal
          isOpen={whyFlaggedOpen}
          onClose={() => setWhyFlaggedOpen(false)}
          entity={whyFlaggedEntity}
        />
      )}
    </div>
  );
};
