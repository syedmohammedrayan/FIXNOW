'use client';

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { getCategoryIcon } from './ServiceIcons';

interface ServiceCategoryPopoverProps {
  category: string;
  subcategories: string[];
  anchorRect: DOMRect | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (service: string) => void;
}

export default function ServiceCategoryPopover({
  category,
  subcategories,
  anchorRect,
  isOpen,
  onClose,
  onSelectService
}: ServiceCategoryPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    placement: 'top' | 'bottom';
    width: number;
    maxHeight: number;
  }>({
    left: 16,
    placement: 'bottom',
    width: 320,
    maxHeight: 360
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute exact viewport-relative fixed position from anchorRect
  const computePosition = useCallback(() => {
    if (!anchorRect) return;

    const margin = 12;
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popoverWidth = Math.min(
      Math.max(anchorRect.width, 320),
      Math.min(480, viewportWidth - margin * 2)
    );

    // Available space above and below the anchor in the current viewport
    const spaceAbove = anchorRect.top - margin;
    const spaceBelow = viewportHeight - anchorRect.bottom - margin;

    // Prefer placing ABOVE whenever sufficient space (>= 250px) is available
    const placeAbove = spaceAbove >= 250 || (spaceAbove >= 180 && spaceAbove > spaceBelow);

    let top: number | undefined;
    let bottom: number | undefined;
    let placement: 'top' | 'bottom';
    let maxHeight: number;

    if (placeAbove) {
      placement = 'top';
      // Anchor directly above the button's top edge
      bottom = viewportHeight - anchorRect.top + gap;
      maxHeight = Math.min(400, Math.max(160, spaceAbove - gap));
    } else {
      placement = 'bottom';
      // Anchor directly below the button's bottom edge
      top = anchorRect.bottom + gap;
      maxHeight = Math.min(400, Math.max(160, spaceBelow - gap));
    }

    // Align left with the anchor button, clamped strictly inside the viewport
    let left = anchorRect.left;
    const maxLeft = viewportWidth - popoverWidth - margin;
    if (left > maxLeft) left = maxLeft;
    if (left < margin) left = margin;

    setPosition({
      top,
      bottom,
      left,
      placement,
      width: popoverWidth,
      maxHeight
    });
  }, [anchorRect]);

  useLayoutEffect(() => {
    if (isOpen && anchorRect) {
      computePosition();
    }
  }, [isOpen, anchorRect, computePosition]);

  // Recalculate on window scroll or resize to keep popover attached to anchor
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      computePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, computePosition]);

  // Outside click & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If click is inside the popover, don't close
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }

      // If click is on any category card button, let the category button's own onClick toggle or switch it!
      if (target.closest('[data-category-card]')) {
        return;
      }

      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !anchorRect) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        key={`popover-${category}`}
        initial={{ opacity: 0, scale: 0.95, y: position.placement === 'top' ? 6 : -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: position.placement === 'top' ? 4 : -4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: position.top !== undefined ? `${position.top}px` : 'auto',
          bottom: position.bottom !== undefined ? `${position.bottom}px` : 'auto',
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: `${position.maxHeight}px`,
          zIndex: 99999
        }}
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl shadow-black/30 flex flex-col overflow-hidden text-neutral-900"
        role="dialog"
        aria-modal="true"
        aria-label={`${category} subcategories`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-1.5 rounded-lg bg-white border border-neutral-200 shadow-2xs shrink-0">
              {getCategoryIcon(category, "size-4 text-neutral-900")}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight truncate leading-tight">
                {category}
              </h3>
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mt-0.5">
                {subcategories.length} {subcategories.length === 1 ? 'service' : 'services'} available
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close popover"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/60 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-neutral-400 focus:outline-none"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Subcategories List */}
        <div className="p-2 overflow-y-auto flex-1 space-y-1 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
          {subcategories.length > 0 ? (
            subcategories.map((sub, idx) => (
              <button
                key={sub + idx}
                type="button"
                onClick={() => {
                  onSelectService(sub);
                  onClose();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200/80 transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-none"
              >
                <span className="line-clamp-2 pr-2 group-hover:font-semibold transition-all">
                  {sub}
                </span>
                <ChevronRight className="size-3.5 text-neutral-300 group-hover:text-neutral-800 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-neutral-400 font-medium">
              No specific subcategories found.
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between text-[10px] text-neutral-400 font-medium shrink-0">
          <span>Click service to book inspection</span>
          <span className="text-neutral-400">Esc to close</span>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
