'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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

  // Reset scroll and states whenever the dialog is opened & lock background scroll
  useEffect(() => {
    if (open) {
      setHasReadToBottom(false);
      setHasCheckedAgreement(false);

      // Prevent background scrolling while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const checkInitialFit = () => {
        const el = scrollRef.current;
        if (el) {
          el.scrollTop = 0;
          // If content fits completely inside visible height (no scrolling required)
          if (el.scrollHeight <= el.clientHeight + 8) {
            setHasReadToBottom(true);
          }
        }
      };

      const timer = setTimeout(checkInitialFit, 50);
      window.addEventListener('resize', checkInitialFit);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkInitialFit);
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setHasReadToBottom(false);
      setHasCheckedAgreement(false);
    }
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const tolerance = 8;
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
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !actionSubmitting) {
          onCancel();
        }
      }}
    >
      <DialogPrimitive.Portal>
        {/* Viewport-level backdrop overlay */}
        <DialogPrimitive.Overlay
          className="terms-dialog-overlay fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
        />

        {/* Centered Modal Container */}
        <DialogPrimitive.Content
          aria-describedby="terms-description"
          className="terms-dialog-content fixed left-1/2 top-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-full sm:max-w-[560px] max-h-[85vh] flex flex-col bg-white text-[#202124] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#E5E7EB] overflow-hidden focus:outline-none"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div className="shrink-0 p-6 pb-4 border-b border-[#E5E7EB] bg-white relative">
            <div className="pr-8">
              <DialogPrimitive.Title className="text-xl sm:text-[22px] font-semibold text-[#202124] tracking-tight">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                id="terms-description"
                className="text-sm text-[#5F6368] mt-1.5 leading-normal"
              >
                {intro}
              </DialogPrimitive.Description>
            </div>

            {/* Understated X Close Button */}
            <DialogPrimitive.Close
              disabled={actionSubmitting}
              className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5E7EB] disabled:pointer-events-none"
            >
              <Cross2Icon className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Terms Content */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            tabIndex={0}
            role="region"
            aria-label="Terms and Conditions Document"
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-white text-[#202124] focus:outline-none scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
          >
            <ol className="space-y-4.5">
              {terms.map((termText, index) => {
                const termNumber = index + 1;
                return (
                  <li
                    key={termNumber}
                    className="flex items-start gap-3.5 text-[14px] sm:text-[15px] leading-[1.6] text-[#202124]"
                  >
                    <span className="font-semibold text-[#202124] select-none shrink-0 w-4 text-right">
                      {termNumber}.
                    </span>
                    <span className="font-normal text-[#202124]">{termText}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Persistent Footer */}
          <div className="shrink-0 p-5 sm:p-6 border-t border-[#E5E7EB] bg-[#FAFAFA] rounded-b-2xl space-y-4">
            {/* Reading instruction / progress helper */}
            <div className="text-[12px] sm:text-[13px] font-normal leading-tight">
              {!hasReadToBottom ? (
                <p className="text-[#D97706] flex items-center gap-1.5">
                  <span className="inline-block animate-bounce">↓</span>
                  Please scroll to the bottom of the terms to enable agreement.
                </p>
              ) : (
                <p className="text-[#15803D]">
                  All terms have been read. Please check the agreement box below.
                </p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div className="pt-1">
              <label
                htmlFor="terms-agreement-checkbox"
                className="flex items-start gap-3 cursor-pointer select-none group"
              >
                <Checkbox
                  id="terms-agreement-checkbox"
                  checked={hasCheckedAgreement}
                  onCheckedChange={handleCheckboxChange}
                  className="mt-0.5 border-[#D1D5DB] data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB] data-[state=checked]:text-white rounded"
                />
                <span className="text-[13px] sm:text-[14px] font-medium text-[#202124] leading-snug group-hover:text-black">
                  {checkboxLabel}
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={actionSubmitting}
                className="px-4 py-2 text-[13px] sm:text-[14px] font-medium text-[#5F6368] hover:text-[#202124] hover:bg-[#E5E7EB]/60 rounded-xl transition-colors focus:outline-none"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAcceptClick}
                disabled={!canAccept}
                className={cn(
                  'px-5 py-2.5 text-[13px] sm:text-[14px] font-semibold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                  canAccept
                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] focus:ring-[#2563EB] cursor-pointer'
                    : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none'
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
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
