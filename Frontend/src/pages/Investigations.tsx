import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FolderLock,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation } from '../types';
import { InvestigationCard } from '../components/InvestigationCard';

export const Investigations: React.FC = () => {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<Investigation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInvestigations().then((data) => {
      setInvestigations(data);
      setFilteredInvestigations(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let list = [...investigations];

    if (statusFilter !== 'All') {
      list = list.filter((inv) => inv.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.title.toLowerCase().includes(q) ||
          inv.caseNumber.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q) ||
          inv.firNumber.toLowerCase().includes(q) ||
          inv.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    setFilteredInvestigations(list);
  }, [searchQuery, statusFilter, investigations]);

  const statuses = ['All', 'Active', 'Under Review', 'Priority Investigation'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Investigations Dossier Index
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Active and archived criminal network investigation cases
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/network')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Cross-Case Graph Explorer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case ID, title, FIR, or tag..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Investigation Cards */}
      {filteredInvestigations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">
            No investigations found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or clear active status filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInvestigations.map((inv) => (
            <InvestigationCard key={inv.id} investigation={inv} />
          ))}
        </div>
      )}

      {/* Regulatory Notice */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>
          Notice: All investigation profiles and case numbers are
          fictional synthetic benchmarks for analytical demonstration.
        </span>
        <span className="font-mono text-slate-400">Total Cases: {investigations.length}</span>
      </div>
    </div>
  );
};
