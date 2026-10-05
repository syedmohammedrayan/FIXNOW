import axios from 'axios';

// FastAPI ML server URL — runs separately from the Express backend on port 8000.
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

// Input features fed to the XGBoost model for success probability prediction.
export interface MLPredictionInput {
  skill_match: number;  // 0-1 — cosine similarity between job and technician embeddings
  distance: number;     // km — how far the technician is from the customer
  rating: number;       // 0-5 — technician's average customer rating
  experience: number;   // years — years of professional experience
  budget_fit: number;   // 0-1 — how well the customer's budget matches the technician's price
}

/**
 * Calls the Python FastAPI ML server to get the probability that this technician
 * will successfully complete the job. Returns a 0-1 probability score.
 *
 * Falls back to a simple weighted heuristic if the ML server is unreachable —
 * this means ranking still works in demo mode without the Python service running.
 */
export const getSuccessPrediction = async (features: MLPredictionInput): Promise<number> => {
  try {
    const res = await axios.post(`${ML_API_URL}/predict`, features);
    if (res.data && typeof res.data.success_probability === 'number') {
      return res.data.success_probability;
    }
  } catch (err) {
    console.warn("ML prediction failed, using fallback heuristic:", err);
  }
  // Heuristic fallback: mirrors the ML model's feature weights approximately.
  // Skill match carries the most weight (40%) since it's the strongest signal.
  return (
    features.skill_match * 0.4 +
    Math.max(0, 1 - features.distance / 20) * 0.2 +
    (features.rating / 5.0) * 0.25 +
    Math.min(features.experience / 10, 1) * 0.1 +  // Cap experience contribution at 10 years
    features.budget_fit * 0.05
  );
};
