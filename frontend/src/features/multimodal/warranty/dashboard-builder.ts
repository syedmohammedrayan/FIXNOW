/**
 * FixNow AI Workflow 5 — Warranty Dashboard Builder
 *
 * Takes extracted warranty data and repair history, calculates
 * remaining days, determines overall status, and generates smart
 * action suggestions for the UI.
 */

import { WarrantyExtraction, WarrantyDashboardPayload, RepairHistoryRecord, WarrantyStatusCategory } from './types';

export class WarrantyDashboardBuilder {
  /**
   * Constructs the final payload to be rendered by the UI.
   */
  buildDashboard(extraction: WarrantyExtraction, history: RepairHistoryRecord[]): WarrantyDashboardPayload {
    const { status, remainingDays } = this.calculateStatus(extraction.warrantyEndDate);
    const smartSuggestions = this.generateSuggestions(extraction, status, history);

    return {
      extraction,
      status,
      remainingDays,
      repairHistory: history,
      smartSuggestions
    };
  }

  private calculateStatus(endDateStr: string): { status: WarrantyStatusCategory; remainingDays: number } {
    if (!endDateStr) {
      return { status: 'Unknown', remainingDays: 0 };
    }

    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) {
      return { status: 'Unknown', remainingDays: 0 };
    }

    const now = new Date();
    // Use 2026 as current year context based on prompts
    if (now.getFullYear() < 2026) {
        now.setFullYear(2026);
    }
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { status: 'Active', remainingDays: diffDays };
    } else {
      return { status: 'Expired', remainingDays: diffDays };
    }
  }

  private generateSuggestions(extraction: WarrantyExtraction, status: WarrantyStatusCategory, history: RepairHistoryRecord[]): string[] {
    const suggestions: string[] = [];

    if (status === 'Expired') {
      suggestions.push('Renew FixNow Warranty (Estimated ₹1499/year)');
      suggestions.push('Book Paid Technician');
    } else if (status === 'Active') {
      if (extraction.isFixNowWarranty) {
        suggestions.push('Schedule Free Visit');
        if (extraction.freeServicesRemaining > 0) {
            suggestions.push(`Claim Free Maintenance (${extraction.freeServicesRemaining} left)`);
        }
      } else {
        suggestions.push(`Claim through ${extraction.warrantyProvider || extraction.brand}`);
        suggestions.push('Book FixNow Paid Repair (if warranty rejected)');
      }
    } else {
       suggestions.push('Verify Warranty Details');
       suggestions.push('Book Paid Technician');
    }

    if (history.length > 0) {
      suggestions.push('View Service History');
    }

    return suggestions;
  }
}
