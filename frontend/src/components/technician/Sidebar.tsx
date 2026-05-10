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
  Sparkles,
  Zap,
  TrendingUp,
  Crown,
  ArrowUpRight,
  Circle
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

export default function TechnicianSidebar() {
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

  const handleLogout = async () => {
    const user = auth.currentUser;
    // Removed automatic offline on logout.
    // Technician remains online until explicitly toggled off.
    await signOut(auth);
    window.location.href = '/auth/login';
  };

  const sidebarWidth = collapsed ? 'w-[78px]' : 'w-[280px]';

  return (
    <React.Fragment>
      {/* Mobile hamburger menu button */}
      <div className="fixed top-4 left-4 z-[60] md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white/80 border border-indigo-100 rounded-2xl backdrop-blur-md hover:bg-indigo-50 shadow-lg text-indigo-600 active:scale-95 transition-all duration-300 flex items-center justify-center shrink-0"
        >
          {isMobileMenuOpen ? (
            <ChevronLeft className="size-5 text-indigo-600" />
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
        layout
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          sidebarWidth,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.7) 50%, rgba(255, 255, 255, 0.6) 100%)',
          borderRight: '1px solid rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-70"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.25) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.2) 0%, transparent 70%)' }}
      />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-[2px] z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(139,92,246,0.6), transparent)' }}
      />

      {/* ─── Brand Section ─── */}
      <div className={cn(
        "relative flex items-center border-b border-slate-200/50 transition-all duration-500",
        collapsed ? "h-[78px] justify-center px-0" : "h-[88px] px-6"
      )}>
        {collapsed ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-2 rounded-2xl bg-indigo-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            <Logo showText={false} />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 group"
          >
            <Logo showText={false} />
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-black tracking-tight text-slate-800 uppercase leading-none">
                FixNow
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-indigo-600/80 mt-0.5 flex items-center gap-1">
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
          "absolute z-20 flex items-center justify-center transition-all duration-300 group",
          "w-6 h-6 rounded-full",
          "bg-white border border-indigo-200 hover:border-indigo-400",
          "hover:bg-indigo-50 active:scale-90",
          "shadow-lg shadow-indigo-500/10",
          collapsed ? "top-[31px] -right-3" : "top-[31px] -right-3"
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-3 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
        ) : (
          <ChevronLeft className="size-3 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
        )}
      </button>

      {/* ─── Quick Status Card ─── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-5 p-3.5 rounded-2xl relative overflow-hidden group cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.5) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                boxShadow: '0 4px 20px -2px rgba(99,102,241,0.05)',
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent)' }}
              />
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Zap className="size-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 truncate">Active & Ready</p>
                  <p className="text-[10px] text-indigo-600/70 font-medium">{currentTime || 'Loading...'}</p>
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
        {!collapsed && (
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
            const isHovered = hoveredItem === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-[14px] transition-all duration-300 group",
                  collapsed ? "justify-center p-3 mx-auto" : "px-4 py-3",
                  isActive
                    ? "text-indigo-900"
                    : "text-slate-500 hover:text-indigo-600"
                )}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="techSidebarActive"
                    className="absolute inset-0 rounded-[14px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      boxShadow: '0 4px 15px -3px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Hover background */}
                {!isActive && isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-[14px]"
                    style={{
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(99,102,241,0.1)',
                    }}
                  />
                )}

                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="techSidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{
                      background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                      boxShadow: '0 0 12px 2px rgba(99,102,241,0.3)',
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center shrink-0 transition-all duration-300",
                  collapsed ? "w-9 h-9" : "w-8 h-8",
                  isActive 
                    ? "" 
                    : "group-hover:scale-105"
                )}>
                  <item.icon className={cn(
                    "transition-all duration-300",
                    collapsed ? "size-[18px]" : "size-[17px]",
                    isActive
                      ? "text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                      : "text-slate-400 group-hover:text-indigo-500"
                  )} />
                  
                  {/* Icon glow for active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-indigo-500/20 blur-md animate-pulse" />
                  )}
                </div>

                {/* Label + Description */}
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10 flex flex-col min-w-0 flex-1"
                  >
                    <span className={cn(
                      "text-[13px] font-semibold tracking-wide transition-colors duration-300 truncate",
                      isActive ? "text-indigo-900" : "text-slate-600 group-hover:text-indigo-700"
                    )}>
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium transition-colors duration-300 truncate mt-0.5",
                      isActive ? "text-indigo-600/70" : "text-slate-400 group-hover:text-slate-500"
                    )}>
                      {item.description}
                    </span>
                  </motion.div>
                )}

                {/* Active arrow indicator */}
                {!collapsed && isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                  >
                    <ArrowUpRight className="size-3.5 text-indigo-600/50" />
                  </motion.div>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && isHovered && (
                  <div className="absolute left-full ml-3 z-[100] pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, x: -5, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="px-3 py-2 rounded-xl whitespace-nowrap"
                      style={{
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                      <p className="text-[9px] text-indigo-500/70 mt-0.5">{item.description}</p>
                    </motion.div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* ─── Separator ─── */}
        <div className={cn("my-5", collapsed ? "mx-2" : "mx-3")}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }} />
        </div>

        {/* ─── Quick Actions Section ─── */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2.5 mb-2"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400/70">
                Quick Actions
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Link */}
        <Link
          href="/technician/dashboard#profile"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '#profile';
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }
          }}
          onMouseEnter={() => setHoveredItem('profile')}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "relative flex items-center gap-3.5 rounded-[14px] transition-all duration-300 group",
            collapsed ? "justify-center p-3 mx-auto" : "px-4 py-3",
            "text-slate-500 hover:text-indigo-600"
          )}
        >
          {hoveredItem === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-[14px]"
              style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(99,102,241,0.1)',
              }}
            />
          )}

          <div className="relative z-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <User className={cn(
              "transition-all duration-300",
              collapsed ? "size-[18px]" : "size-[17px]",
              "text-slate-400 group-hover:text-indigo-500"
            )} />
          </div>

          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex-1 min-w-0">
              <span className="text-[13px] font-semibold tracking-wide text-slate-600 group-hover:text-indigo-700 transition-colors truncate block">
                System Profile
              </span>
              <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors truncate block mt-0.5">
                Account settings
              </span>
            </motion.div>
          )}

          {/* Tooltip for collapsed */}
          {collapsed && hoveredItem === 'profile' && (
            <div className="absolute left-full ml-3 z-[100] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -5, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="px-3 py-2 rounded-xl whitespace-nowrap"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <p className="text-xs font-semibold text-slate-800">System Profile</p>
                <p className="text-[9px] text-indigo-500/70 mt-0.5">Account settings</p>
              </motion.div>
            </div>
          )}
        </Link>
      </nav>

      {/* ─── User Profile Card ─── */}
      <div className={cn(
        "border-t border-slate-200/50 transition-all duration-500",
        collapsed ? "p-2.5" : "p-4"
      )}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-3 rounded-2xl transition-all duration-300 group cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.4) 100%)',
                border: '1px solid rgba(99,102,241,0.15)',
                boxShadow: '0 4px 15px -3px rgba(99,102,241,0.05)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center overflow-hidden">
                    {userAvatar ? (
                      <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <User className="size-4 text-indigo-600/70" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userEmail || 'technician@fixnow.app'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "relative w-full flex items-center gap-3 rounded-[14px] transition-all duration-300 group",
            collapsed ? "justify-center p-3" : "px-4 py-3",
            "text-slate-500/70 hover:text-rose-400"
          )}
        >
          {hoveredItem === 'logout' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-[14px]"
              style={{
                background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.15)',
              }}
            />
          )}

          <div className="relative z-10 shrink-0 group-hover:scale-105 transition-transform duration-300">
            <LogOut className={cn(
              "transition-all duration-300",
              collapsed ? "size-[18px]" : "size-[17px]",
              "group-hover:text-rose-400 group-hover:drop-shadow-[0_0_6px_rgba(244,63,94,0.3)]"
            )} />
          </div>

          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 text-[13px] font-semibold tracking-wide group-hover:text-rose-400 transition-colors"
            >
              Logout
            </motion.span>
          )}

          {/* Tooltip for collapsed */}
          {collapsed && hoveredItem === 'logout' && (
            <div className="absolute left-full ml-3 z-[100] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -5, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="px-3 py-2 rounded-xl whitespace-nowrap"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <p className="text-xs font-semibold text-rose-400">Logout</p>
              </motion.div>
            </div>
          )}
        </button>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }}
      />
    </motion.aside>
    </React.Fragment>
  );
}
