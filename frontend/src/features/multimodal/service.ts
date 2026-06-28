/**
 * FixNow AI Workflow 5 — Multimodal Service
 *
 * The public facade for the Multimodal Intelligence workflow.
 * Exposes methods to process voice, images, documents, and build
 * the final unified MultimodalContext.
 */

import { FixNowAIService } from '@/lib/ai/service/fixnow-ai.service';
import { VoiceTranscriptionService } from './voice/transcription';
import { VoiceTranslationService } from './voice/translation';
import { ImageAnalyzerService } from './image/analyzer';
import { ImageClassifierService } from './image/classifier';
import { DocumentOCRService } from './documents/ocr';
import { DocumentParserService } from './documents/parser';
import { MultimodalContextBuilder } from './context/builder';

import { ImageRouterService, ImageRouteResult } from './image/router';
import { WarrantyExtractorService } from './warranty/extractor';
import { WarrantyHistoryLookupService } from './warranty/history-lookup';
import { WarrantyMemoryIntegrationService } from './warranty/memory-integration';
import { WarrantyDashboardBuilder } from './warranty/dashboard-builder';
import { WarrantyDashboardPayload } from './warranty/types';

import { MultimodalOrchestrator } from './orchestrator';

import {
  VoiceTranscript,
  ImageAnalysis,
  OCRResult,
  ApplianceInfo,
  MultimodalContext
} from './types';

import {
  validateVoiceTranscript,
  validateImageAnalysis,
  validateOCRResult,
  validateApplianceInfo,
  validateMultimodalContext
} from './validator';

export class MultimodalService {
  private aiService: FixNowAIService;
  private voiceTranscription: VoiceTranscriptionService;
  private voiceTranslation: VoiceTranslationService;
  private imageAnalyzer: ImageAnalyzerService;
  private imageClassifier: ImageClassifierService;
  private documentOcr: DocumentOCRService;
  private documentParser: DocumentParserService;
  private contextBuilder: MultimodalContextBuilder;
  private imageRouter: ImageRouterService;
  private warrantyExtractor: WarrantyExtractorService;
  private warrantyHistory: WarrantyHistoryLookupService;
  private warrantyMemory: WarrantyMemoryIntegrationService;
  private warrantyDashboard: WarrantyDashboardBuilder;
  private orchestrator: MultimodalOrchestrator;

  constructor() {
    this.aiService = new FixNowAIService();
    this.voiceTranscription = new VoiceTranscriptionService(this.aiService);
    this.voiceTranslation = new VoiceTranslationService(this.aiService);
    this.imageAnalyzer = new ImageAnalyzerService(this.aiService);
    this.imageClassifier = new ImageClassifierService(this.aiService);
    this.documentOcr = new DocumentOCRService(this.aiService);
    this.documentParser = new DocumentParserService(this.aiService);
    this.contextBuilder = new MultimodalContextBuilder(this.aiService);
    this.imageRouter = new ImageRouterService(this.aiService);
    this.warrantyExtractor = new WarrantyExtractorService(this.aiService);
    this.warrantyHistory = new WarrantyHistoryLookupService();
    this.warrantyMemory = new WarrantyMemoryIntegrationService();
    this.warrantyDashboard = new WarrantyDashboardBuilder();
    this.orchestrator = new MultimodalOrchestrator(this.aiService);
  }

  /**
   * Processes a voice input (transcribes, detects language, translates).
   */
  async processVoice(audioDescription: string, userId?: string): Promise<VoiceTranscript> {
    const transcript = await this.voiceTranscription.transcribe(audioDescription, userId);
    const validation = validateVoiceTranscript(transcript);
    
    if (!validation.valid || !validation.result) {
      console.warn('Voice validation failed:', validation.errors);
      return { text: audioDescription, translatedText: audioDescription, detectedLanguage: 'English', confidence: 0.1 };
    }
    return validation.result;
  }

  /**
   * Processes an image description to extract appliance info and defects.
   */
  async processImage(imageDescription: string, userId?: string): Promise<ImageAnalysis> {
    const analysis = await this.imageAnalyzer.analyze(imageDescription, userId);
    const validation = validateImageAnalysis(analysis);
    
    if (!validation.valid || !validation.result) {
      console.warn('Image validation failed:', validation.errors);
      return { applianceType: 'Other', brand: 'Unknown', model: 'Unknown', visibleDefects: [], damageSeverity: 'None', confidence: 0.1 };
    }
    return validation.result;
  }

  /**
   * Processes a document text dump (OCR) to extract structured fields.
   */
  async processDocument(documentText: string, userId?: string): Promise<OCRResult> {
    const ocr = await this.documentOcr.extractText(documentText, userId);
    const validation = validateOCRResult(ocr);
    
    if (!validation.valid || !validation.result) {
      console.warn('OCR validation failed:', validation.errors);
      return { rawText: documentText, documentType: 'unknown', extractedFields: {}, confidence: 0.1 };
    }
    return validation.result;
  }

  /**
   * Parses an OCR result into a structured ApplianceInfo object.
   */
  async parseApplianceInfo(ocrResult: OCRResult, userId?: string): Promise<ApplianceInfo> {
    const info = await this.documentParser.parseApplianceInfo(ocrResult, userId);
    const validation = validateApplianceInfo(info);

    if (!validation.valid || !validation.result) {
      console.warn('ApplianceInfo validation failed:', validation.errors);
      return { brand: 'Unknown', type: 'Unknown', model: 'Unknown', serialNumber: 'Unknown', warrantyStatus: 'Unknown', warrantyExpiry: 'Unknown' };
    }
    return validation.result;
  }

  /**
   * Merges all available inputs into the final unified MultimodalContext.
   */
  async buildContext(
    inputs: { voice?: VoiceTranscript; image?: ImageAnalysis; document?: OCRResult; appliance?: ApplianceInfo; text?: string },
    userId?: string
  ): Promise<MultimodalContext> {
    const context = await this.contextBuilder.buildContext(inputs, userId);
    const validation = validateMultimodalContext(context);

    if (!validation.valid || !validation.result) {
      console.warn('Context validation failed:', validation.errors);
      return {
        ...inputs,
        problemSummary: inputs.text || 'Unknown issue.',
        language: 'English',
        confidence: 0.1
      };
    }
    return validation.result;
  }

  /**
   * Routes an uploaded image description to determine if it is an
   * Appliance Issue (diagnosis flow) or a Document (warranty flow).
   */
  async routeVisualScan(imageDescription: string, userId?: string): Promise<ImageRouteResult> {
    return this.imageRouter.routeImage(imageDescription, userId);
  }

  /**
   * Executes the full Warranty Intelligence Pipeline for a document upload.
   * Extracts fields, looks up history, saves to memory, and builds the UI dashboard.
   */
  async processWarrantyDocument(
    ocrText: string,
    userId: string,
    sessionId: string
  ): Promise<WarrantyDashboardPayload> {
    // 1. Deep Extraction
    const extraction = await this.warrantyExtractor.extract(ocrText, userId);

    // 2. Fetch Repair History
    const history = await this.warrantyHistory.fetchHistory(
      extraction.serialNumber,
      extraction.modelNumber
    );

    // 3. Save to Memory (Hindsight and CascadeFlow)
    await this.warrantyMemory.saveToHindsight(userId, extraction);
    await this.warrantyMemory.saveToCascadeFlow(sessionId, extraction);

    // 4. Build UI Dashboard Payload
    return this.warrantyDashboard.buildDashboard(extraction, history);
  }

  /**
   * The new Enterprise-Grade Upload Pipeline.
   * Replaces simple image routing with 3-detector classification, 
   * mixed-upload handling, and cross-verification.
   */
  async orchestrateUpload(
    imageDescription: string,
    ocrText: string,
    layoutDescription: string,
    userId: string
  ): Promise<any> {
    const classification = await this.orchestrator.classifyUpload(imageDescription, ocrText, layoutDescription, userId);
    return this.orchestrator.handleUpload(classification, imageDescription, ocrText, userId);
  }
}

// Export a singleton instance for ease of use
export const multimodalService = new MultimodalService();
