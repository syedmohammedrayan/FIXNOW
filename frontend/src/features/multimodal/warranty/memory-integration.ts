/**
 * FixNow AI Workflow 5 — Warranty Memory Integration
 *
 * Saves structured warranty extraction to both long-term memory (Hindsight)
 * and session context (CascadeFlow).
 */

import { WarrantyExtraction } from './types';
// Note: In real implementation, these would interact directly with
// the Hindsight and CascadeFlow APIs via FixNowAIService.

export class WarrantyMemoryIntegrationService {
  /**
   * Persists durable appliance metadata for future interactions.
   */
  async saveToHindsight(userId: string, extraction: WarrantyExtraction): Promise<void> {
    const durableMetadata = {
      appliance: {
        brand: extraction.brand,
        model: extraction.modelNumber,
        serialNumber: extraction.serialNumber,
      },
      warranty: {
        provider: extraction.warrantyProvider,
        purchaseDate: extraction.purchaseDate,
        expiry: extraction.warrantyEndDate,
        coverage: extraction.coverage
      },
      owner: extraction.customerName,
      documentType: extraction.documentType,
      timestamp: new Date().toISOString()
    };

    console.log(`[Hindsight] Saving durable appliance data for User ${userId}`, durableMetadata);
    // await hindsight.retain({ userId, memoryKey: 'appliance_profile', data: durableMetadata });
  }

  /**
   * Saves session-specific state so the AI Remembers this document
   * during the current chat flow without asking again.
   */
  async saveToCascadeFlow(sessionId: string, extraction: WarrantyExtraction): Promise<void> {
    const sessionContext = {
      currentAppliance: `${extraction.brand} ${extraction.modelNumber}`,
      currentWarrantyStatus: extraction.isFixNowWarranty ? 'Active FixNow Warranty' : 'Manufacturer/Unknown',
      freeServicesRemaining: extraction.freeServicesRemaining,
      lastUploadedDocument: extraction.documentType,
    };

    console.log(`[CascadeFlow] Updating session context for Session ${sessionId}`, sessionContext);
    // await cascadeFlow.updateContext(sessionId, sessionContext);
  }
}
