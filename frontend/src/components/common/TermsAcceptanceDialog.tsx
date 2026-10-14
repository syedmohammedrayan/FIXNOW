'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';

export interface TermsAcknowledgement {
  role: 'customer' | 'technician';
  termsType: 'customer' | 'technician';
  termsVersion: string;
  action?: string;
  bookingId?: string;
  accepted: boolean;
  acceptedAt?: string;
}

export interface TermsAcceptanceDialogProps {
  open: boolean;
  role: 'customer' | 'technician';
  actionLabel?: string;
  actionSubmitting?: boolean;
  onCancel: () => void;
  onAccept: (ack: TermsAcknowledgement) => void;
}

const CUSTOMER_TERMS = [
  'I confirm my details are accurate.',
  'I acknowledge the estimated service charges.',
  'I approve additional repair costs before work begins.',
  'I agree to the cancellation and payment policies.',
  'I agree to maintain a safe environment and respect technicians.',
];

const TECHNICIAN_TERMS = [
  'I confirm my credentials are accurate.',
  'I agree to transparent pricing.',
  'I obtain customer approval for additional repairs.',
  'I commit to appointments and timely communication.',
  'I agree to safe repairs and customer privacy.',
];

export const CUSTOMER_TERMS_VERSION = 'customer-v1';
export const TECHNICIAN_TERMS_VERSION = 'technician-v1';

export default function TermsAcceptanceDialog({
  open,
  role,
  actionLabel,
  actionSubmitting = false,
  onCancel,
  onAccept,
}: TermsAcceptanceDialogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [hasCheckedAgreement, setHasCheckedAgreement] = useState(false);

  const isCustomer = role === 'customer';
  const title = isCustomer ? 'Customer Terms & Conditions' : 'Technician Terms & Conditions';
  const intro = isCustomer
    ? 'Please read the following terms before proceeding with this service booking.'
    : 'Please read the following terms before accepting this customer booking.';
  const terms = isCustomer ? CUSTOMER_TERMS : TECHNICIAN_TERMS;
  const checkboxLabel = isCustomer
    ? "I agree to FixNow's Customer Terms & Conditions."
    : "I agree to FixNow's Technician Terms & Conditions.";
  const termsVersion = isCustomer ? CUSTOMER_TERMS_VERSION : TECHNICIAN_TERMS_VERSION;
  const defaultActionLabel = isCustomer ? 'I Agree & Continue' : 'I Agree & Accept Booking';
  const submitButtonLabel = actionLabel || defaultActionLabel;

  // Reset scroll and states whenever the dialog is opened
  useEffect(() => {
    if (open) {
      setHasReadToBottom(false);
      setHasCheckedAgreement(false);

      const checkInitialFit = () => {
        const el = scrollRef.current;
        if (el) {
          el.scrollTop = 0;
          // If content fits completely inside visible height (no scrolling needed)
          if (el.scrollHeight <= el.clientHeight + 6) {
            setHasReadToBottom(true);
          }
        }
      };

      const timer = setTimeout(checkInitialFit, 60);

      // Listen for window resize to recheck if it fits
      window.addEventListener('resize', checkInitialFit);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkInitialFit);
      };
    } else {
      setHasReadToBottom(false);
      setHasCheckedAgreement(false);
    }
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const tolerance = 6;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - tolerance) {
      setHasReadToBottom(true);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setHasCheckedAgreement(checked === true);
  };

  const canAccept = hasReadToBottom && hasCheckedAgreement && !actionSubmitting;

  const handleAcceptClick = () => {
    if (!hasReadToBottom || !hasCheckedAgreement || actionSubmitting) return;

    const acknowledgement: TermsAcknowledgement = {
      role,
      termsType: role,
      termsVersion,
      accepted: true,
      acceptedAt: new Date().toISOString(),
    };

    onAccept(acknowledgement);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !actionSubmitting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className="max-w-lg sm:max-w-xl w-[94vw] bg-slate-950/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-7 gap-5 overflow-hidden"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black text-white tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            {intro}
          </DialogDescription>
        </DialogHeader>

        {/* Thin neutral divider */}
        <div className="h-px w-full bg-white/10 -mt-1" />

        {/* Scrollable Terms Content */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            tabIndex={0}
            role="region"
            aria-label="Terms and Conditions Content"
            className="max-h-60 sm:max-h-68 overflow-y-auto pr-3 space-y-3.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 rounded-xl scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent"
          >
            {terms.map((termText, index) => {
              const termNumber = index + 1;
              return (
                <div
                  key={termNumber}
                  className="flex items-start gap-3 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <span className="flex items-center justify-center size-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-black shrink-0 mt-0.5">
                    {termNumber}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    {termNumber}. {termText}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reading progress indicator / scroll hint */}
          {!hasReadToBottom && (
            <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-semibold text-amber-400/90 animate-pulse">
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Scroll down to read the complete terms</span>
            </div>
          )}
          {hasReadToBottom && (
            <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terms completely read</span>
            </div>
          )}
        </div>

        {/* Agreement Checkbox Area */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <label
            htmlFor="terms-agreement-checkbox"
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none',
              hasCheckedAgreement
                ? 'bg-indigo-500/10 border-indigo-500/30'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
            )}
          >
            <Checkbox
              id="terms-agreement-checkbox"
              checked={hasCheckedAgreement}
              onCheckedChange={handleCheckboxChange}
              className="mt-0.5 border-white/30 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <span className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug">
              {checkboxLabel}
            </span>
          </label>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-1 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={actionSubmitting}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 px-4 h-10 rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleAcceptClick}
            disabled={!canAccept}
            className={cn(
              'text-xs font-black uppercase tracking-wider h-10 px-5 rounded-xl transition-all shadow-lg',
              canAccept
                ? 'bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98]'
                : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
            )}
          >
            {actionSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              submitButtonLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
