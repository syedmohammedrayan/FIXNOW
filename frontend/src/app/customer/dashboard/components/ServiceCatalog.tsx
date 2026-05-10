'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_SERVICES } from '@/lib/services';

interface ServiceCatalogProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  onSelectService: (service: string) => void;
}

export default function ServiceCatalog({
  serviceSearch,
  setServiceSearch,
  selectedCategory,
  setSelectedCategory,
  onSelectService
}: ServiceCatalogProps) {
  const filtered = ALL_SERVICES
    .filter(cat => selectedCategory === 'All' || cat.category === selectedCategory)
    .flatMap(cat => cat.items)
    .filter(item => !serviceSearch.trim() || item.toLowerCase().includes(serviceSearch.toLowerCase()));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="glass-neon-card p-5 sm:p-10 relative overflow-hidden space-y-6 sm:space-y-8 mt-8 sm:mt-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <Search className="w-6 h-6 text-indigo-500" /> Instant Connect Services
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Browse or search 150+ verified technician types instantly</p>
        </div>
        {serviceSearch.trim() && (
          <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-white/10 text-indigo-400 text-xs font-black uppercase tracking-widest">
            {filtered.length} results
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition duration-300" />
        <input
          type="text"
          value={serviceSearch}
          onChange={(e) => setServiceSearch(e.target.value)}
          placeholder="Search services... (e.g. Split AC, Refrigerator, Pest Control)"
          className="w-full pl-16 pr-14 py-5 rounded-2xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-800/80 transition font-medium text-sm shadow-sm"
        />
        {serviceSearch && (
          <button
            type="button"
            onClick={() => setServiceSearch('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', ...ALL_SERVICES.map(s => s.category)].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
              selectedCategory === cat
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                : "bg-slate-800/40 text-slate-400 border-slate-700 hover:border-indigo-500/50 hover:text-indigo-400"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Items Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-2 pt-2 custom-scrollbar">
          {filtered.map((item, i) => (
            <motion.button
              key={item + i}
              type="button"
              onClick={() => onSelectService(item)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-left flex flex-col justify-between transition-all duration-300 gap-2 group min-h-[90px]"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-bold text-slate-300 tracking-tight leading-snug group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2">
                  {item}
                </p>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0" />
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase text-indigo-500 group-hover:text-indigo-400 mt-1">Select Service →</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-[2rem] bg-slate-800/20">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Services Found</p>
          <p className="text-slate-500 font-medium text-xs mt-2">Try a different search term or select another category</p>
          <button
            type="button"
            onClick={() => { setServiceSearch(''); setSelectedCategory('All'); }}
            className="mt-5 px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </motion.div>
  );
}
