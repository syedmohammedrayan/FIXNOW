import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Loader2, CheckCircle } from 'lucide-react';
import { transcribeAudio } from '@/server/ai/agents/voiceProcessingService';

export default function VoiceRecorder({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        
        setIsProcessing(true);
        const text = await transcribeAudio(audioBlob);
        setIsProcessing(false);
        
        if (text) {
          setSuccess(true);
          onTranscribed(text);
          setTimeout(() => setSuccess(false), 3000);
        }
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSuccess(false);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Microphone access required for voice requests.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl relative overflow-hidden group">
      {/* Background Pulse if recording */}
      {isRecording && (
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-rose-500/20 rounded-full blur-2xl z-0"
        />
      )}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)] text-white hover:bg-rose-600' 
            : isProcessing 
              ? 'bg-slate-800 text-slate-400' 
              : success 
                ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] text-white'
                : 'bg-white text-slate-950 hover:bg-slate-100 shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95'
        }`}
      >
        {isRecording ? (
          <Square className="w-8 h-8 fill-current" />
        ) : isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : success ? (
          <CheckCircle className="w-8 h-8" />
        ) : (
          <Mic className="w-10 h-10" />
        )}
      </button>

      <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] relative z-10 text-center">
        {isRecording ? 'Listening... Tap to stop' : isProcessing ? 'Processing Audio Protocol...' : success ? 'Voice Transcribed' : 'Tap to Speak'}
      </p>
      
      {!isRecording && !isProcessing && !success && (
        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
          Supports English, Hindi, Telugu, Tamil, etc.
        </p>
      )}
    </div>
  );
}
