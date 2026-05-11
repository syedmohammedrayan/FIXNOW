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
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Logo } from '@/components/ui/Logo';

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
];

/* ───────────────────────────────────────────── */
/*  Sidebar Component                            */
/* ───────────────────────────────────────────── */

export default function TechnicianSidebar({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
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
        
        // Real-time profile sync for avatar
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap: any) => {
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
      <div className="fixed top-4 left-4 z-[60] md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-slate-900 border border-white/10 rounded-2xl backdrop-blur-md hover:bg-slate-800 shadow-2xl text-white active:scale-95 transition-all duration-300 flex items-center justify-center shrink-0"
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

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 h-[100dvh] z-50 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          sidebarWidth,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)' }}
      />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-[1px] z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)' }}
      />

      {/* ─── Brand Section ─── */}
      <div className={cn(
        "relative flex items-center border-b border-white/10 transition-all duration-500",
        effectiveCollapsed ? "h-[78px] justify-center px-0" : "h-[88px] px-6"
      )}>
        {effectiveCollapsed ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-2 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            <Logo iconClassName="w-10" />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 group"
          >
            <Logo iconClassName="w-24" />
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-black tracking-tight text-white uppercase leading-none">
                FixNow
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/60 mt-0.5 flex items-center gap-1">
                <Crown className="size-2.5" />
                Pro Technician
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── Collapse Toggle ─── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "hidden md:flex absolute z-20 items-center justify-center transition-all duration-300 group",
          "w-6 h-6 rounded-full",
          "bg-slate-900 border border-white/10 hover:border-white/20",
          "hover:bg-slate-800 active:scale-90",
          "shadow-lg shadow-black/20",
          effectiveCollapsed ? "top-[31px] -right-3" : "top-[31px] -right-3"
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-3 text-white group-hover:text-white transition-colors" />
        ) : (
          <ChevronLeft className="size-3 text-white group-hover:text-white transition-colors" />
        )}
      </button>

      {/* ─── Quick Status Card ─── */}
      <AnimatePresence>
        {!effectiveCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-5 p-3.5 rounded-2xl relative overflow-hidden group cursor-default"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent)' }}
              />
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shadow-lg border border-white/10">
                    <Zap className="size-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate">Active & Ready</p>
                  <p className="text-[10px] text-white/50 font-medium">{currentTime || 'Loading...'}</p>
                </div>
                <div className="shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                    <Circle className="size-1.5 fill-emerald-400 text-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Section Label ─── */}
      <AnimatePresence>
        {!effectiveCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 mt-6 mb-2"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400/70">
              Main Menu
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Navigation ─── */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-none",
        collapsed ? "px-2.5" : "px-3.5"
      )}>
        <div className="space-y-1">
          {mainMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className="relative group/nav">
                  <div className={cn(
                    "relative flex items-center rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden",
                    effectiveCollapsed ? "p-3 mx-auto w-fit" : "px-4 py-3.5 mx-3",
                    isActive ? "bg-white/10 shadow-inner border border-white/10" : "hover:bg-white/5"
                  )}>
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full shadow-[0_0_12px_2px_rgba(255,255,255,0.2)]" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "relative shrink-0 flex items-center justify-center transition-all duration-300 z-10",
                      effectiveCollapsed ? "size-6" : "size-5"
                    )}>
                      <item.icon className={cn("size-full transition-colors duration-300", isActive ? "text-white" : "text-white/50 group-hover/nav:text-white/80")} />
                    </div>

                    {/* Label */}
                    {!effectiveCollapsed && (
                      <span className={cn(
                        "ml-3.5 text-[13px] font-semibold tracking-wide transition-colors duration-300",
                        isActive ? "text-white" : "text-white/50 group-hover/nav:text-white/80"
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
          <div className="md:hidden pt-4 mt-4 border-t border-white/10">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center w-full px-4 py-3.5 mx-3 rounded-2xl hover:bg-rose-500/10 text-white/50 hover:text-rose-400 transition-all duration-300 group/logout"
            >
              <div className="size-5 shrink-0 flex items-center justify-center">
                <LogOut className="size-full group-hover/logout:text-rose-400" />
              </div>
              <span className="ml-3.5 text-[13px] font-semibold tracking-wide">
                Logout
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Bottom Section ─── */}
      <div className={cn(
        "border-t border-white/10 p-4 pb-8 sm:pb-4 bg-slate-900/50",
        effectiveCollapsed ? "flex flex-col items-center gap-3" : ""
      )}>
        <AnimatePresence>
          {!effectiveCollapsed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 rounded-2xl transition-all duration-300 flex items-center justify-between gap-2"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Link 
                href="/technician/dashboard#profile" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    {userAvatar ? (
                      <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <User className="size-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-3.5 bg-slate-900 rounded-full flex items-center justify-center">
                    <Settings className="size-2.5 text-cyan-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">{userName}</p>
                  <p className="text-[10px] text-white/40 truncate">{userEmail || 'technician@fixnow.app'}</p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden md:flex shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all active:scale-95"
                title="Logout"
              >
                <LogOut className="size-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center gap-3 w-full"
            >
              <Link 
                href="/technician/dashboard#profile" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all group"
                title="Profile Settings"
              >
                {userAvatar ? (
                  <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User className="size-5 text-white/40 group-hover:text-cyan-400 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <Settings className="size-4 text-white" />
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden md:flex w-10 h-10 rounded-xl items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all active:scale-95"
                title="Logout"
              >
                <LogOut className="size-[18px]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
      />
    </motion.aside>
    </React.Fragment>
  );
}
