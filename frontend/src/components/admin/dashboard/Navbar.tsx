import React from 'react';
import { Menu, Activity, Plus } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  fetchData: () => void;
  setShowAddModal: (show: boolean) => void;
}

export function Navbar({ sidebarOpen, setSidebarOpen, activeTab, fetchData, setShowAddModal }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 px-4 sm:px-8 py-4 flex justify-between items-center bg-white/10 backdrop-blur-2xl border-b border-white/40 shadow-2xl shadow-white/5">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 hover:bg-slate-950/10 rounded-lg text-slate-950 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tighter italic">{activeTab}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={fetchData}
          className="p-2 sm:p-2.5 bg-white/10 border border-white/40 text-slate-950 hover:text-cyan-600 rounded-xl transition-all shadow-xl"
          title="Refresh Data"
        >
          <Activity className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-slate-950 text-white hover:scale-105 active:scale-95 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-2xl"
        >
          <Plus className="w-4 h-4" /> Add Technician
        </button>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="md:hidden p-2 bg-slate-950 text-white rounded-xl transition shadow-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xs">
          ADMIN
        </div>
      </div>
    </header>
  );
}
