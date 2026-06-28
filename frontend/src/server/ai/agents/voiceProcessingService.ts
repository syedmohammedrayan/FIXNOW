import { API_BASE } from '@/lib/config';

export const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  try {
    const res = await fetch(`${API_BASE}/api/ai/transcribe`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.text) {
      return data.text;
    }
  } catch (err) {
    console.error("Transcription service error:", err);
  }
  return null;
};
