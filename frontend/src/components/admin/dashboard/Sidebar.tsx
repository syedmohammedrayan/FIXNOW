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
          "glass-panel border-white/10 border-r border-slate-200 flex flex-col z-40 transition-all duration-300 ease-in-out shadow-xl shadow-slate-200/50",
          "fixed lg:relative inset-y-0 left-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] shrink-0">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          {sidebarOpen && <span className="font-black text-xl tracking-tight text-white italic">ADMIN PANEL</span>}
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

        <div className="p-4 border-t border-slate-100">
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
