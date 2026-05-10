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
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-200 px-4 sm:px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 hover:bg-slate-200 rounded-lg text-indigo-300 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-white capitalize">{activeTab}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={fetchData}
          className="p-2 sm:p-2.5 glass-panel border-white/10 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm hover:shadow-md"
          title="Refresh Data"
        >
          <Activity className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Technician
        </button>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="md:hidden p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full glass-panel border border-slate-200 flex items-center justify-center text-indigo-600 font-bold">
          A
        </div>
      </div>
    </header>
  );
}
