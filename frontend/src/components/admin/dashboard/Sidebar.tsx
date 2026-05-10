import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LayoutDashboard, Users, ClipboardList, ShoppingCart, DollarSign, Bell, LogOut, Activity } from 'lucide-react';
import { SidebarLink } from './shared/SidebarLink';
import { cn } from '@/lib/utils';

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
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className={cn(
          "bg-slate-900/90 backdrop-blur-3xl border-r border-white/10 flex flex-col z-40 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] shadow-2xl",
          "fixed lg:relative inset-y-0 left-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl shrink-0">
            <ShieldCheck className="text-slate-900 w-7 h-7" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-white italic leading-none">FIXNOW</span>
              <span className="font-black text-[9px] uppercase tracking-[0.3em] text-slate-500 mt-1">Command Center</span>
            </div>
          )}
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarLink icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} onClick={() => handleTabClick('overview')} open={sidebarOpen} />
          <SidebarLink icon={<Activity />} label="Live Map" active={activeTab === 'live-map'} onClick={() => handleTabClick('live-map')} open={sidebarOpen} />
          <SidebarLink icon={<ShieldCheck />} label="Approvals" active={activeTab === 'approvals'} count={techsCount} onClick={() => handleTabClick('approvals')} open={sidebarOpen} />
          <SidebarLink icon={<Users />} label="Technicians" active={activeTab === 'techs'} onClick={() => handleTabClick('techs')} open={sidebarOpen} />
          <SidebarLink icon={<ClipboardList />} label="Bookings" active={activeTab === 'bookings'} onClick={() => handleTabClick('bookings')} open={sidebarOpen} />
          <SidebarLink icon={<ShoppingCart />} label="Store" active={activeTab === 'tools'} count={toolOrdersCount} onClick={() => handleTabClick('tools')} open={sidebarOpen} />
          <SidebarLink icon={<DollarSign />} label="Transactions" active={activeTab === 'transactions'} onClick={() => handleTabClick('transactions')} open={sidebarOpen} />
          <SidebarLink icon={<Bell />} label="Notifications" active={activeTab === 'notifications'} onClick={() => handleTabClick('notifications')} open={sidebarOpen} />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            {sidebarOpen && <span className="font-bold">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
