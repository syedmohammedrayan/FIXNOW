export interface AnalysisResult {
  category: string;
  urgency: string;
  estimatedCostRange: string;
  summary: string;
  recommendedMaterials: string[];
  technicalTerms?: string[];
  serviceSpecs?: string;
  confidence?: number;
  reasoning?: string;
  estimatedTime?: string;
  memoryUsed?: boolean;
  previousRepairsCount?: number;
  requiredTools?: string[];
  requiredMaterials?: string[];
  recommendedRepair?: string;
  documentDetails?: {
    isFixNow?: boolean;
    productType?: string;
    warrantyDate?: string;
    warrantyValid?: boolean;
    amount?: number;
    specs?: string[];
    recommendedTechnicianCategory?: string;
  };
}

export interface Technician {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: string;
  distance: string;
  online?: boolean;
  xgbScore?: number;
  totalScore?: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  read: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  appliance: string;
  nextServiceDate: string;
}
