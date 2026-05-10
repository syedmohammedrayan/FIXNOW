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
  Activity
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

  useEffect(() => {
    if (isLanding && user) {
      handleLogout();
    }
  }, [isLanding, user]);

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
        const q = query(usersRef, where('role', '==', 'admin'), limit(5));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setAdminDetails(querySnapshot.docs[0].data());
        } else {
          setAdminDetails({
            name: 'System Admin',
            company: 'FIXNOW Technologies',
            address: '123 Tech Park, Silicon Valley, CA 94025',
            phone: '+1 (800) 555-0199',
            email: 'admin@fixnow.app'
          });
        }
      } catch (error) {
        setAdminDetails({ name: 'System Admin', company: 'FIXNOW Technologies', address: 'Service Unavailable', phone: 'N/A', email: 'support@fixnow.app' });
      } finally {
        setLoadingAdmin(false);
      }
    }
  };

  return (
    <nav className={cn(
      "fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-500",
      "w-[92%] max-w-7xl backdrop-blur-3xl border shadow-2xl",
      isLanding 
        ? "bg-white/40 border-white/60" 
        : "bg-slate-900/90 border-white/10",
      visible ? (scrolled ? "top-4 py-3 rounded-[2.5rem] opacity-100" : "top-6 py-4 rounded-[2.5rem] opacity-100") : "-top-32 opacity-0 pointer-events-none"
    )}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="group">
          <Logo 
            isAdmin={profile?.role === 'admin'} 
            showText 
            isLanding={isLanding} 
            className="transition-all duration-500"
            textClassName={cn("transition-colors", isLanding ? "text-slate-950 group-hover:text-cyan-600" : "text-white group-hover:text-cyan-400")}
          />
        </Link>

        {!isLanding && (
          <div className="hidden lg:flex items-center gap-10">
            <NavLink href="/services" active={pathname === '/services'} isLanding={isLanding}>Services</NavLink>
            <button 
              onClick={openAboutModal}
              className="text-[10px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 text-slate-400 hover:text-white"
            >
              Protocol
            </button>
          </div>
        )}

        <div className="flex items-center gap-6">
          <LanguageSelector />

          <AnimatePresence mode="wait">
            {(user || customProfile) ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-white/10">
                   <div className="relative group/profile">
                      <button className="flex items-center gap-3 group">
                        <div className="size-10 rounded-2xl overflow-hidden border border-white/20 group-hover:border-cyan-400 transition shadow-sm bg-white/5 flex items-center justify-center text-white font-black">
                           {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div className="hidden md:block text-left">
                           <p className={cn("text-[10px] font-black uppercase tracking-widest", isLanding ? "text-slate-950" : "text-white")}>{profile?.name || 'Authorized'}</p>
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{profile?.role || 'Session'}</p>
                        </div>
                        <ChevronDown className={cn("size-4 transition", isLanding ? "text-slate-900 group-hover:text-cyan-600" : "text-slate-400 group-hover:text-white")} />
                      </button>

                      <div className="absolute top-full right-0 mt-4 w-64 bg-[#0d0d1b] border border-white/20 rounded-[2.5rem] shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all duration-500 z-50 overflow-hidden p-3">
                        <div className="space-y-1">
                          <Link href={`/${profile?.role}/dashboard`} className="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl transition">
                            <LayoutDashboard className="size-4 text-cyan-400" /> Control Panel
                          </Link>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/20 rounded-2xl transition">
                            <LogOut className="size-4 text-rose-400" /> Terminate
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              !isLanding && (
                <div className="hidden lg:flex items-center gap-5">
                  <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 hover:text-white transition-all">
                    Login
                  </Link>
                  <Link href="/auth/signup" className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 shadow-xl bg-white text-slate-900 hover:bg-slate-100">
                    Register
                  </Link>
                </div>
              )
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className={cn(
              "lg:hidden size-11 flex items-center justify-center rounded-2xl border transition-all active:scale-90",
              isLanding ? "bg-slate-950 text-white border-slate-950" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "lg:hidden overflow-hidden mt-4 mx-4 mb-4 rounded-[2.5rem] shadow-2xl border",
              isLanding ? "bg-white/80 border-white/60" : "bg-slate-900/95 border-white/10"
            )}
          >
            <div className="p-10 space-y-8">
              {!isLanding && (
                <>
                  <Link href="/services" className="block text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Services</Link>
                </>
              )}
              {!user && !customProfile && !isLanding && (
                <div className="flex flex-col gap-4">
                  <Link href="/auth/login" className="w-full py-4 text-center rounded-2xl font-black text-[11px] uppercase tracking-widest bg-white/10 text-white border border-white/10">Login</Link>
                  <Link href="/auth/signup" className="w-full py-4 text-center rounded-2xl font-black text-[11px] uppercase tracking-widest bg-white text-slate-950 shadow-xl shadow-white/10">Register</Link>
                </div>
              )}
              {(user || customProfile) && (
                <div className="flex flex-col gap-4">
                  <Link href={`/${profile?.role}/dashboard`} className="flex items-center gap-3 w-full py-4 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-white/10 text-white border border-white/10">
                    <LayoutDashboard className="size-4 text-cyan-400" /> Control Panel
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <LogOut className="size-4" /> Terminate
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowAboutModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">System Identity</h2>
                <button onClick={() => setShowAboutModal(false)} className="p-3 text-slate-400 hover:text-white"><X className="size-6" /></button>
              </div>
              {loadingAdmin ? <Loader2 className="animate-spin size-8 text-white mx-auto" /> : (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Liaison</p>
                      <p className="text-xl font-black text-white">{adminDetails?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Organization</p>
                      <p className="text-white font-bold">{adminDetails?.company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Channel</p>
                      <p className="text-cyan-400 font-bold">{adminDetails?.email}</p>
                    </div>
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
        "text-[10px] font-black uppercase tracking-[0.25em] transition-all active:scale-95",
        active 
          ? (isLanding ? "text-slate-950" : "text-white")
          : (isLanding ? "text-slate-500 hover:text-slate-950" : "text-slate-400 hover:text-white")
      )}
    >
      {children}
    </Link>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("border-2 border-white/10 border-t-white rounded-full animate-spin", className)} />;
}