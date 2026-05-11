import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, LayoutDashboard, Users, ClipboardList,
  ShoppingCart, DollarSign, Bell, LogOut, Activity,
  ChevronLeft, ChevronRight, X
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
    { icon: <Bell />,            label: 'Notifications', tab: 'notifications' },
  ];

  // Sidebar is "expanded" on desktop when open; on mobile it's a full drawer
  const desktopWidth = sidebarOpen ? 'lg:w-[260px]' : 'lg:w-[72px]';

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar Panel ── */}
      <motion.aside
        initial={false}
        className={cn(
          // Base
          'fixed top-0 left-0 h-screen z-50 flex flex-col',
          // Background / glass
          'bg-slate-950/95 backdrop-blur-3xl border-r border-white/[0.08]',
          'shadow-[4px_0_32px_rgba(0,0,0,0.6)]',
          // Mobile: full-width drawer; Desktop: collapsible column
          'w-[280px] lg:relative lg:z-auto',
          desktopWidth,
          'transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          // Translate
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]'
        )}
      >
        {/* Top ambient glow */}
        <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
        />
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 w-full h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
        />

        {/* ── Brand Header ── */}
        <div className={cn(
          'relative flex items-center border-b border-white/[0.08] shrink-0',
          'h-[72px] px-5 lg:px-4',
          !sidebarOpen && 'lg:justify-center lg:px-0'
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <Logo iconClassName="w-8 shrink-0" />
            <AnimatePresence>
              {(sidebarOpen) && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="text-[13px] font-black tracking-tight text-white uppercase leading-none">FixNow</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mt-0.5">Admin Console</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition lg:hidden"
          >
            <X className="size-4" />
          </button>

          {/* Collapse toggle on desktop */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-slate-900 border border-white/10 hover:border-white/20 items-center justify-center shadow-lg transition active:scale-90"
          >
            {sidebarOpen
              ? <ChevronLeft className="size-3 text-white" />
              : <ChevronRight className="size-3 text-white" />
            }
          </button>
        </div>

        {/* ── Section Label ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pt-5 pb-1 shrink-0"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Main Menu</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Links — SCROLLABLE ── */}
        <nav className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-2',
          // Custom scrollbar
          'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
          sidebarOpen ? 'px-3' : 'lg:px-2 px-3'
        )}>
          <div className="space-y-1">
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
          <div className="h-4" />
        </nav>

        {/* Bottom gradient line */}
        <div className="shrink-0 h-[1px] mx-4"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />

        {/* ── Logout ── */}
        <div className={cn('shrink-0 p-3', !sidebarOpen && 'lg:flex lg:justify-center')}>
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-3 rounded-[14px] transition-all duration-200 group',
              'text-slate-500 hover:text-rose-400 hover:bg-rose-500/5',
              sidebarOpen ? 'w-full px-4 py-3' : 'lg:p-3 lg:justify-center w-full px-4 py-3'
            )}
          >
            <LogOut className="size-[18px] shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(244,63,94,0.4)] transition-all" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[13px] font-semibold tracking-wide"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
