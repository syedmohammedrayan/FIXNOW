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
      className="bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative overflow-hidden space-y-5 sm:space-y-8 mt-6 sm:mt-10 border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl"
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.3)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
            <Search className="size-5 sm:size-6 text-white" /> Instant Connect Services
          </h2>
          <p className="text-[9px] sm:text-xs text-white/30 font-bold uppercase tracking-widest mt-1 sm:mt-2">Browse or search 150+ verified technician types instantly</p>
        </div>
        {serviceSearch.trim() && (
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest self-start">
            {filtered.length} results
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-white/20 group-focus-within:text-white/60 transition duration-300" />
        <input
          type="text"
          value={serviceSearch}
          onChange={(e) => setServiceSearch(e.target.value)}
          placeholder="Search services... (e.g. Split AC, Refrigerator)"
          className="w-full pl-11 sm:pl-16 pr-12 sm:pr-14 py-4 sm:py-5 rounded-xl sm:rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition font-medium text-sm shadow-sm"
          style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
        />
        {serviceSearch && (
          <button
            type="button"
            onClick={() => setServiceSearch('')}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mx-1 px-1 scrollbar-none">
        {['All', ...ALL_SERVICES.map(s => s.category)].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all duration-300 whitespace-nowrap shrink-0",
              selectedCategory === cat
                ? "bg-white text-slate-900 border-white shadow-lg shadow-black/20"
                : "bg-white/[0.04] text-white/30 border-white/[0.06] hover:border-white/20 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Items Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 max-h-[360px] sm:max-h-[420px] overflow-y-auto pr-1 sm:pr-2 pt-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filtered.map((item, i) => (
            <motion.button
              key={item + i}
              type="button"
              onClick={() => onSelectService(item)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] text-left flex flex-col justify-between transition-all duration-300 gap-1.5 sm:gap-2 group min-h-[75px] sm:min-h-[90px]"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[11px] sm:text-sm font-bold text-white/50 tracking-tight leading-snug group-hover:text-white transition-colors duration-300 line-clamp-2">
                  {item}
                </p>
                <Sparkles className="size-3 sm:size-3.5 text-white group-hover:scale-110 opacity-0 group-hover:opacity-60 transition-all duration-300 flex-shrink-0" />
              </div>
              <span className="text-[7px] sm:text-[8px] font-black tracking-widest uppercase text-white/20 group-hover:text-white/40 mt-1">Select →</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 border-2 border-dashed border-white/[0.06] rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.02]">
          <Search className="size-8 sm:size-10 text-white/20 mx-auto mb-4" />
          <p className="text-white/30 font-black uppercase tracking-widest text-xs sm:text-sm">No Services Found</p>
          <p className="text-white/15 font-medium text-[10px] sm:text-xs mt-2">Try a different search term or select another category</p>
          <button
            type="button"
            onClick={() => { setServiceSearch(''); setSelectedCategory('All'); }}
            className="mt-5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white text-slate-900 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </motion.div>
  );
}
