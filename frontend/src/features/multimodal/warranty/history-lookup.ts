/**
 * FixNow AI Workflow 5 — Warranty History Lookup
 *
 * Simulates a database lookup for repair history and past complaints
 * based on an extracted appliance model number or serial number.
 */

import { RepairHistoryRecord } from './types';

export class WarrantyHistoryLookupService {
  /**
   * Retrieves repair history for a given appliance serial or model.
   * In a real implementation, this queries Firestore/Postgres.
   */
  async fetchHistory(serialNumber: string, modelNumber: string): Promise<RepairHistoryRecord[]> {
    // Simulate DB latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock history based on provided example
    if (serialNumber || modelNumber) {
      return [
        {
          date: '2026-01-12',
          issue: 'Cooling Issue',
          technician: 'Ahmed Khan',
          status: 'Completed',
          partsReplaced: ['Compressor Relay']
        },
        {
          date: '2025-08-02',
          issue: 'Gas Refill',
          technician: 'Raj Patel',
          status: 'Completed',
          partsReplaced: ['R32 Refrigerant']
        },
        {
          date: '2025-05-18',
          issue: 'Annual Service',
          technician: 'Sunita Sharma',
          status: 'Completed',
          partsReplaced: []
        }
      ];
    }

    return [];
  }
}
