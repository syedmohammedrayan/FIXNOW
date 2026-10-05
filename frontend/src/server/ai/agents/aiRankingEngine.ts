import { getSuccessPrediction } from './mlPrediction';
// cosineSimilarity measures semantic closeness between two embedding vectors (0-100 scale).
import { cosineSimilarity } from '@/app/utils/cosineSimilarity';

// Input bundle for ranking a single technician against a specific job request.
export interface RankingInput {
  technician: any;
  jobEmbedding: number[] | null;        // Vector representing the job description
  technicianEmbedding: number[] | null; // Vector representing the technician's skills
  distanceKm: number;
  customerBudget: number;
}

// Result produced for each technician — the UI uses totalScore to sort the list.
export interface RankingResult {
  technicianId: string;
  totalScore: number;    // 0-100 — the final composite score displayed to the customer
  xgbScore: number;      // 0-1 — ML model's predicted success probability
  skillMatch: number;    // 0-1 — cosine similarity between job and tech embeddings
  distanceScore: number; // 0-1 — proximity score (1 = same location, 0 = 20 km away)
  breakdown: any;        // Full per-factor breakdown for transparency
}

/**
 * Calculates a weighted composite score for a technician based on multiple signals.
 *
 * Scoring formula:
 *   (skill × 0.35 + distance × 0.20 + availability × 0.15 + rating × 0.15 + budget × 0.05 + ML × 0.10)
 *   × subscriptionPriorityMultiplier
 *
 * The priorityMultiplier gives paid-plan technicians a visibility boost, rewarding subscription upgrades.
 */
export const calculateTechnicianRank = async (input: RankingInput): Promise<RankingResult> => {
  const { technician, jobEmbedding, technicianEmbedding, distanceKm, customerBudget } = input;
  
  // 1. Skill Match (0-1): use semantic embedding similarity if available; default 0.5 if not.
  let skillMatch = 0.5;
  if (jobEmbedding && technicianEmbedding) {
    // cosineSimilarity returns 0-100, normalise to 0-1 for consistent weighting.
    skillMatch = cosineSimilarity(jobEmbedding, technicianEmbedding) / 100;
  }

  // 2. Distance Score: technicians within 20 km get a positive score; further is 0.
  const distanceScore = Math.max(0, 1 - distanceKm / 20);

  // 3. Availability: technician must be online to be considered at all.
  const availabilityScore = technician.online ? 1.0 : 0.0;

  // 4. Rating (0-1): normalise the 5-star rating to a 0-1 scale.
  const ratingScore = (technician.rating || 4.0) / 5.0;

  // 5. Budget Fit (0-1): how well the customer's budget covers the technician's base price.
  const techBasePrice = technician.basePrice || 500;
  const budgetRatio = customerBudget / techBasePrice;
  // Clamp at 1.0 so overpaying doesn't score higher than exact-match.
  const budgetFit = Math.min(1.0, Math.max(0, budgetRatio));

  // 6. ML Prediction: the XGBoost/FastAPI model predicts the probability of a successful booking.
  const experience = technician.experience || 2;
  const xgbScore = await getSuccessPrediction({
    skill_match: skillMatch,
    distance: distanceKm,
    rating: technician.rating || 4.0,
    experience,
    budget_fit: budgetFit
  });

  // Subscription multiplier: Pro plan gets 20% boost, Elite gets 50% — incentivises upgrades.
  let priorityMultiplier = 1.0;
  if (technician.subscriptionPlan === 'pro') priorityMultiplier = 1.2;
  if (technician.subscriptionPlan === 'elite') priorityMultiplier = 1.5;
  if (technician.subscriptionPlan === 'enterprise') priorityMultiplier = 1.5;

  // Weighted sum of all factors × subscription multiplier, capped at 1.0.
  const rawScore = (
    skillMatch * 0.35 +
    distanceScore * 0.20 +
    availabilityScore * 0.15 +
    ratingScore * 0.15 +
    budgetFit * 0.05 +
    xgbScore * 0.10
  );

  // Cap at 1.0 so the multiplier can't push it above 100%.
  let finalScore = Math.min(1.0, rawScore * priorityMultiplier);

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
