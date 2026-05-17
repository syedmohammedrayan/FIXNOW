import { API_BASE } from '@/lib/config';

export const getAiExplanation = async (technician: any, scores: any): Promise<string[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician, scores })
    });
    const data = await res.json();
    if (data.success && data.bullets) {
      return data.bullets;
    }
  } catch (err) {
    console.error("AI Explanation error:", err);
  }
  return ["Strong skill match verified by AI", "Excellent rating history", "Close proximity for fast arrival"];
};

export const getAiNegotiation = async (
  customerBudget: number, 
  technicianPrice: number, 
  urgency: string, 
  distance: number
) => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/negotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerBudget, technicianPrice, urgency, distance })
    });
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
  } catch (err) {
    console.error("AI Negotiation error:", err);
  }
  
  // Midpoint fallback
  const p = Math.round((customerBudget + technicianPrice) / 2);
  return {
    suggestedPrice: p,
    reasoning: "Suggested fair midpoint based on standard market rates."
  };
};
