import axios from 'axios';

// Fast API runs on 8000
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

export interface MLPredictionInput {
  skill_match: number; // 0-1
  distance: number; // km
  rating: number; // 0-5
  experience: number; // years
  budget_fit: number; // 0-1
}

export const getSuccessPrediction = async (features: MLPredictionInput): Promise<number> => {
  try {
    const res = await axios.post(`${ML_API_URL}/predict`, features);
    if (res.data && typeof res.data.success_probability === 'number') {
      return res.data.success_probability;
    }
  } catch (err) {
    console.warn("ML prediction failed, using fallback heuristic:", err);
  }
  // Fallback heuristic if ML fails
  return (
    features.skill_match * 0.4 +
    Math.max(0, 1 - features.distance / 20) * 0.2 +
    (features.rating / 5.0) * 0.25 +
    Math.min(features.experience / 10, 1) * 0.1 +
    features.budget_fit * 0.05
  );
};
