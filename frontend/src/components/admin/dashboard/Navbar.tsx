import React from 'react';
import { Menu, Activity, Plus, RefreshCw } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  fetchData: () => void;
  setShowAddModal: (show: boolean) => void;
}

const TAB_LABELS: Record<string, string> = {
  'overview':       'Overview',
  'live-map':       'Live Map',
  'approvals':      'Approvals',
  'techs':          'Technicians',
  'bookings':       'Bookings',
  'tools':          'Store & Logistics',
  'transactions':   'Transactions',
  'notifications':  'Notifications',
};

export function Navbar({ sidebarOpen, setSidebarOpen, activeTab, fetchData, setShowAddModal }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 h-[64px] sm:h-[72px] bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.4)] shrink-0">
      {/* Left — hamburger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
            {TAB_LABELS[activeTab] || activeTab}
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.25em] hidden sm:block">Admin Console</p>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Refresh */}
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Add Technician — full button on md+, icon-only on mobile */}
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-black/20"
        >
          <Plus className="w-4 h-4" />
          Add Technician
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="sm:hidden p-2.5 bg-white text-slate-900 rounded-xl transition active:scale-95 shadow-lg"
          title="Add Technician"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Admin badge */}
        <div className="hidden xs:flex w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] items-center justify-center text-white font-black text-[8px] uppercase tracking-widest shrink-0">
          ADM
        </div>
      </div>
    </header>
  );
}
