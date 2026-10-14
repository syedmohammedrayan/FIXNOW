'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_SERVICES } from '@/lib/services';
import { getCategoryIcon } from './ServiceIcons';
import ServiceCategoryPopover from './ServiceCategoryPopover';

interface ServiceCatalogProps {
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  onSelectService: (service: string) => void;
}

// Exactly 20 main categories in specified order
const MAIN_CATEGORIES = [
  'All',
  'HVAC / AC Technician',
  'Refrigerator Technician',
  'Washing Machine Technician',
  'Kitchen Services Technician',
  'Water Systems Technician',
  'Electrician',
  'Electronics & Smart Home',
  'Carpentry',
  'Plumbing',
  'Gas & Utilities',
  'Installation Services Technician',
  'Pest Control',
  'Cleaning Services',
  'Painter',
  'Renovation Service',
  'Moving & Misc',
  'Bike Mechanics',
  'Car Mechanics',
  'Rural Area Technicians',
] as const;

export default function ServiceCatalog({
  serviceSearch,
  setServiceSearch,
  selectedCategory,
  setSelectedCategory,
  onSelectService
}: ServiceCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const categoryButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Filtered services for live search input
  const searchResults = serviceSearch.trim()
    ? ALL_SERVICES.flatMap(cat =>
        cat.items
          .filter(item => item.toLowerCase().includes(serviceSearch.toLowerCase().trim()))
          .map(item => ({ item, category: cat.category }))
      )
    : [];

  // Get subcategories for currently active popover category
  const getSubcategories = (catName: string | null): string[] => {
    if (!catName) return [];
    if (catName === 'All') {
      return ALL_SERVICES.flatMap(c => c.items);
    }
    const match = ALL_SERVICES.find(c => c.category === catName);
    return match ? match.items : [];
  };

  const handleCategoryClick = (cat: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activeCategory === cat) {
      // Toggle close if already open
      setActiveCategory(null);
      setAnchorRect(null);
    } else {
      // Open or switch to the clicked category
      const rect = e.currentTarget.getBoundingClientRect();
      setAnchorRect(rect);
      setActiveCategory(cat);
      setSelectedCategory(cat);
    }
  };

  const handleClosePopover = () => {
    setActiveCategory(null);
    setAnchorRect(null);
  };

  // Keep anchorRect updated if page scrolls or resizes
  useEffect(() => {
    if (!activeCategory) return;
    const updateRect = () => {
      const btn = categoryButtonRefs.current[activeCategory];
      if (btn) {
        setAnchorRect(btn.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [activeCategory]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative space-y-6 sm:space-y-8 mt-6 sm:mt-10 border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl"
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.3)' }}
    >
      {/* Section Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
            <Search className="size-5 sm:size-6 text-white" /> Instant Connect Services
          </h2>
          <p className="text-[9px] sm:text-xs text-white/50 font-bold uppercase tracking-widest mt-1 sm:mt-2">
            Browse or search 150+ verified technician types instantly
          </p>
        </div>
        {serviceSearch.trim() && (
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest self-start">
            {searchResults.length} results
          </div>
        )}
      </div>

      {/* Search Input - Preserved exactly as requested */}
      <div className="relative group">
        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-white/20 group-focus-within:text-white/60 transition duration-300" />
        <input
          type="text"
          value={serviceSearch}
          onChange={(e) => setServiceSearch(e.target.value)}
          placeholder="Search services... (e.g. Split AC, Refrigerator)"
          className="w-full pl-11 sm:pl-16 pr-12 sm:pr-14 py-4 sm:py-5 rounded-xl sm:rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition font-medium text-[16px] shadow-sm md:text-sm"
          style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
        />
        {serviceSearch && (
          <button
            type="button"
            onClick={() => setServiceSearch('')}
            aria-label="Clear search"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Live Search Results Panel (only when search query is active) */}
      {serviceSearch.trim() && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/90 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                Matching Services ({searchResults.length})
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Click any service below to proceed with booking inspection
              </p>
            </div>
            <button
              type="button"
              onClick={() => setServiceSearch('')}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 px-2.5 py-1 rounded-lg hover:bg-neutral-100 transition"
            >
              Clear search
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200">
              {searchResults.map((res, i) => (
                <button
                  key={res.item + i}
                  type="button"
                  onClick={() => onSelectService(res.item)}
                  className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/70 hover:bg-neutral-100/90 hover:border-neutral-200 text-left transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-none"
                >
                  <p className="text-xs sm:text-[13px] font-semibold text-neutral-800 group-hover:text-neutral-950 line-clamp-2">
                    {res.item}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100/80">
                    <span className="text-[10px] font-medium text-neutral-400 group-hover:text-neutral-600 truncate pr-2">
                      {res.category}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-900 group-hover:translate-x-0.5 transition-transform shrink-0">
                      Select →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-400 text-xs font-medium">
              No services found matching &ldquo;{serviceSearch}&rdquo;. Try a different search term or select a category below.
            </div>
          )}
        </div>
      )}

      {/* Main Service Category Grid - Exactly 3 columns on desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-0.5">
          <span>Categories ({MAIN_CATEGORIES.length})</span>
          <span>Click any category to view sub-services</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5">
          {MAIN_CATEGORIES.map((cat) => {
            const count = cat === 'All' ? ALL_SERVICES.length : (ALL_SERVICES.find(c => c.category === cat)?.items.length || 0);
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                data-category-card={cat}
                ref={(el) => {
                  categoryButtonRefs.current[cat] = el;
                }}
                type="button"
                onClick={(e) => handleCategoryClick(cat, e)}
                className={cn(
                  "group relative text-left bg-white text-neutral-900 rounded-xl sm:rounded-2xl p-4 sm:p-4.5 lg:p-5 border transition-all duration-200 flex items-center gap-4 sm:gap-4.5 min-h-[72px] sm:min-h-[76px] lg:min-h-[82px] shadow-sm hover:shadow-md hover:bg-neutral-50/95 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-none cursor-pointer",
                  isSelected
                    ? "border-neutral-900 ring-2 ring-neutral-900/15 shadow-md bg-neutral-50"
                    : "border-neutral-200/90 hover:border-neutral-300"
                )}
                aria-haspopup="dialog"
                aria-expanded={isSelected}
              >
                {/* Real-world appliance / service icon container (44px mobile, 48px desktop) */}
                <div
                  className={cn(
                    "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors pointer-events-none",
                    isSelected
                      ? "bg-neutral-200 text-neutral-950"
                      : "bg-neutral-100/90 text-neutral-800 group-hover:bg-neutral-200/80"
                  )}
                >
                  {getCategoryIcon(cat, "size-6 sm:size-[26px] shrink-0")}
                </div>

                {/* Category Name & Count */}
                <div className="min-w-0 flex-1 pointer-events-none">
                  <p className="text-[14px] sm:text-[15px] lg:text-base font-semibold text-neutral-900 leading-snug tracking-tight break-words">
                    {cat}
                  </p>
                  <span className="text-[11px] sm:text-xs text-neutral-500 font-medium block mt-1 group-hover:text-neutral-600 transition-colors">
                    {cat === 'All' ? 'Browse all services' : `${count} services`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Anchored Subcategory Popover */}
      <ServiceCategoryPopover
        category={activeCategory || ''}
        subcategories={getSubcategories(activeCategory)}
        anchorRect={anchorRect}
        isOpen={Boolean(activeCategory)}
        onClose={handleClosePopover}
        onSelectService={onSelectService}
      />
    </motion.div>
  );
}
