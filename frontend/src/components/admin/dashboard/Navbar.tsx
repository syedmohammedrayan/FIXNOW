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
    <header className="sticky top-0 z-30 glass-panel border-b border-white/5 px-4 sm:px-8 py-4 flex justify-between items-center bg-slate-900/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-white capitalize">{activeTab}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={fetchData}
          className="p-2 sm:p-2.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all shadow-xl"
          title="Refresh Data"
        >
          <Activity className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold transition shadow-xl"
        >
          <Plus className="w-4 h-4" /> Add Technician
        </button>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="md:hidden p-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl transition shadow-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">
          A
        </div>
      </div>
    </header>
  );
}
