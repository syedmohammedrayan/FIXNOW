import { getSuccessPrediction } from './mlPrediction';
import { cosineSimilarity } from '@/app/utils/cosineSimilarity';

export interface RankingInput {
  technician: any;
  jobEmbedding: number[] | null;
  technicianEmbedding: number[] | null;
  distanceKm: number;
  customerBudget: number;
}

export interface RankingResult {
  technicianId: string;
  totalScore: number; // 0-100
  xgbScore: number;   // 0-1
  skillMatch: number; // 0-1
  distanceScore: number; // 0-1
  breakdown: any;
}

export const calculateTechnicianRank = async (input: RankingInput): Promise<RankingResult> => {
  const { technician, jobEmbedding, technicianEmbedding, distanceKm, customerBudget } = input;
  
  // 1. Skill Match (0-1) using Embeddings or fallback category match
  let skillMatch = 0.5;
  if (jobEmbedding && technicianEmbedding) {
    skillMatch = cosineSimilarity(jobEmbedding, technicianEmbedding) / 100;
  }

  // 2. Distance Score (closer is better, max 20km penalty)
  const distanceScore = Math.max(0, 1 - distanceKm / 20);

  // 3. Availability
  const availabilityScore = technician.online ? 1.0 : 0.0;

  // 4. Rating (0-1)
  const ratingScore = (technician.rating || 4.0) / 5.0;

  // 5. Budget Fit (0-1)
  const techBasePrice = technician.basePrice || 500;
  const budgetRatio = customerBudget / techBasePrice;
  // If budget covers it, 1.0. If budget is less, scales down
  const budgetFit = Math.min(1.0, Math.max(0, budgetRatio));

  // 6. ML Prediction
  const experience = technician.experience || 2;
  const xgbScore = await getSuccessPrediction({
    skill_match: skillMatch,
    distance: distanceKm,
    rating: technician.rating || 4.0,
    experience,
    budget_fit: budgetFit
  });

  // Calculate Subscription Multiplier (from Phase 16 specs)
  let priorityMultiplier = 1.0;
  if (technician.subscriptionPlan === 'pro') priorityMultiplier = 1.2;
  if (technician.subscriptionPlan === 'elite') priorityMultiplier = 1.5;
  if (technician.subscriptionPlan === 'enterprise') priorityMultiplier = 1.5;

  // Formula:
  // (skill*0.35 + dist*0.20 + avail*0.15 + rating*0.15 + budget*0.05 + xgb*0.10) * priorityMultiplier
  
  const rawScore = (
    skillMatch * 0.35 +
    distanceScore * 0.20 +
    availabilityScore * 0.15 +
    ratingScore * 0.15 +
    budgetFit * 0.05 +
    xgbScore * 0.10
  );

  let finalScore = rawScore * priorityMultiplier;
  
  // Cap at 1.0 (100%)
  finalScore = Math.min(1.0, finalScore);

  return {
    technicianId: technician.uid || technician.id,
    totalScore: finalScore,
    xgbScore,
    skillMatch,
    distanceScore,
    breakdown: {
      skillMatch,
      distanceScore,
      availabilityScore,
      ratingScore,
      budgetFit,
      xgbScore,
      priorityMultiplier
    }
  };
};
