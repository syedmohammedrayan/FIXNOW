import React from 'react';
import { Menu, RefreshCw, LayoutDashboard, Activity, ShieldCheck, Users, ClipboardList, ShoppingCart, DollarSign, Bell, LogOut, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  fetchData: () => void;
  setShowAddModal: (show: boolean) => void;
  techsCount: number;
  toolOrdersCount: number;
  handleSignOut: () => void;
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
  'complaints':     'Complaint Matrix',
};

export function Navbar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, fetchData, setShowAddModal, techsCount, toolOrdersCount, handleSignOut }: NavbarProps) {
  const navLinks = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview',      tab: 'overview' },
    { icon: <Activity className="w-5 h-5" />,        label: 'Live Map',      tab: 'live-map' },
    { icon: <ShieldCheck className="w-5 h-5" />,     label: 'Approvals',     tab: 'approvals',     count: techsCount },
    { icon: <Users className="w-5 h-5" />,           label: 'Technicians',   tab: 'techs' },
    { icon: <ClipboardList className="w-5 h-5" />,   label: 'Bookings',      tab: 'bookings' },
    { icon: <ShoppingCart className="w-5 h-5" />,    label: 'Store',         tab: 'tools',         count: toolOrdersCount },
    { icon: <DollarSign className="w-5 h-5" />,      label: 'Transactions',  tab: 'transactions' },
    { icon: <AlertTriangle className="w-5 h-5" />,   label: 'Complaints',    tab: 'complaints' },
    { icon: <Bell className="w-5 h-5" />,            label: 'Notifications', tab: 'notifications' },
  ];

  return (
    <div className="px-4 sm:px-6 pt-4 shrink-0 sticky top-0 z-30">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 h-[64px] sm:h-[72px] bg-slate-900/40 backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl relative overflow-hidden">
        {/* Cinematic subtle glow inside navbar */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* ── MOBILE: Hamburger + Title ── */}
        <div className="flex items-center gap-3 min-w-0 lg:hidden">
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
          </div>
        </div>

        {/* ── DESKTOP: Icon Navigation (Left Side) ── */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 relative z-10 overflow-x-auto scrollbar-none max-w-[70%]">
          {navLinks.map((link) => {
            const isActive = activeTab === link.tab;
            return (
              <button
                key={link.tab}
                onClick={() => setActiveTab(link.tab)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 group shrink-0 ${
                  isActive 
                    ? 'bg-white/10 text-cyan-400 shadow-[inset_0_0_12px_rgba(255,255,255,0.05)] border border-white/[0.08]' 
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent'
                }`}
              >
                {React.cloneElement(link.icon as React.ReactElement, { className: "w-4 h-4 shrink-0" })}
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {link.label}
                </span>

                {link.count !== undefined && link.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] z-10">
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right — Actions & Logo */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative z-10">
          <div className="hidden lg:flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all group relative"
            >
              <RefreshCw className="w-5 h-5" />
              <div className="absolute -bottom-10 right-0 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10 z-50">
                Refresh
              </div>
            </button>
            
            <button
              onClick={handleSignOut}
              className="p-2.5 rounded-xl text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all border border-transparent group relative"
            >
              <LogOut className="w-5 h-5" />
              <div className="absolute -bottom-10 right-0 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10 z-50">
                Logout
              </div>
            </button>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center cursor-pointer focus:outline-none hover:scale-105 transition-transform"
            title="Refresh Page"
          >
            <Logo 
              isAdmin 
              iconClassName="w-[100px] sm:w-[120px] opacity-90 hover:opacity-100 transition-opacity" 
            />
          </button>
        </div>
      </header>
    </div>
  );
}
