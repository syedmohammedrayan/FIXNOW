/**
 * cosineSimilarity — measures the angular similarity between two embedding vectors.
 *
 * Cosine similarity = (A · B) / (‖A‖ × ‖B‖)
 * A result of 1.0 means the vectors point in exactly the same direction (highly similar).
 * A result of 0.0 means they are orthogonal (unrelated).
 *
 * This is preferred over Euclidean distance for text embeddings because it ignores
 * magnitude — only the direction (semantic meaning) matters.
 *
 * Returns a 0-100 score (percentage) to make it human-readable in the ranking breakdown.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  // Guard against mismatched or empty vectors which would produce a divide-by-zero.
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0; // A · B (sum of element-wise products)
  let normA = 0;      // ‖A‖² (magnitude squared of vector A)
  let normB = 0;      // ‖B‖² (magnitude squared of vector B)
  
  // Single-pass loop for efficiency — computes all three values simultaneously.
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  // Prevent division by zero if either vector is a zero vector.
  if (normA === 0 || normB === 0) return 0;
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  
  // Clamp to 0-100 to handle floating-point rounding that could push beyond the range.
  return Math.max(0, Math.min(100, similarity * 100));
};
