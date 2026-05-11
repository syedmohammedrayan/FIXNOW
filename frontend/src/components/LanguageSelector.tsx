'use client';
import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'or', name: 'Odia' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ur', name: 'Urdu' },
  { code: 'as', name: 'Assamese' },
  { code: 'bn', name: 'Bengali' },
];

export default function LanguageSelector({ inline = false }: { inline?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    const transCookie = getCookie('googtrans');
    if (transCookie && transCookie.includes('/en/')) {
      const code = transCookie.split('/en/')[1];
      if (LANGUAGES.some(l => l.code === code)) setCurrentLang(code);
    }
  }, []);

  const changeLanguage = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    if (code === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/;`;
      document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/;`;
    }
    window.location.reload();
  };

  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  /* ── Inline mode (used inside mobile drawer) ── */
  if (inline) {
    return (
      <div className="w-full">
        {/* Trigger row */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white transition-all active:scale-[0.98]"
        >
          <Globe className="size-4 text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-widest flex-1 text-left">{activeLang.name}</span>
          <ChevronDown className={`size-3.5 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Inline accordion list */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.35em]">Select Language</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                        currentLang === lang.code
                          ? 'text-white bg-indigo-500/15'
                          : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {lang.name}
                      {currentLang === lang.code && (
                        <span className="size-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Default mode (navbar / desktop) ── */
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl transition-all duration-300 bg-indigo-500/10 border border-indigo-400/20 hover:bg-indigo-500/20 text-white shadow-sm"
      >
        <Globe className="size-4 text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{activeLang.name}</span>
        <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">{activeLang.code.toUpperCase()}</span>
        <ChevronDown className={`size-3 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="absolute right-0 mt-4 w-60 bg-[#0a0a14]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.7)] z-50 overflow-hidden p-3"
              style={{ boxShadow: 'inset 0 0 30px rgba(255,255,255,0.02), 0 30px 70px rgba(0,0,0,0.7)' }}
            >
              <div className="px-5 py-4 border-b border-white/5 mb-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Language Node</p>
              </div>
              <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-between group ${
                      currentLang === lang.code
                        ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-white border border-white/5'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {lang.name}
                    {currentLang === lang.code && (
                      <motion.div layoutId="active-indicator" className="size-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-3 border-t border-white/5 text-center">
                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest italic">Global Mesh Protocol v4.2</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
