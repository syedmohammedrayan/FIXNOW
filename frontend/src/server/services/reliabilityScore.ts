import { db } from '@/lib/firebase';
import { doc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';

export const calculateAndSaveReliabilityScore = async (technicianId: string) => {
  try {
    // 1. Fetch performance history
    const q = query(
      collection(db, 'technician_performance'),
      where('technicianId', '==', technicianId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    let totalJobs = 0;
    let successCount = 0;
    let onTimeCount = 0;
    let totalRating = 0;
    let ratedJobs = 0;
    let cancelCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalJobs++;
      if (data.customerSatisfied) successCount++;
      if (data.completedOnTime) onTimeCount++;
      if (data.cancelled) cancelCount++;
      if (data.ratingReceived) {
        totalRating += data.ratingReceived;
        ratedJobs++;
      }
    });
    
    if (totalJobs === 0) return;
    
    const successRate = successCount / totalJobs;
    const onTimeRate = onTimeCount / totalJobs;
    const lowCancellation = Math.max(0, 1 - (cancelCount / totalJobs));
    
    // Scale rating to 0-1
    const avgRating = ratedJobs > 0 ? (totalRating / ratedJobs) / 5.0 : 0.8; // default to 0.8 if no ratings
    
    // Formula
    const reliability = (
      successRate * 0.4 +
      avgRating * 0.3 +
      onTimeRate * 0.2 +
      lowCancellation * 0.1
    );
    
    // Save to technician profile
    const techRef = doc(db, 'technicians', technicianId);
    await updateDoc(techRef, {
      reliabilityScore: reliability,
      reliabilityMetrics: {
        successRate,
        avgRating: avgRating * 5.0,
        onTimeRate,
        cancellationRate: cancelCount / totalJobs,
        totalCompleted: totalJobs
      }
    });
    
    console.log(`Reliability updated for ${technicianId}: ${reliability.toFixed(2)}`);
  } catch (err) {
    console.error("Failed to calculate reliability:", err);
  }
};
