import { API_BASE } from '@/lib/config';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const getOrGenerateEmbedding = async (
  technicianId: string, 
  skillsText: string, 
  forceRegenerate: boolean = false
): Promise<number[] | null> => {
  if (!forceRegenerate) {
    const docRef = await getDoc(doc(db, 'technician_embeddings', technicianId));
    if (docRef.exists() && docRef.data().embedding) {
      return docRef.data().embedding;
    }
  }

  // Generate via backend proxy
  try {
    const res = await fetch(`${API_BASE}/api/ai/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: skillsText })
    });
    const data = await res.json();
    if (data.success && data.embedding) {
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
  return null;
};

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
