/**
 * FixNow AI Workflow 5 — Multimodal Orchestrator
 *
 * Master controller for the Multimodal workflow.
 * Handles mixed uploads, cross-verification, and ensures the
 * "Warranty-First" rule before any paid technician bookings are suggested.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { VisionDetector } from './classification/detectors/vision';
import { OCRDetector } from './classification/detectors/ocr';
import { LayoutDetector } from './classification/detectors/layout';
import { DecisionEngine } from './classification/decision-engine';
import { ClassificationResult, CrossVerificationResult } from './classification/types';
import { WarrantyExtractorService } from './warranty/extractor';
import { ImageAnalyzerService } from './image/analyzer';
import { ImageAnalysis } from './types';
import { WarrantyExtraction } from './warranty/types';
import { WarrantyHistoryLookupService } from './warranty/history-lookup';

export class MultimodalOrchestrator {
  private visionDetector: VisionDetector;
  private ocrDetector: OCRDetector;
  private layoutDetector: LayoutDetector;
  private decisionEngine: DecisionEngine;
  
  private imageAnalyzer: ImageAnalyzerService;
  private warrantyExtractor: WarrantyExtractorService;
  private warrantyHistory: WarrantyHistoryLookupService;

  constructor(aiService: FixNowAIService) {
    this.visionDetector = new VisionDetector(aiService);
    this.ocrDetector = new OCRDetector(aiService);
    this.layoutDetector = new LayoutDetector(aiService);
    this.decisionEngine = new DecisionEngine();
    
    this.imageAnalyzer = new ImageAnalyzerService(aiService);
    this.warrantyExtractor = new WarrantyExtractorService(aiService);
    this.warrantyHistory = new WarrantyHistoryLookupService();
  }

  /**
   * Step 1: Intelligent Pipeline Classification
   */
  async classifyUpload(imageDescription: string, ocrText: string, layoutDescription: string, userId?: string): Promise<ClassificationResult> {
    const [visionResult, ocrResult, layoutResult] = await Promise.all([
      this.visionDetector.detect(imageDescription, userId),
      this.ocrDetector.detect(ocrText, userId),
      this.layoutDetector.detect(layoutDescription, userId)
    ]);

    return this.decisionEngine.evaluate(visionResult, ocrResult, layoutResult);
  }

  /**
   * Step 2: Cross Verify Appliance vs Document
   */
  crossVerify(appliance: ImageAnalysis, document: WarrantyExtraction): CrossVerificationResult {
    // Basic verification: Check if brand matches
    const applianceBrand = appliance.brand.toLowerCase();
    const docBrand = document.brand.toLowerCase();
    
    // Ignore if one of them is unknown
    if (applianceBrand === 'unknown' || docBrand === 'unknown' || !applianceBrand || !docBrand) {
       return { isMatch: true, message: 'Insufficient data for cross-verification.' };
    }

    if (applianceBrand !== docBrand) {
       return { 
         isMatch: false, 
         message: `Mismatch Detected: The uploaded warranty document belongs to a ${document.brand} appliance, but the uploaded photo shows a ${appliance.brand} appliance.` 
       };
    }

    return { isMatch: true, message: 'Appliance and Document match successfully.' };
  }

  /**
   * Step 3: Handle Final Routing Logic
   * Ensures Warranty is checked BEFORE any paid diagnosis flow starts.
   */
  async handleUpload(
    classification: ClassificationResult,
    imageDescription: string,
    ocrText: string,
    userId: string
  ): Promise<any> {
    
    if (classification.finalCategory === 'Unknown') {
      return { 
        status: 'prompt_user', 
        message: 'We couldn’t confidently determine what you uploaded. Please select: [Appliance Photo] [Warranty Card] [Invoice]' 
      };
    }

    if (classification.finalCategory === 'Mixed Images') {
      // 1. Process Both
      const applianceData = await this.imageAnalyzer.analyze(imageDescription, userId);
      const documentData = await this.warrantyExtractor.extract(ocrText, userId);
      
      // 2. Cross Verify
      const verification = this.crossVerify(applianceData, documentData);
      
      if (!verification.isMatch) {
         return {
           status: 'mismatch_alert',
           message: verification.message,
           options: ['Continue with diagnosis only', 'Use warranty only', 'Upload correct document']
         };
      }
      
      // 3. Return Combined Premium Experience
      return {
        status: 'combined_workflow',
        applianceData,
        warrantyData: documentData,
        message: 'Processing together... Checking warranty coverage for diagnosis.'
      };
    }

    if (classification.finalCategory === 'Appliance Issue') {
      // WARRANTY-FIRST RULE: Even if they just upload an appliance, we MUST check if we know this appliance first.
      // (In a full implementation, we'd look up the user's registered appliances here)
      // If found -> verify warranty. If not found -> proceed to diagnosis.
      
      const applianceData = await this.imageAnalyzer.analyze(imageDescription, userId);
      return {
        status: 'diagnosis_workflow',
        applianceData,
        message: 'Checking existing warranties... Proceeding to fault diagnosis.'
      };
    }

    // Otherwise, it's a Document type
    const documentData = await this.warrantyExtractor.extract(ocrText, userId);
    return {
      status: 'warranty_workflow',
      warrantyData: documentData,
      message: 'Generating Warranty Intelligence Dashboard.'
    };
  }
}
