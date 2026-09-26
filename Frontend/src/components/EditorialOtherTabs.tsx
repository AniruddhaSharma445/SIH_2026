import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowRight,
  FileText,
  AlertTriangle,
  Users,
  GitFork,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TabProps {
  onInspectEntity?: (id: string) => void;
}

export const EditorialPeopleView: React.FC<TabProps> = ({ onInspectEntity }) => {
  const [filter, setFilter] = useState<'All' | 'Needs review' | 'Resolved'>('All');
  const [search, setSearch] = useState('');

  const people = [
    {
      id: 'ent-rahul',
      name: 'Rahul Sharma',
      role: 'Prime Bridge Entity & Coordinator',
      location: 'Bhopal Central & New Market',
      status: 'Needs review' as const,
      aliases: ['Rahul K Sharma', 'R. Sharma', 'rahulsharma'],
      records: '18 Burst Calls • AC-001 • MP04AB1234',
    },
    {
      id: 'ent-amit',
      name: 'Amit Verma',
      role: 'Operating Associate & Delivery Contact',
      location: 'New Market & Habibganj',
      status: 'Needs review' as const,
      aliases: ['amitverma'],
      records: 'FIR_001 • AC-002 • Phone 9000010001',
    },
    {
      id: 'ent-suresh',
      name: 'Suresh Patel',
      role: 'Circular Transfer Mule & Intermediary',
      location: 'Habibganj Station, Bhopal',
      status: 'Needs review' as const,
      aliases: ['sureshpatel'],
      records: 'FIN_001 Return ₹7,500 • AC-003',
    },
    {
      id: 'ent-neeraj',
      name: 'Neeraj Khan',
      role: 'Regional Transporter (Sehore Road)',
      location: 'Sehore Road Corridor',
      status: 'Needs review' as const,
      aliases: ['N. Khan', 'neerajkhan'],
      records: 'FIR_003 • MP04EF9012 • AC-004',
    },
    {
      id: 'ent-vikram',
      name: 'Vikram Singh',
      role: 'Logistics Associate & Receiver',
      location: 'Kolar Road, Bhopal',
      status: 'Resolved' as const,
      aliases: ['vikramsingh'],
      records: 'FIR_004 • MP04GH3456 • AC-005',
    },
    {
      id: 'ent-pooja',
      name: 'Pooja Mehta',
      role: 'Kolar Road Companion',
      location: 'Kolar Road, Bhopal',
      status: 'Resolved' as const,
      aliases: ['poojamehta'],
      records: 'FIR_004 • Phone 9000010005',
    },
    {
      id: 'ent-manish',
      name: 'Manish Gupta',
      role: 'Misrod Facilitator & Contact',
      location: 'Misrod, Bhopal',
      status: 'Resolved' as const,
      aliases: ['M. Gupta', 'manishgupta'],
      records: 'FIR_011 • MP04NP6789 • AC-008',
    },
    {
      id: 'ent-farhan',
      name: 'Farhan Ali',
      role: 'MP Nagar Correlated Contact',
      location: 'MP Nagar, Bhopal',
      status: 'Resolved' as const,
      aliases: ['F. Ali', 'farhanali'],
      records: 'FIR_012 • MP04QR0123 • AC-009',
    },
    {
      id: 'ent-imran',
      name: 'Imran Sheikh',
      role: 'Old Bhopal Contact',
      location: 'Old Bhopal',
      status: 'Resolved' as const,
      aliases: ['imransheikh'],
      records: 'FIR_005 • MP04JK7890 • AC-006',
    },
    {
      id: 'ent-karan',
      name: 'Karan Joshi',
      role: 'Old Bhopal Sighting Subject',
      location: 'Old Bhopal',
      status: 'Resolved' as const,
      aliases: ['karanjoshi'],
      records: 'FIR_006 • MP04LM2345 • AC-007',
    },
    {
      id: 'ent-rakesh',
      name: 'Rakesh Yadav',
      role: 'Old Bhopal Sighting Lead',
      location: 'Old Bhopal',
      status: 'Resolved' as const,
      aliases: ['R. Yadav', 'rakeshyadav'],
      records: 'FIR_005 • Phone 9000010006',
    },
    {
      id: 'ent-deepak',
      name: 'Deepak Rao',
      role: 'Misrod Field Contact',
      location: 'Misrod, Bhopal',
      status: 'Resolved' as const,
      aliases: ['deepakrao'],
      records: 'FIR_007 • Phone 9000010009',
    },
    {
      id: 'ent-anjali',
      name: 'Anjali Verma',
      role: 'Misrod Field Contact',
      location: 'Misrod, Bhopal',
      status: 'Resolved' as const,
      aliases: ['anjaliverma'],
      records: 'FIR_007 • Phone 9000010010',
    },
    {
      id: 'ent-sameer',
      name: 'Sameer Khan',
      role: 'Correlated Contact (CASE-2026-021)',
      location: 'Bhopal Outer',
      status: 'Resolved' as const,
      aliases: ['sameerkhan'],
      records: 'FIR_008 • Phone 9000010012',
    },
    {
      id: 'ent-nitin',
      name: 'Nitin Tiwari',
      role: 'Intelligence Docket Contact',
      location: 'Bhopal Central',
      status: 'Resolved' as const,
      aliases: ['nitintiwari'],
      records: 'FIR_008 • Phone 9000010013',
    },
    {
      id: 'ent-arjun-malhotra',
      name: 'Arjun Malhotra',
      role: 'Bairagarh Intel Lead',
      location: 'Bairagarh, Bhopal',
      status: 'Resolved' as const,
      aliases: ['A. Malhotra', 'arjunmalhotra'],
      records: 'FIR_008 • AC-010 • Phone 9000010016',
    },
    {
      id: 'ent-rohit',
      name: 'Rohit Jain',
      role: 'Bairagarh Associate',
      location: 'Bairagarh, Bhopal',
      status: 'Resolved' as const,
      aliases: ['rohitjain'],
      records: 'FIR_008 • Phone 9000010017',
    },
  ];

  const filtered = people.filter((p) => {
    if (filter !== 'All' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-2xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#ece8df] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            People Identified (32 total)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-referenced across call records, property registry, and financial mandates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#fbfaf8] border border-[#e5e0d8] rounded-md focus:outline-none focus:border-slate-400 w-44"
            />
          </div>

          <div className="flex items-center bg-[#f6f4ef] p-0.5 rounded-md border border-[#e5e0d8] text-xs">
            {(['All', 'Needs review', 'Resolved'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  filter === t
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#f2efe9]">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf8f4] transition-colors"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    p.status === 'Needs review'
                      ? 'bg-[#fbece8] text-[#b44c35]'
                      : 'bg-[#eaf5ee] text-[#2e7d4f]'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {p.role} • {p.location}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aliases: {p.aliases.join(', ')} • {p.records}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{p.records}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EditorialConnectionsView: React.FC = () => {
  const connections = [
    {
      id: 'conn-1',
      source: 'Rahul Sharma',
      target: 'Amit Verma',
      type: 'Planned Delivery Meeting (FIR_001)',
      confidence: '98.5%',
      status: 'Needs review',
      date: '01 Aug 2026',
    },
    {
      id: 'conn-2',
      source: 'Amit Verma',
      target: 'Suresh Patel',
      type: 'Habibganj Station Meeting (FIR_002)',
      confidence: '96.0%',
      status: 'Needs review',
      date: '02 Aug 2026',
    },
    {
      id: 'conn-3',
      source: 'Rahul Sharma',
      target: 'Neeraj Khan',
      type: 'Sehore Road Meeting (FIR_003)',
      confidence: '94.0%',
      status: 'Needs review',
      date: '03 Aug 2026',
    },
    {
      id: 'conn-4',
      source: 'Suresh Patel',
      target: 'Rahul Sharma',
      type: 'Circular Transfer Return ₹7,500 (FIN_001)',
      confidence: '99.5%',
      status: 'Needs review',
      date: '07 Aug 2026',
    },
    {
      id: 'conn-5',
      source: 'Vikram Singh',
      target: 'Pooja Mehta',
      type: 'Kolar Road Field Sighting (FIR_004)',
      confidence: '90.0%',
      status: 'Resolved',
      date: '04 Aug 2026',
    },
    {
      id: 'conn-6',
      source: 'Rakesh Yadav',
      target: 'Imran Sheikh',
      type: 'Old Bhopal Sighting (FIR_005)',
      confidence: '92.0%',
      status: 'Resolved',
      date: '05 Aug 2026',
    },
    {
      id: 'conn-7',
      source: 'Imran Sheikh',
      target: 'Karan Joshi',
      type: 'Old Bhopal Association (FIR_006)',
      confidence: '91.0%',
      status: 'Resolved',
      date: '06 Aug 2026',
    },
    {
      id: 'conn-8',
      source: 'Deepak Rao',
      target: 'Anjali Verma',
      type: 'Misrod Meeting (FIR_007)',
      confidence: '93.0%',
      status: 'Resolved',
      date: '07 Aug 2026',
    },
    {
      id: 'conn-9',
      source: 'Manish Gupta',
      target: 'Farhan Ali',
      type: 'MP Nagar Correlation (FIR_012)',
      confidence: '95.0%',
      status: 'Resolved',
      date: '12 Aug 2026',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-2xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Mapped Connections ({connections.length} key links in Bhopal Syndicate)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithmic correlation across banking tranches, CDR bilateral logs, and ANPR checkposts
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#fcfbf9] border-b border-[#ece8df] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-6">Source Entity</th>
              <th className="py-3 px-6">Target Entity</th>
              <th className="py-3 px-6">Relationship Type</th>
              <th className="py-3 px-6">Confidence</th>
              <th className="py-3 px-6">Timestamp</th>
              <th className="py-3 px-6 text-right">Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2efe9] text-slate-700 font-medium">
            {connections.map((c) => (
              <tr key={c.id} className="hover:bg-[#faf8f4] transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900">{c.source}</td>
                <td className="py-3.5 px-6 font-bold text-slate-900">{c.target}</td>
                <td className="py-3.5 px-6 text-slate-600">{c.type}</td>
                <td className="py-3.5 px-6 font-semibold text-slate-800">{c.confidence}</td>
                <td className="py-3.5 px-6 text-slate-500 whitespace-nowrap">{c.date}</td>
                <td className="py-3.5 px-6 text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                      c.status === 'Needs review'
                        ? 'bg-[#fbece8] text-[#b44c35]'
                        : 'bg-[#eaf5ee] text-[#2e7d4f]'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const EditorialAlertsView: React.FC = () => {
  const alerts = [
    {
      id: 'ALT-CDR-01',
      title: 'Communication Spike Intercept (CDR_SPIKE_01)',
      entity: '9000010000 (Rahul Sharma)',
      reason: '18 calls in 140 minutes on 09-Aug-2026 contacting Amit Verma, Suresh Patel, Neeraj Khan, and Vikram Singh.',
      date: '09 Aug 2026',
      severity: 'Critical',
    },
    {
      id: 'ALT-FIN-01',
      title: 'Closed Circular Transfer Loop (FIN_001)',
      entity: 'AC-001 ➔ AC-002 ➔ AC-003 ➔ AC-001',
      reason: 'Circular return: AC-001 sent ₹18,500 to AC-002, AC-002 sent ₹12,000 to AC-003, AC-003 returned ₹7,500 to AC-001.',
      date: '07 Aug 2026',
      severity: 'Critical',
    },
    {
      id: 'ALT-RES-01',
      title: 'Identity Resolution Cluster (Aliases Resolved)',
      entity: 'Rahul Sharma & Neeraj Khan',
      reason: 'Matched "Rahul K Sharma" (FIR_001) with "R. Sharma" (FIR_009) and "N. Khan" (FIR_003) with "Neeraj Khan" (FIR_010).',
      date: '09 Aug 2026',
      severity: 'High',
    },
    {
      id: 'ALT-VEH-01',
      title: 'Vehicle Co-Location & Transit Alignment',
      entity: 'MP04AB1234 & MP04CD5678',
      reason: 'Vehicles sighted during coordinated delivery meetings across New Market and Habibganj station.',
      date: '02 Aug 2026',
      severity: 'Medium',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-2xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Needing Review ({alerts.length} Priority Alerts)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            High-confidence anomaly flags generated by topological graph correlation engine
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#f2efe9]">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="px-6 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-[#faf8f4] transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-slate-500">{a.id}</span>
                <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fbece8] text-[#b44c35]">
                  {a.severity}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                Entity: <strong className="text-slate-900">{a.entity}</strong>
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {a.reason}
              </p>
            </div>

            <span className="text-xs text-slate-400 whitespace-nowrap font-medium">{a.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EditorialDocumentsView: React.FC = () => {
  const documents = [
    {
      id: 'DOC-FIR-001',
      title: 'First Information Report (FIR_001/2026)',
      type: 'Police Legal Record',
      fileSize: '1.4 MB PDF',
      summary: 'Bhopal Central Crime Branch filing: Rahul K Sharma met Amit Verma near New Market; planned delivery.',
      date: '01 Aug 2026',
    },
    {
      id: 'DOC-BNK-FIN01',
      title: 'Certified Bank Ledger Extract (FIN_001 Circular Flow)',
      type: 'Core Financial Mandate',
      fileSize: '1.2 MB PDF',
      summary: 'Bank statements verifying circular return: AC-001 -> AC-002 -> AC-003 -> AC-001 (₹7,500 returned).',
      date: '07 Aug 2026',
    },
    {
      id: 'DOC-TEL-SPIKE',
      title: 'CDR_SPIKE_01 Call Detail Records (18 Burst Calls)',
      type: 'Telecom Intercepts',
      fileSize: '2.1 MB CSV',
      summary: '18 recorded calls in 140 minutes from 9000010000 (Rahul Sharma) to Amit, Suresh, Neeraj, and Vikram.',
      date: '09 Aug 2026',
    },
    {
      id: 'DOC-VEH-001',
      title: 'ANPR & Fastag Sighting Log (MP04AB1234 & MP04CD5678)',
      type: 'Vehicle Telemetry',
      fileSize: '650 KB PDF',
      summary: 'Official vehicle sighting logs in New Market and Habibganj station from FIR_001 and FIR_002.',
      date: '02 Aug 2026',
    },
    {
      id: 'DOC-FIR-010',
      title: 'Financial Analysis Extract (FIR_010/2026)',
      type: 'Financial Crime Docket',
      fileSize: '1.8 MB PDF',
      summary: 'Cross-verifies AC-001, AC-003, AC-004 accounts with Neeraj Khan and Suresh Patel statements.',
      date: '10 Aug 2026',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-2xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Case Evidence Documents (105 total reviewed)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified primary evidence items linked into current case docket
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#f2efe9]">
        {documents.map((d) => (
          <div
            key={d.id}
            className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#faf8f4] transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-900">{d.title}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {d.type}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {d.summary}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">{d.fileSize}</span>
              <span className="text-slate-500 font-medium whitespace-nowrap">{d.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
