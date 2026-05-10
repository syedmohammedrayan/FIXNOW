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
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { Logo } from '@/components/ui/Logo';
import LanguageSelector from './LanguageSelector';

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
  const [showNotifications, setShowNotifications] = useState(false);
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
      "w-[95%] max-w-7xl border backdrop-blur-2xl shadow-2xl",
      "bg-white/10 border-white/40 shadow-white/5",
      visible 
        ? (scrolled ? "top-3 py-3 rounded-[2.5rem] opacity-100" : "top-5 py-5 rounded-[2.5rem] opacity-100") 
        : "-top-32 opacity-0 pointer-events-none"
    )}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="group">
          <Logo 
            isAdmin={profile?.role === 'admin'} 
            showText 
            isLanding={isLanding} 
            className="transition-all duration-500"
            textClassName={cn(
              "transition-colors duration-500",
              isLanding ? "text-slate-950" : "text-white"
            )}
          />
        </Link>

        {/* Navigation Options - Restored and Theme-Aware */}
        <div className="hidden lg:flex items-center gap-10">
          <NavLink href="/services" active={pathname === '/services'} isLanding={isLanding}>Services</NavLink>
          <button 
            onClick={openAboutModal}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center gap-2",
              isLanding ? "text-slate-950/70 hover:text-slate-950" : "text-slate-400 hover:text-white"
            )}
          >
            <Info className="size-3.5" />
            Protocol
          </button>
        </div>

        <div className="flex items-center gap-6">
          <LanguageSelector />

          <AnimatePresence mode="wait">
            {(user || customProfile) ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-white/10">
                   <div className="relative group/profile">
                      <button className="flex items-center gap-3 group">
                        <div className="size-11 rounded-2xl overflow-hidden border border-white/20 group-hover:border-cyan-400 transition-all duration-300 shadow-lg">
                           {profile?.avatar && profile.avatar.length > 5 ? (
                             <img src={profile.avatar} className="size-full object-cover" />
                           ) : (
                             <div className="size-full bg-slate-800 flex items-center justify-center text-lg text-white font-black">
                               {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
                             </div>
                           )}
                        </div>
                        <div className="hidden md:block text-left">
                           <p className={cn("text-[10px] font-black uppercase tracking-widest", isLanding ? "text-slate-950" : "text-white")}>
                             {profile?.name || 'Authorized'}
                           </p>
                           <p className="text-[9px] text-cyan-600 font-black uppercase tracking-wider mt-0.5">{profile?.role || 'Session'}</p>
                        </div>
                        <ChevronDown className={cn("size-4 transition", isLanding ? "text-slate-950/50" : "text-slate-400")} />
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute top-full right-0 mt-4 w-64 bg-[#0a0a14] border border-white/10 rounded-[2.5rem] shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all duration-500 z-50 overflow-hidden p-3">
                        <div className="space-y-1">
                          <Link href={`/${profile?.role}/dashboard`} className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition">
                            <LayoutDashboard className="size-4 text-cyan-400" /> Control Panel
                          </Link>
                          <Link href={`/${profile?.role}/dashboard#profile`} className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition">
                            <User className="size-4 text-cyan-400" /> Identity
                          </Link>
                          <div className="h-px bg-white/5 my-2 mx-4" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 hover:bg-rose-500/10 rounded-2xl transition">
                            <LogOut className="size-4" /> Terminate
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-8">
                <Link 
                  href="/auth/login" 
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                    isLanding ? "text-slate-950/70 hover:text-slate-950" : "text-slate-400 hover:text-white"
                  )}
                >
                  Login
                </Link>
                <Link 
                  href="/auth/signup" 
                  className={cn(
                    "px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl hover:scale-105",
                    isLanding ? "bg-slate-950 text-white shadow-slate-950/20" : "bg-white text-slate-950 shadow-white/10"
                  )}
                >
                  Register
                </Link>
              </div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className={cn(
              "lg:hidden size-12 flex items-center justify-center rounded-2xl border transition-all active:scale-90",
              isLanding ? "bg-slate-950 text-white border-slate-950" : "bg-white/5 border-white/10 text-white"
            )}
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "lg:hidden overflow-hidden mt-4 mx-4 rounded-[2.5rem] shadow-2xl border backdrop-blur-3xl",
              isLanding ? "bg-white/95 border-white/40" : "bg-slate-950/95 border-white/10"
            )}
          >
            <div className="p-10 space-y-8">
              <Link href="/services" onClick={() => setIsOpen(false)} className={cn("block text-sm font-black uppercase tracking-widest transition-colors", isLanding ? "text-slate-600 hover:text-slate-950" : "text-slate-400 hover:text-white")}>Services</Link>
              <button 
                onClick={() => { setIsOpen(false); openAboutModal(); }} 
                className={cn("block text-sm font-black uppercase tracking-widest text-left w-full transition-colors", isLanding ? "text-slate-600 hover:text-slate-950" : "text-slate-400 hover:text-white")}
              >
                About Protocol
              </button>
              
              {!user && !customProfile && (
                <div className="pt-8 flex flex-col gap-5 border-t border-slate-500/10">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className={cn("w-full py-5 text-center rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all", isLanding ? "bg-slate-950/5 text-slate-950 border-slate-950/10" : "bg-white/5 text-white border-white/10")}>Login</Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)} className={cn("w-full py-5 text-center rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all", isLanding ? "bg-slate-950 text-white" : "bg-white text-slate-950")}>Register</Link>
                </div>
              )}
              
              {(user || customProfile) && (
                <div className="pt-8 flex flex-col gap-5 border-t border-slate-500/10">
                  <Link href={`/${profile?.role}/dashboard`} onClick={() => setIsOpen(false)} className="flex items-center gap-4 w-full py-5 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                    <LayoutDashboard className="size-5" /> Control Panel
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-4 w-full py-5 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <LogOut className="size-5" /> Terminate Session
                  </button>
                </div>
              )}
              
              <div className="text-center pt-8 opacity-40">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">© {new Date().getFullYear()} FIXNOW Service Ecosystem</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowAboutModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a14] border border-white/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-3xl -mr-20 -mt-20" />
              <div className="flex justify-between items-start mb-10 relative z-10">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Protocol <br/> Identity.</h2>
                <button onClick={() => setShowAboutModal(false)} className="p-3 text-slate-500 hover:text-white transition"><X className="size-6" /></button>
              </div>
              
              {loadingAdmin ? (
                <div className="py-20 flex justify-center"><Loader2 className="size-10 text-white" /></div>
              ) : (
                <div className="space-y-8 relative z-10">
                  <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Coordinator</p>
                      <p className="text-2xl font-black text-white">{adminDetails?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Organization</p>
                      <p className="text-white font-bold uppercase tracking-tight">{adminDetails?.company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Terminal Channel</p>
                      <p className="text-cyan-400 font-bold uppercase tracking-widest">{adminDetails?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 px-4">
                    <Activity className="size-4 text-cyan-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Active Mesh Status: Optimized</p>
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

function NavLink({ href, children, active, isLanding }: { href: string, children: React.ReactNode, active: boolean, isLanding: boolean }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95",
        active 
          ? (isLanding ? "text-slate-950" : "text-white")
          : (isLanding ? "text-slate-950/60 hover:text-slate-950" : "text-slate-400 hover:text-white")
      )}
    >
      {children}
    </Link>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("border-2 border-white/10 border-t-white rounded-full animate-spin", className)} />;
}