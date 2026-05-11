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
  ArrowRight
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
    await signOut(auth);
    window.location.href = '/';
  };

  const openAboutModal = async () => {
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
    <nav className={cn(
      "fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ease-out",
      "w-[94%] sm:w-[90%] max-w-7xl border backdrop-blur-3xl shadow-2xl overflow-hidden",
      scrolled 
        ? "bg-slate-950/40 border-white/[0.08] top-3 py-2.5 sm:py-3 rounded-[1.5rem] sm:rounded-[2.5rem]" 
        : "bg-white/[0.04] border-white/[0.08] top-5 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2.5rem]",
      !visible && "-top-32 opacity-0 pointer-events-none"
    )} style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.3)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-10 flex items-center justify-between relative z-10">
        <Link href="/" className="group flex-shrink-0">
          <Logo 
            isAdmin={profile?.role === 'admin'} 
            showText 
            isLanding={false} // Always dark mode style for navbar components
            className="transition-all duration-500 scale-90 sm:scale-100 origin-left"
            textClassName="text-white"
          />
        </Link>

        {/* Desktop Navigation Options */}
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

                      {/* Desktop Dropdown Menu */}
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

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden size-11 sm:size-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white transition-all active:scale-90"
          >
            {isOpen ? <X className="size-5 sm:size-6" /> : <Menu className="size-5 sm:size-6" />}
          </button>
        </div>
      </div>

      {/* Professional Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-white/[0.08] bg-slate-950/20 backdrop-blur-3xl"
          >
            <div className="px-6 py-10 space-y-8">
              <div className="grid grid-cols-1 gap-4">
                <MobileNavItem href="/services" icon={<Sparkles className="size-5"/>} onClick={() => setIsOpen(false)}>Services</MobileNavItem>
                <button 
                  onClick={() => { setIsOpen(false); openAboutModal(); }} 
                  className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-white/70 hover:text-white transition-all group"
                >
                  <Info className="size-5 text-cyan-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Protocol Intel</span>
                  <ArrowRight className="size-4 ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
              
              {!user && !customProfile && (
                <div className="flex flex-col gap-4 pt-6 border-t border-white/[0.05]">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Authentication</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/auth/login" onClick={() => setIsOpen(false)} className="py-5 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/[0.03] text-white border border-white/[0.06] transition-all active:scale-95">Access</Link>
                    <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="py-5 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white text-slate-950 shadow-2xl transition-all active:scale-95">Join</Link>
                  </div>
                </div>
              )}
              
              {(user || customProfile) && (
                <div className="flex flex-col gap-4 pt-6 border-t border-white/[0.05]">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Session Control</p>
                  <Link href={`/${profile?.role}/dashboard`} onClick={() => setIsOpen(false)} className="flex items-center gap-4 w-full p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 active:scale-95 transition-all">
                    <LayoutDashboard className="size-5" /> Control Hub
                  </Link>
                  <Link href={`/customer/account`} onClick={() => setIsOpen(false)} className="flex items-center gap-4 w-full p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/[0.03] text-white/80 border border-white/[0.06] active:scale-95 transition-all">
                    <User className="size-5" /> Identity
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-4 w-full p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 active:scale-95 transition-all mt-2">
                    <LogOut className="size-5" /> Terminate Session
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="sm:hidden">
                   <LanguageSelector />
                </div>
              </div>

              <div className="text-center pt-4 opacity-20">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">FIXNOW Service Ecosystem • v2.0</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
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
    </nav>
  );
}

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

function MobileNavItem({ href, icon, children, onClick }: { href: string, icon: React.ReactNode, children: React.ReactNode, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-white/70 hover:text-white transition-all group"
    >
      <span className="text-cyan-500">{icon}</span>
      <span className="text-xs font-black uppercase tracking-widest">{children}</span>
      <ArrowRight className="size-4 ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("border-2 border-white/10 border-t-white rounded-full animate-spin", className)} />;
}