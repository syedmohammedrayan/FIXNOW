import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, LayoutDashboard, Users, ClipboardList,
  ShoppingCart, DollarSign, Bell, LogOut, Activity,
  ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { SidebarLink } from './shared/SidebarLink';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  techsCount: number;
  toolOrdersCount: number;
  handleSignOut: () => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  techsCount,
  toolOrdersCount,
  handleSignOut
}: SidebarProps) {
  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const navLinks = [
    { icon: <LayoutDashboard />, label: 'Overview',      tab: 'overview' },
    { icon: <Activity />,        label: 'Live Map',      tab: 'live-map' },
    { icon: <ShieldCheck />,     label: 'Approvals',     tab: 'approvals',     count: techsCount },
    { icon: <Users />,           label: 'Technicians',   tab: 'techs' },
    { icon: <ClipboardList />,   label: 'Bookings',      tab: 'bookings' },
    { icon: <ShoppingCart />,    label: 'Store',         tab: 'tools',         count: toolOrdersCount },
    { icon: <DollarSign />,      label: 'Transactions',  tab: 'transactions' },
    { icon: <Activity />,        label: 'Revenue Intel', tab: 'revenue' },
    { icon: <AlertTriangle />,   label: 'Refunds',       tab: 'refunds' },
    { icon: <AlertTriangle />,   label: 'Complaints',    tab: 'complaints' },
    { icon: <Bell />,            label: 'Notifications', tab: 'notifications' },
  ];

  // Sidebar is now a mobile-only right drawer
  const desktopWidth = 'lg:hidden';

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar Panel ── */}
      <motion.aside
        initial={false}
        className={cn(
          // Base
          'fixed top-0 right-0 h-screen z-50 flex flex-col',
          // Background / glass - Midnight Glass Theme
          'bg-slate-950/80 backdrop-blur-[40px] border-l border-white/[0.08]',
          'shadow-[-10px_0_50px_rgba(0,0,0,0.5),inset_1px_0_0_rgba(255,255,255,0.05)]',
          // Mobile: full-width drawer; Desktop: hidden
          'w-[280px]',
          desktopWidth,
          'transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]',
          // Translate
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Dynamic mesh glow effects */}
        <div className="absolute top-0 left-0 w-full h-80 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute -top-40 -left-20 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full" />
          <div className="absolute top-20 -right-20 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full" />
        </div>

        {/* ── Brand Header ── */}
        <div className={cn(
          'relative flex items-center border-b border-white/[0.06] shrink-0',
          'h-[72px] px-5 lg:px-4',
          !sidebarOpen && 'lg:justify-center lg:px-0'
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <Logo iconClassName="w-9 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" isAdmin={true} />
            <AnimatePresence mode="wait">
              {(sidebarOpen) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col min-w-0"
                >
                  <span className="text-[14px] font-black tracking-tight text-white uppercase leading-none italic">FixNow</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-400/70 mt-1">Command Matrix</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto size-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white transition-all active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Section Label ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 pt-7 pb-2 shrink-0"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">System Navigation</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Links — SCROLLABLE ── */}
        <nav className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-3',
          // Custom scrollbar
          'scrollbar-none',
          sidebarOpen ? 'px-4' : 'lg:px-2 px-4'
        )}>
          <div className="space-y-1.5">
            {navLinks.map(link => (
              <SidebarLink
                key={link.tab}
                icon={link.icon}
                label={link.label}
                active={activeTab === link.tab}
                count={link.count}
                onClick={() => handleTabClick(link.tab)}
                open={sidebarOpen}
              />
            ))}
          </div>

          {/* Scroll padding */}
          <div className="h-6" />
        </nav>

        {/* ── Bottom Section ── */}
        <div className="shrink-0 p-4 border-t border-white/[0.06] bg-black/10">
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-4 rounded-2xl transition-all duration-300 group',
              'bg-rose-500/5 border border-rose-500/10 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20',
              'w-full px-5 py-3.5'
            )}
          >
            <LogOut className="size-[18px] shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="text-[11px] font-black uppercase tracking-widest"
                >
                  Terminate Session
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          {sidebarOpen && (
             <p className="text-center text-[7px] font-black text-white/10 uppercase tracking-[0.5em] mt-6 select-none">
                Protocol v2.4.0 • Secured
             </p>
          )}
        </div>
      </motion.aside>
    </>
  );
}
