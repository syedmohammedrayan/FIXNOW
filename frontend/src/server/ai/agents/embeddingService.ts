// API_BASE points to the Express backend that proxies the Gemini embedding API server-side.
import { API_BASE } from '@/lib/config';
// Client Firestore is used to cache embeddings so we don't re-generate on every ranking call.
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Returns a technician's skill embedding vector, generating and caching it if not already stored.
 * Caching in Firestore avoids paying for repeated embedding API calls for the same technician.
 *
 * @param forceRegenerate - Set to true when a technician updates their profile/skills.
 */
export const getOrGenerateEmbedding = async (
  technicianId: string, 
  skillsText: string, 
  forceRegenerate: boolean = false
): Promise<number[] | null> => {
  if (!forceRegenerate) {
    // Check the Firestore cache first — avoids an API call if the embedding already exists.
    const docRef = await getDoc(doc(db, 'technician_embeddings', technicianId));
    if (docRef.exists() && docRef.data().embedding) {
      return docRef.data().embedding;
    }
  }

  // Cache miss (or forced regeneration) — call the backend proxy to generate a new embedding.
  // The backend proxy is needed because the Gemini API key must stay server-side.
  try {
    const res = await fetch(`${API_BASE}/api/ai/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: skillsText })
    });
    const data = await res.json();
    if (data.success && data.embedding) {
      // Persist the new embedding to Firestore so future calls use the cache.
      await setDoc(doc(db, 'technician_embeddings', technicianId), {
        technicianId,
        embedding: data.embedding,
        embeddingType: "gemini-text-embedding-004",
        updatedAt: serverTimestamp()
      });
      return data.embedding;
    }
  } catch (err) {
    console.error("Embedding generation failed:", err);
  }
  // Return null on failure — the ranking engine falls back to the default 0.5 skill score.
  return null;
};

/**
 * Generates a fresh embedding for the job description every time it's called.
 * Not cached because each job description is unique and arrives with every booking request.
 */
export const getJobEmbedding = async (jobDescription: string): Promise<number[] | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: jobDescription })
    });
    const data = await res.json();
    if (data.success) return data.embedding;
  } catch (err) {
    console.error("Job embedding generation failed:", err);
  }
  return null;
};
