'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Shield, 
  ChevronDown,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  MapPin,
  Sparkles,
  Activity,
  Info,
  Globe,
  ArrowRight,
  Zap,
  Home,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { Logo } from '@/components/ui/Logo';
import LanguageSelector from './LanguageSelector';
import { getAvatarUrl } from '@/lib/image-utils';

export default function Navbar({ customProfile }: { customProfile?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const profile = customProfile || dbProfile;
  const [scrolled, setScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [adminDetails, setAdminDetails] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const pathname = usePathname();

  const isLanding = pathname === '/';

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setScrolled(currentScrollPos > 20);
      setPrevScrollPos(currentScrollPos);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const roles = ['customers', 'technicians', 'admins'];
        for (const role of roles) {
          try {
            const docRef = doc(db, role, currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setDbProfile({ ...docSnap.data(), role: role.slice(0, -1) });
              break;
            }
          } catch (error) { /* ignore */ }
        }
      } else {
        setDbProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut(auth);
    window.location.href = '/';
  };

  const openAboutModal = async () => {
    setIsOpen(false);
    setShowAboutModal(true);
    if (!adminDetails) {
      setLoadingAdmin(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setAdminDetails(querySnapshot.docs[0].data());
        } else {
          setAdminDetails({
            name: 'System Admin',
            company: 'FIXNOW Technologies',
            address: 'Service Mesh Operations Center',
            email: 'admin@fixnow.app'
          });
        }
      } catch (error) {
        setAdminDetails({ name: 'System Admin', company: 'FIXNOW Technologies', email: 'support@fixnow.app' });
      } finally {
        setLoadingAdmin(false);
      }
    }
  };

  return (
    <>
      {/* ── Pill Navbar (unchanged shape/theme) ── */}
      <nav className={cn(
        "fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ease-out",
        "w-[94%] sm:w-[90%] max-w-7xl border backdrop-blur-3xl shadow-2xl",
        scrolled 
          ? "bg-slate-950/40 border-white/[0.08] top-3 py-2 sm:py-2.5 rounded-[1.5rem] sm:rounded-[2.5rem]" 
          : "bg-white/[0.04] border-white/[0.08] top-5 py-3 sm:py-3.5 rounded-[1.5rem] sm:rounded-[2.5rem]",
        !visible && "-top-32 opacity-0 pointer-events-none"
      )} style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.3)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-10 flex items-center justify-between relative z-10">
          <Link href="/" className="group flex-shrink-0 relative h-12 sm:h-16 w-32 sm:w-48 flex items-center">
            <Logo 
              isAdmin={profile?.role === 'admin'} 
              showText 
              isLanding={false}
              className="absolute left-0 transition-all duration-500 scale-100 sm:scale-110 origin-left"
              textClassName="text-white"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            <NavLink href="/services" active={pathname === '/services'}>Services</NavLink>
            <button 
              onClick={openAboutModal}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-2"
            >
              <Info className="size-3.5" />
              Protocol
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            <AnimatePresence mode="wait">
              {(user || customProfile) ? (
                <div className="flex items-center">
                  <div className="hidden lg:flex items-center pl-6 border-l border-white/[0.08] ml-4">
                     <div className="relative group/profile">
                        <button className="flex items-center gap-3 group">
                          <div className="size-10 sm:size-11 rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.1] group-hover:border-cyan-500/50 transition-all duration-500 shadow-xl">
                             {profile?.avatar && profile.avatar.length > 5 ? (
                               <img src={getAvatarUrl(profile.avatar)!} className="size-full object-cover" />
                             ) : (
                               <div className="size-full bg-slate-900 flex items-center justify-center text-lg text-white font-black italic">
                                 {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
                               </div>
                             )}
                          </div>
                          <div className="hidden xl:block text-left">
                             <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">
                               {profile?.name || 'Authorized'}
                             </p>
                             <p className="text-[9px] text-cyan-500 font-black uppercase tracking-wider mt-0.5 opacity-60">{profile?.role || 'Session'}</p>
                          </div>
                          <ChevronDown className="size-3.5 text-white/40 group-hover:text-white transition duration-500" />
                        </button>

                        {/* Desktop Dropdown */}
                        <div className="absolute top-full right-0 mt-4 w-60 bg-slate-950/95 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all duration-500 z-50 overflow-hidden p-2.5">
                          <div className="space-y-1">
                            <Link href={`/${profile?.role}/dashboard`} className="flex items-center gap-3.5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-300">
                              <LayoutDashboard className="size-4 text-cyan-500" /> Control Hub
                            </Link>
                            <Link href={`/customer/account`} className="flex items-center gap-3.5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-300">
                              <User className="size-4 text-cyan-500" /> My Identity
                            </Link>
                            <div className="h-px bg-white/[0.05] my-2 mx-3" />
                            <button onClick={handleLogout} className="w-full flex items-center gap-3.5 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-300">
                              <LogOut className="size-4" /> Terminate
                            </button>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-6">
                  <Link 
                    href="/auth/login" 
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all"
                  >
                    Access
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="px-8 py-3.5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl hover:scale-105"
                  >
                    Join Protocol
                  </Link>
                </div>
              )}
            </AnimatePresence>

            {/* Hamburger — mobile only */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="lg:hidden size-10 sm:size-11 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white transition-all active:scale-90"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Full-Screen Side Drawer (outside nav so it's not clipped) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel — slides from right */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden fixed top-0 right-0 h-full w-[85vw] max-w-sm z-[120] flex flex-col backdrop-blur-[40px]"
              style={{
                background: 'linear-gradient(170deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.92) 100%)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.4), inset 1px 0 0 rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* ── Drawer Header ── */}
              <div className="flex items-center justify-between px-6 pt-14 pb-6 border-b border-white/[0.06]">
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <Logo 
                    isAdmin={profile?.role === 'admin'} 
                    showText 
                    isLanding={false}
                    className="scale-90 origin-left"
                    textClassName="text-white"
                  />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="size-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white transition-all active:scale-90"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* ── User Profile Card (when logged in) ── */}
              {(user || customProfile) && (
                <div className="mx-5 mt-5 p-4 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center gap-4 shadow-lg backdrop-blur-md">
                  <div className="size-12 rounded-2xl overflow-hidden border border-white/[0.12] flex-shrink-0 shadow-xl">
                    {profile?.avatar && profile.avatar.length > 5 ? (
                      <img src={getAvatarUrl(profile.avatar)!} className="size-full object-cover" />
                    ) : (
                      <div className="size-full bg-slate-800 flex items-center justify-center text-xl text-white font-black italic">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{profile?.name || 'Authorized'}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/70 mt-0.5">{profile?.role || 'Session'}</p>
                  </div>
                  <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
              )}

              {/* ── Scrollable Content ── */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

                {/* Navigation Section */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25 px-1 mb-3">Navigate</p>
                  <div className="space-y-2">
                    <DrawerNavItem
                      href="/"
                      icon={<Home className="size-4" />}
                      active={pathname === '/'}
                      onClick={() => setIsOpen(false)}
                    >
                      Home
                    </DrawerNavItem>
                    <DrawerNavItem
                      href="/services"
                      icon={<Sparkles className="size-4" />}
                      active={pathname === '/services'}
                      onClick={() => setIsOpen(false)}
                    >
                      Services
                    </DrawerNavItem>
                    <DrawerNavItem
                      href="#"
                      icon={<Info className="size-4" />}
                      active={false}
                      onClick={() => { openAboutModal(); }}
                    >
                      Protocol Intel
                    </DrawerNavItem>
                  </div>
                </div>

                {/* Session Controls — logged in */}
                {(user || customProfile) && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25 px-1 mb-3">My Account</p>
                    <div className="space-y-2">
                      <DrawerNavItem
                        href={`/${profile?.role}/dashboard`}
                        icon={<LayoutDashboard className="size-4" />}
                        active={false}
                        accent="cyan"
                        onClick={() => setIsOpen(false)}
                      >
                        Control Hub
                      </DrawerNavItem>
                      <DrawerNavItem
                        href="/customer/account"
                        icon={<User className="size-4" />}
                        active={false}
                        onClick={() => setIsOpen(false)}
                      >
                        My Identity
                      </DrawerNavItem>
                    </div>
                  </div>
                )}

                {/* Language */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25 px-1 mb-3">Language</p>
                  <div className="px-1">
                    <LanguageSelector inline />
                  </div>
                </div>
              </div>

              {/* ── Drawer Footer ── */}
              <div className="px-5 pb-10 pt-4 border-t border-white/[0.06] space-y-3">
                {/* Unauthenticated CTA */}
                {!user && !customProfile && (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center py-3.5 rounded-2xl bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                    >
                      Join Now
                    </Link>
                  </div>
                )}

                {/* Logout button */}
                {(user || customProfile) && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <LogOut className="size-4" />
                    Terminate Session
                  </button>
                )}

                <p className="text-center text-[8px] font-black text-white/15 uppercase tracking-[0.4em] pt-1">
                  FIXNOW Service Ecosystem • v2.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── About Modal ── */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowAboutModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-950/40 backdrop-blur-3xl border border-white/[0.1] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="flex justify-between items-start mb-8 sm:mb-10 relative z-10">
                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">Protocol <br/> Intel.</h2>
                <button onClick={() => setShowAboutModal(false)} className="p-3 text-white/20 hover:text-white transition"><X className="size-6" /></button>
              </div>
              
              {loadingAdmin ? (
                <div className="py-20 flex justify-center"><Loader2 className="size-10 text-white" /></div>
              ) : (
                <div className="space-y-6 sm:space-y-8 relative z-10">
                  <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Lead Coordinator</p>
                      <p className="text-xl sm:text-2xl font-black text-white italic">{adminDetails?.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Organization</p>
                      <p className="text-white font-bold uppercase tracking-tight text-sm sm:text-base">{adminDetails?.company}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Secure Channel</p>
                      <p className="text-cyan-500 font-bold uppercase tracking-widest text-xs sm:text-sm">{adminDetails?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/40 px-4">
                    <Activity className="size-4 text-cyan-500" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">Active Mesh Status: Optimized</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Desktop NavLink ──
function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 relative group",
        active ? "text-white" : "text-slate-400 hover:text-white"
      )}
    >
      {children}
      <span className={cn(
        "absolute -bottom-2 left-0 h-0.5 bg-cyan-500 transition-all duration-500",
        active ? "w-full" : "w-0 group-hover:w-1/2"
      )} />
    </Link>
  );
}

// ── Drawer Nav Row ──
function DrawerNavItem({ 
  href, icon, children, active, accent, onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  active: boolean;
  accent?: 'cyan';
  onClick: () => void; 
}) {
  const accentStyles = accent === 'cyan'
    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
    : active
      ? 'bg-white/[0.12] border-white/[0.2] text-white shadow-[0_4px_15px_rgba(255,255,255,0.05)]'
      : 'bg-white/[0.05] border-white/[0.1] text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15]';

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] group',
        accentStyles
      )}
    >
      <span className={cn('flex-shrink-0', accent === 'cyan' ? 'text-cyan-400' : active ? 'text-white' : 'text-cyan-500')}>
        {icon}
      </span>
      <span className="text-[11px] font-black uppercase tracking-widest flex-1">{children}</span>
      <ChevronRight className="size-3.5 opacity-20 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("border-2 border-white/10 border-t-white rounded-full animate-spin", className)} />;
}