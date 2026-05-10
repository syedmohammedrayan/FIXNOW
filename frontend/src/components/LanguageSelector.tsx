'use client';
import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
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

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine language from googtrans cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const transCookie = getCookie('googtrans');
    if (transCookie && transCookie.includes('/en/')) {
      const code = transCookie.split('/en/')[1];
      if (LANGUAGES.some(l => l.code === code)) {
        setCurrentLang(code);
      }
    }
  }, []);

  const changeLanguage = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    
    // Set cookie for Google Translate
    if (code === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/;`;
      document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/;`;
    }
    
    // Reload page to force Google Translate script to apply the translation
    window.location.reload();
  };

  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl transition-all duration-300 bg-indigo-500/10 border border-indigo-400/20 hover:bg-indigo-500/20 text-white shadow-sm"
      >
        <Globe className="size-4 text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{activeLang.name}</span>
        <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">{activeLang.code}</span>
        <ChevronDown className={`size-3 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-[#0d0d1b]/95 backdrop-blur-3xl border border-white/20 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-2"
            >
              <div className="px-4 py-2 border-b border-white/10 mb-1">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Select Language</p>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar px-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${
                      currentLang === lang.code 
                        ? 'bg-indigo-500/20 text-indigo-300' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {lang.name}
                    {currentLang === lang.code && <div className="size-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
