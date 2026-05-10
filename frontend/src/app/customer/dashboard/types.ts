export interface AnalysisResult {
  category: string;
  urgency: string;
  estimatedCostRange: string;
  summary: string;
  recommendedMaterials: string[];
  technicalTerms?: string[];
  serviceSpecs?: string;
}

export interface Technician {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: string;
  distance: string;
  online?: boolean;
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
