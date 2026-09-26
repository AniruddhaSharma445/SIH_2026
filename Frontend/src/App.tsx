import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { CaseWorkspacePage } from './pages/CaseWorkspacePage';
import { Investigations } from './pages/Investigations';
import { CaseDetails } from './pages/CaseDetails';
import { Network } from './pages/Network';
import { DataSources } from './pages/DataSources';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Alerts } from './pages/Alerts';
import { AIAssistant } from './pages/AIAssistant';
import { Timeline } from './pages/Timeline';
import { AnveshakAuthGate } from './components/AnveshakAuthGate';


function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic header based on route
  const getHeaderMeta = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      return {
        title: 'ANVESHAK Intelligence Dashboard',
        subtitle: 'AI-Powered Criminal Network Analysis Platform',
      };
    }
    if (path.startsWith('/investigations/')) {
      return {
        title: 'Case Investigation Dossier',
        subtitle: 'Multi-source evidence correlation & topological analysis',
      };
    }
    if (path === '/investigations') {
      return {
        title: 'Active Investigations Index',
        subtitle: 'Case repository and ongoing criminal network inquiries',
      };
    }
    if (path === '/network') {
      return {
        title: 'Network Graph Explorer',
        subtitle: 'Interactive multi-hop entity resolution & relationship mapping',
      };
    }
    if (path === '/data-sources') {
      return {
        title: 'Ingestion Data Sources',
        subtitle: 'Telecom, financial, legal, and telemetry source streams',
      };
    }
        if (path === '/reports') {
      return {
        title: 'Investigation Reports & Dossiers',
        subtitle: 'Exportable briefs, graph centrality summaries, and audit logs',
      };
    }
    if (path === '/alerts') {
      return {
        title: 'Alerts',
        subtitle: 'Flagged activity and risk signals across active cases',
      };
    }
    if (path === '/ai-assistant') {
      return {
        title: 'AI Assistant',
        subtitle: 'Ask questions about the active case in plain English',
      };
    }
    if (path === '/timeline') {
      return {
        title: 'Timeline & Chronological Reconstruction',
        subtitle: 'Reconstruct how the case unfolded, event by event',
      };
    }
    if (path === '/upload-data') {
      return {
        title: 'Database Upload & Evidence Ingestion',
        subtitle: 'Upload and resolve records into the case database',
      };
    }
    if (path === '/settings') {
      return {
        title: 'System Settings & Ethics Parameters',
        subtitle: 'Investigator preferences, thresholds, and compliance guardrails',
      };
    }
    return {
      title: 'ANVESHAK Intelligence',
      subtitle: 'Criminal Network Analysis System',
    };
  };

  const meta = getHeaderMeta();

  // Root Case Workspace view matches the exact editorial layout from the user's reference screenshot
  if (location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/workspace') {
    return <CaseWorkspacePage />;
  }

 

  return (
    <div className="min-h-screen bg-transparent text-[#1e242b] flex">
      {/* Dark Navy Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar */}
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/investigations/:id" element={<CaseDetails />} />
            <Route path="/network" element={<Network />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            
            
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AnveshakAuthGate>
      <Router>
        <Layout />
      </Router>
    </AnveshakAuthGate>
  );
}
