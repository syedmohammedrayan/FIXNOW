import { API_BASE } from '@/lib/config';

export interface ImageAnalysisResult {
  category: string;
  urgency: string;
  problem: string;
  solution: string;
  priceEstimate: string;
  estimatedCostRange: string;
  materials: string[];
  summary: string;
}

export const analyzeIssueImage = async (
  imageBlob: Blob, 
  userText: string = ""
): Promise<ImageAnalysisResult | null> => {
  const formData = new FormData();
  formData.append('image', imageBlob, 'issue.jpg');
  formData.append('userText', userText);

  try {
    const res = await fetch(`${API_BASE}/api/ai/analyze-image`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
  } catch (err) {
    console.error("Image analysis service error:", err);
  }
  return null;
};
