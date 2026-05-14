'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  LogOut,
  User,
  CalendarCheck,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Zap,
  Crown,
  Circle,
  Settings,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Logo } from '@/components/ui/Logo';
import { getAvatarUrl } from '@/lib/image-utils';

/* ───────────────────────────────────────────── */
/*  Menu Items Config                            */
/* ───────────────────────────────────────────── */

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  onClick?: () => void;
}

const mainMenuItems: MenuItem[] = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/technician/dashboard',
    description: 'Overview & stats',
    onClick: () => {
      if (typeof window !== 'undefined') {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
  },
  { 
    icon: CalendarCheck, 
    label: 'My Bookings', 
    href: '/technician/bookings',
    description: 'Manage requests',
  },
  { 
    icon: DollarSign, 
    label: 'Earnings', 
    href: '/technician/earnings',
    description: 'Revenue tracking',
  },
  { 
    icon: ShoppingCart, 
    label: 'Service Store', 
    href: '/technician/store',
    description: 'Browse services',
  },
  { 
    icon: AlertCircle, 
    label: 'Complaints', 
    href: '/technician/complaints',
    description: 'Customer feedback',
  },
];

/* ───────────────────────────────────────────── */
/*  Sidebar Component                            */
/* ───────────────────────────────────────────── */

export default function TechnicianSidebar({ 
  profile, 
  onOpenChange,
  hideMobileToggle = false
}: { 
  profile?: any, 
  onOpenChange?: (open: boolean) => void,
  hideMobileToggle?: boolean 
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [userName, setUserName] = useState('Technician');
  const [userEmail, setUserEmail] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Get user info
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || 'Technician');
        setUserEmail(user.email || '');
        
        // Real-time profile sync for avatar (Technicians are stored in the 'technicians' collection)
        const unsubProfile = onSnapshot(doc(db, 'technicians', user.uid), (docSnap: any) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.avatar) setUserAvatar(data.avatar);
            if (data.name) setUserName(data.name);
          }
        });
        return () => unsubProfile();
      }
    });
    return () => unsub();
  }, []);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    onOpenChange?.(isMobileMenuOpen);

    // Hide chatbox on mobile when sidebar is open
    const toggleChatbot = () => {
      const chatbotContainer = document.querySelector('.chatbot-container');
      if (chatbotContainer) {
        if (isMobileMenuOpen && window.innerWidth < 768) {
          (chatbotContainer as HTMLElement).style.display = 'none';
        } else {
          (chatbotContainer as HTMLElement).style.display = '';
        }
      }
    };
    
    toggleChatbot();
    
    // Clean up to ensure it reappears if unmounted
    return () => {
      const chatbotContainer = document.querySelector('.chatbot-container');
      if (chatbotContainer) {
        (chatbotContainer as HTMLElement).style.display = '';
      }
    };
  }, [isMobileMenuOpen, onOpenChange]);

  const handleLogout = async () => {
    const user = auth.currentUser;
    await signOut(auth);
    window.location.href = '/auth/login';
  };

  const effectiveCollapsed = isMobileMenuOpen ? false : collapsed;
  const sidebarWidth = effectiveCollapsed ? 'w-[78px]' : 'w-full md:w-[280px]';

  return (
    <React.Fragment>
      {/* Mobile hamburger menu button */}
      {!hideMobileToggle && (
        <div className="fixed top-4 left-4 z-[60] md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 bg-white/80 border border-black/10 rounded-2xl backdrop-blur-xl hover:bg-white shadow-xl text-slate-900 active:scale-95 transition-all duration-300 flex items-center justify-center shrink-0"
          >
            {isMobileMenuOpen ? (
              <ChevronLeft className="size-5" />
            ) : (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 h-[100dvh] z-50 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          sidebarWidth,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(50px) saturate(180%)',
        }}
      >
        {/* Ambient cinematic glows */}
        <div className="absolute top-0 left-0 w-full h-64 pointer-events-none opacity-40 z-0"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none opacity-30 z-0"
          style={{ background: 'radial-gradient(circle at 50% 100%, rgba(34, 211, 238, 0.08) 0%, transparent 70%)' }}
        />

        {/* Brand Section */}
        <div className={cn(
          "relative flex items-center border-b border-black/[0.05] transition-all duration-700 z-10",
          effectiveCollapsed ? "h-[88px] justify-center px-0" : "h-[100px] px-8"
        )}>
          {effectiveCollapsed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute -inset-4 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700" />
              <Logo iconClassName="w-12" />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-5 group"
            >
              <Logo iconClassName="w-28 filter invert-[0.1]" />
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] font-black tracking-tighter text-slate-900 uppercase leading-none italic">
                  FixNow
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-indigo-600 mt-1.5 flex items-center gap-1.5">
                  <div className="size-1 rounded-full bg-indigo-500 animate-pulse" />
                  Technician
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden md:flex absolute z-30 items-center justify-center transition-all duration-500 group",
            "w-7 h-7 rounded-full",
            "bg-white border border-black/10 hover:border-indigo-500/30",
            "hover:bg-slate-50 active:scale-90",
            "shadow-xl shadow-black/5",
            "top-[36px] -right-3.5"
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 text-slate-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronLeft className="size-3.5 text-slate-400 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Quick Status HUD */}
        <AnimatePresence>
          {!effectiveCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden z-10"
            >
              <div className="mx-5 mt-8 p-4 rounded-[1.5rem] relative overflow-hidden group cursor-default border border-black/[0.04] bg-white/40 shadow-xl backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-40"
                  style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent)' }}
                />
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shadow-lg border border-indigo-500/10">
                      <Zap className="size-4 text-indigo-600 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Synchronized</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{currentTime || '...'}</p>
                  </div>
                  <div className="shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-8 scrollbar-hide z-10",
          collapsed ? "px-3" : "px-5"
        )}>
          <div className="space-y-2">
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="relative group/nav">
                    <div className={cn(
                      "relative flex items-center rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden",
                      effectiveCollapsed ? "p-4 mx-auto w-fit" : "px-5 py-4 mx-2",
                      isActive 
                        ? "bg-white shadow-[0_10px_30px_rgba(99,102,241,0.08)] border border-black/5 scale-[1.02]" 
                        : "hover:bg-white/40 border border-transparent hover:border-black/5"
                    )}>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full shadow-[0_0_20px_2px_rgba(99,102,241,0.4)]" />
                      )}
                      <div className={cn(
                        "relative shrink-0 flex items-center justify-center transition-all duration-500 z-10",
                        effectiveCollapsed ? "size-6" : "size-5"
                      )}>
                        <item.icon className={cn("size-full transition-all duration-500", isActive ? "text-indigo-600 scale-110" : "text-slate-400 group-hover/nav:text-slate-900 group-hover/nav:scale-110")} />
                      </div>
                      {!effectiveCollapsed && (
                        <span className={cn(
                          "ml-4 text-[12px] font-black uppercase tracking-[0.15em] italic transition-all duration-500",
                          isActive ? "text-slate-900" : "text-slate-400 group-hover/nav:text-slate-900"
                        )}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Mobile Logout Option */}
            <div className="md:hidden pt-2">
               <button onClick={handleLogout} className="w-full text-left">
                  <div className="relative group/nav">
                    <div className={cn(
                      "relative flex items-center rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden",
                      effectiveCollapsed ? "p-4 mx-auto w-fit" : "px-5 py-4 mx-2",
                      "hover:bg-rose-500/[0.05] border border-transparent hover:border-rose-500/10"
                    )}>
                      <div className={cn(
                        "relative shrink-0 flex items-center justify-center transition-all duration-500 z-10",
                        effectiveCollapsed ? "size-6" : "size-5"
                      )}>
                        <LogOut className="size-full transition-all duration-500 text-rose-600/80 group-hover/nav:text-rose-600 group-hover/nav:scale-110" />
                      </div>
                      {!effectiveCollapsed && (
                        <span className="ml-4 text-[12px] font-black uppercase tracking-[0.15em] italic transition-all duration-500 text-rose-600/80 group-hover/nav:text-rose-600">
                          Sign Out
                        </span>
                      )}
                    </div>
                  </div>
               </button>
            </div>
          </div>
        </nav>

        {/* Profile Section */}
        <div className={cn(
          "border-t border-black/5 p-6 pb-10 sm:pb-8 bg-white/10 z-10",
          effectiveCollapsed ? "flex flex-col items-center gap-4" : ""
        )}>
          <AnimatePresence>
            {!effectiveCollapsed ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-[1.5rem] transition-all duration-500 flex items-center justify-between gap-4 border border-black/[0.04] bg-white/20 hover:bg-white/40 hover:border-black/10 shadow-sm"
              >
                <Link 
                  href="/technician/dashboard#profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 flex-1 min-w-0 group cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <div className="size-11 rounded-[1.125rem] bg-white border border-black/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                        {(profile?.avatar || userAvatar) ? (
                          <img src={getAvatarUrl(profile?.avatar || userAvatar)!} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Profile" />
                        ) : (
                          <User className="size-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 size-4 bg-white rounded-full flex items-center justify-center border border-black/5 shadow-sm">
                      <Settings className="size-2.5 text-indigo-600 animate-[spin_4s_linear_infinite]" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-slate-900 truncate uppercase tracking-tighter italic group-hover:text-indigo-600 transition-colors leading-tight">{userName}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate mt-0.5 opacity-60">Identity Verified</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center justify-center shrink-0 size-9 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
                  title="Purge Session"
                >
                  <LogOut className="size-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center gap-4 w-full"
              >
                  <Link 
                    href="/technician/dashboard#profile" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative size-12 rounded-2xl bg-white border border-black/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] transition-all group"
                    title="Profile Settings"
                  >
                    {(profile?.avatar || userAvatar) ? (
                      <img src={getAvatarUrl(profile?.avatar || userAvatar)!} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Profile" />
                    ) : (
                      <User className="size-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Settings className="size-5 text-indigo-600 animate-spin-slow" />
                    </div>
                  </Link>

                <button
                  onClick={handleLogout}
                  className="hidden md:flex size-12 rounded-2xl items-center justify-center text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
                  title="Purge Session"
                >
                  <LogOut className="size-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </React.Fragment>
  );
}
