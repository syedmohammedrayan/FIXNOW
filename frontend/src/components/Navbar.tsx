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
      "w-[95%] max-w-7xl bg-slate-900/90 backdrop-blur-3xl border border-white/10 shadow-2xl",
      visible ? (scrolled ? "top-2 py-3 rounded-[2rem] opacity-100" : "top-4 py-4 rounded-[2rem] opacity-100") : "-top-32 opacity-0 pointer-events-none"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="group">
          <Logo 
            isAdmin={profile?.role === 'admin'} 
            showText 
            isLanding={true} 
            className="transition-all duration-500"
            textClassName="text-white group-hover:text-cyan-400"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          <NavLink href="/services" active={pathname === '/services'} isLanding={true}>Services</NavLink>
          <button 
            onClick={openAboutModal}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 text-slate-400 hover:text-white"
            )}
          >
            About Protocol
          </button>
        </div>

        <div className="flex items-center gap-6">
          <LanguageSelector />

          <AnimatePresence mode="wait">
            {(user || customProfile) ? (
              <div className="flex items-center gap-4">
                {!isLanding && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2.5 text-white bg-white/5 border border-white/10 hover:text-cyan-400 hover:bg-white/10 rounded-xl transition cursor-pointer"
                    >
                       <Bell className="size-5" />
                       <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full border border-slate-950" />
                    </button>
                  </div>
                )}
                <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10">
                   <div className="relative group/profile">
                      <button className="flex items-center gap-3 group">
                        <div className="size-10 rounded-2xl overflow-hidden border border-white/20 group-hover:border-cyan-400 transition shadow-sm">
                           {profile?.avatar && profile.avatar.length > 5 ? (
                             <div className="relative size-full">
                               <img src={profile.avatar} className="size-full object-cover transition-all" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=random` }} />
                               <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
                             </div>
                           ) : (
                             <div className="size-full bg-white/10 flex items-center justify-center text-lg text-white font-black">{profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}</div>
                           )}
                        </div>
                        <div className="hidden md:block text-left">
                           <p className="text-[10px] font-black text-white uppercase tracking-widest">{profile?.name || 'Authorized'}</p>
                           {profile?.role && <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">{profile.role}</p>}
                        </div>
                        <ChevronDown className="size-4 text-slate-400 group-hover:text-white transition" />
                      </button>

                      <div className="absolute top-full right-0 mt-4 w-60 bg-[#0d0d1b] border border-white/20 rounded-[2rem] shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all duration-500 z-50 overflow-hidden">
                        <div className="p-3 space-y-1">
                          <Link href={`/${profile?.role}/dashboard`} className="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl transition">
                            <LayoutDashboard className="size-4 text-cyan-400" /> Control Panel
                          </Link>
                          <Link href={`/${profile?.role}/dashboard#profile`} className="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl transition">
                            <User className="size-4 text-cyan-400" /> Identity Profile
                          </Link>
                          <div className="h-px bg-white/10 my-2 mx-3" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/20 rounded-2xl transition">
                            <LogOut className="size-4 text-rose-400" /> Terminate
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-5">
                <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-[0.2em] transition-all text-slate-300 hover:text-white">
                  Login
                </Link>
                <Link href="/auth/signup" className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl bg-white text-slate-900 hover:bg-slate-100 shadow-white/10">
                  Register
                </Link>
              </div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden size-10 flex items-center justify-center rounded-xl border transition-colors bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden mt-4 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl"
          >
            <div className="p-10 space-y-6">
              <Link href="/services" onClick={() => setIsOpen(false)} className="block text-sm font-black uppercase tracking-widest transition-colors text-slate-400 hover:text-white">Services</Link>
              <button 
                onClick={() => { setIsOpen(false); openAboutModal(); }} 
                className="block text-sm font-black uppercase tracking-widest text-left w-full transition-colors text-slate-400 hover:text-white"
              >
                About Protocol
              </button>
              {!user && !customProfile && (
                <div className="pt-6 flex flex-col gap-4">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="w-full py-4 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all bg-white/5 text-slate-100 border-white/10 hover:bg-white/10">Login</Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="w-full py-4 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all bg-white text-slate-900 shadow-white/10 hover:bg-slate-100">Register</Link>
                </div>
              )}
              {(user || customProfile) && (
                <div className="pt-6 flex flex-col gap-4 border-t border-white/10">
                  <Link href={`/${profile?.role}/dashboard`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all bg-white/5 text-white border-white/10 hover:bg-white/10">
                    <LayoutDashboard className="size-4 text-cyan-400" /> Control Panel
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all bg-rose-500/10 text-rose-400 border border-rose-500/20">
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
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
              onClick={() => setShowAboutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0a0a0f]/90 backdrop-blur-3xl border border-white/20 rounded-[3rem] shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
              <div className="absolute -top-24 -left-24 size-48 bg-cyan-500/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-24 -right-24 size-48 bg-purple-500/10 blur-[80px] rounded-full" />
              
              <div className="p-10 relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                      <Shield className="size-3.5" /> Admin Protocol
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none">System Identity</h2>
                  </div>
                  <button 
                    onClick={() => setShowAboutModal(false)}
                    className="p-3 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {loadingAdmin ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                      <div className="size-12 border-4 border-white/5 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Encrypted Records...</p>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 space-y-8 backdrop-blur-md shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]">
                      <div className="flex items-center gap-6">
                        <div className="size-20 rounded-[1.8rem] bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-white/20 flex items-center justify-center shadow-2xl relative group overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <User className="size-10 text-white relative z-10" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-cyan-400/70 uppercase tracking-[0.25em] mb-1.5">Assigned Liaison</p>
                          <p className="text-3xl font-black text-white tracking-tighter leading-none">{adminDetails?.name || 'System Admin'}</p>
                        </div>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                      
                      <div className="space-y-7">
                        <div className="flex items-start gap-5 group">
                          <div className="mt-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all duration-300 shadow-lg">
                            <LayoutDashboard className="size-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1.5 group-hover:text-cyan-400/50 transition-colors">Organization</p>
                            <p className="text-white font-black text-sm tracking-tight">{adminDetails?.company || <span><span className="notranslate">FIXNOW</span> Technologies</span>}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-5 group">
                          <div className="mt-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shadow-lg">
                            <MapPin className="size-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1.5 group-hover:text-indigo-400/50 transition-colors">Deployment Zone</p>
                            <p className="text-white font-black text-sm tracking-tight leading-relaxed">{adminDetails?.address || 'Global Service Mesh'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-5 group">
                          <div className="mt-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all duration-300 shadow-lg">
                            <Settings className="size-4" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1.5 group-hover:text-purple-400/50 transition-colors">Comm Channels</p>
                            <div className="space-y-1">
                              <p className="text-white font-black text-sm tracking-tight">{adminDetails?.phone || '+1 (888) FIX-NOW-1'}</p>
                              <p className="text-cyan-400 font-black text-xs tracking-widest hover:text-cyan-300 transition-colors cursor-pointer">{adminDetails?.email || 'HQ@FIXNOW.APP'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center pt-6 opacity-40">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">© {new Date().getFullYear()} <span className="notranslate">FIXNOW</span> Service Mesh Ecosystem</p>
                  </div>
                </div>
              </div>
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
        "text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95",
        active 
          ? "text-white"
          : "text-slate-400 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("border-2 border-white/10 border-t-white rounded-full animate-spin", className)} />;
}
;
}