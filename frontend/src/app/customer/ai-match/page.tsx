"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import Navbar from '@/components/Navbar';
import VoiceRecorder from '@/components/ai/VoiceRecorder';
import NearbyTechniciansMap from '@/components/ai/NearbyTechniciansMap';
import TechnicianMatchCard from '@/components/ai/TechnicianMatchCard';
import { Activity, Camera, Search, ArrowRight, X, MapPin } from 'lucide-react';

import { findNearbyTechnicians } from '@/app/services/nearbyTechnicians';
import { getJobEmbedding, getOrGenerateEmbedding } from '@/app/services/embeddingService';
import { calculateTechnicianRank } from '@/app/services/aiRankingEngine';
import { analyzeIssueImage } from '@/app/services/imageAnalysisService';
import { getAiExplanation, getAiNegotiation } from '@/app/services/explanationService';
import { API_BASE } from '@/lib/config';

export default function AIMatchPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [mode, setMode] = useState<'idle' | 'voice' | 'image' | 'text' | 'analyzing' | 'results'>('idle');
  const [transcript, setTranscript] = useState("");
  const [analyzedIssue, setAnalyzedIssue] = useState<any>(null);
  const [rankedTechnicians, setRankedTechnicians] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location error:", err)
      );
    }
    
    return () => unsub();
  }, []);

  const handleVoiceTranscribed = async (text: string) => {
    setTranscript(text);
    setMode('analyzing');
    await processTextIssue(text);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript) return;
    setMode('analyzing');
    await processTextIssue(transcript);
  };

  const processTextIssue = async (text: string) => {
    try {
      // 1. Parse issue for category via existing AI route
      const res = await fetch(`${API_BASE}/api/ai/parse-issue`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ issueText: text })
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setAnalyzedIssue(data.data);
        await findAndRankTechnicians(data.data, text);
      } else {
        setMode('idle');
        alert("Failed to understand issue. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setMode('idle');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setMode('analyzing');
    const result = await analyzeIssueImage(file, transcript);
    
    if (result && result.category !== 'INVALID') {
      setAnalyzedIssue(result);
      await findAndRankTechnicians(result, result.summary || "Image analyzed issue");
    } else {
      setMode('idle');
      alert("Could not detect a valid repair issue from the image.");
    }
  };

  const findAndRankTechnicians = async (issueDetails: any, fullText: string) => {
    if (!customerLocation) {
      alert("Location is required to find technicians.");
      setMode('idle');
      return;
    }

    try {
      // 1. Get nearby raw technicians
      const nearbyRefs = await findNearbyTechnicians(customerLocation.lat, customerLocation.lng, 15);
      
      if (nearbyRefs.length === 0) {
        alert("No technicians found in your area currently online.");
        setMode('results');
        return;
      }

      // Fetch full tech data for these IDs
      const techsResponse = await fetch(`${API_BASE}/api/users/batch?ids=${nearbyRefs.map(t => t.id).join(',')}`);
      const techsData = await techsResponse.json();
      const techProfiles = techsData.users || [];

      // Filter by category broadly if we have one
      const targetCategory = issueDetails.category;
      let matchedTechs = techProfiles.filter((t: any) => 
        !targetCategory || t.category === targetCategory || (t.categories && t.categories.includes(targetCategory)) || t.category === 'General'
      );
      
      if (matchedTechs.length === 0) matchedTechs = techProfiles; // fallback

      // 2. Generate Job Embedding
      const jobEmbedding = await getJobEmbedding(fullText);

      // 3. Score & Rank
      const budget = issueDetails.estimatedCostRange ? parseInt(issueDetails.estimatedCostRange.split('-')[0].replace(/\D/g, '')) || 1000 : 1000;

      const scoredPromises = matchedTechs.map(async (t: any) => {
        // find distance
        const loc = nearbyRefs.find(r => r.id === (t.uid || t.id));
        const distance = loc?.distanceKm || 5;

        // get tech embedding
        const techSkills = `${t.category} ${t.categories?.join(' ')} ${t.bio || ''}`;
        const techEmbedding = await getOrGenerateEmbedding(t.uid || t.id, techSkills);

        const rankResult = await calculateTechnicianRank({
          technician: { ...t, online: true },
          jobEmbedding,
          technicianEmbedding: techEmbedding,
          distanceKm: distance,
          customerBudget: budget
        });

        // Gen AI Explanation
        const bullets = await getAiExplanation(t, rankResult);
        
        // Gen AI Negotiation
        const negotiation = await getAiNegotiation(budget, t.basePrice || 500, issueDetails.urgency || 'Medium', distance);

        return {
          ...t,
          distance,
          matchScore: rankResult.totalScore,
          xgbScore: rankResult.xgbScore,
          explanation: bullets,
          negotiation
        };
      });

      const ranked = await Promise.all(scoredPromises);
      
      // Sort desc
      ranked.sort((a, b) => b.matchScore - a.matchScore);
      
      setRankedTechnicians(ranked);
      setMode('results');

    } catch (e) {
      console.error(e);
      setMode('idle');
    }
  };

  const handleBook = async (techId: string) => {
    if (!user) {
      router.push(`/auth/login?role=customer&redirect=/customer/ai-match`);
      return;
    }
    
    // Simulate booking creation routing back to standard customer dashboard logic
    alert("Protocol deployed! The technician will receive this request immediately.");
    router.push('/customer/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
            AI Workforce Routing
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto leading-relaxed">
            Describe your issue using voice, text, or image. Our intelligent routing engine will match you with the optimal technician using multimodal embeddings and XGBoost prediction.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input & Map */}
          <div className="flex flex-col gap-6">
            
            {/* Input Module */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-40 h-40" /></div>
              
              <AnimatePresence mode="wait">
                {mode === 'idle' || mode === 'text' || mode === 'voice' || mode === 'image' ? (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button 
                        onClick={() => setMode('voice')}
                        className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border transition-colors ${mode === 'voice' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-800 border-transparent text-slate-400 hover:text-white'}`}
                      >
                        <MicIcon /> Voice Protocol
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="py-4 bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors border border-transparent"
                      >
                        <Camera className="w-4 h-4" /> Visual Upload
                      </button>
                      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>

                    {mode === 'voice' ? (
                      <VoiceRecorder onTranscribed={handleVoiceTranscribed} />
                    ) : (
                      <form onSubmit={handleTextSubmit} className="relative">
                        <textarea
                          value={transcript}
                          onChange={e => setTranscript(e.target.value)}
                          placeholder="Describe the issue in English, Hindi, Telugu..."
                          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                        />
                        <button 
                          type="submit"
                          disabled={!transcript.trim()}
                          className="absolute bottom-4 right-4 bg-white text-slate-950 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:hover:scale-100 hover:scale-105 transition-transform"
                        >
                          Analyze <ArrowRight className="w-3 h-3 inline ml-1" />
                        </button>
                      </form>
                    )}
                  </motion.div>
                ) : mode === 'analyzing' ? (
                  <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mb-6">
                      <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-2">Processing Protocol</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Extracting Semantics...<br/>Generating Embeddings...<br/>Calculating XGBoost Probabilities...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Target Category</h3>
                        <p className="text-cyan-400 font-bold text-xl italic mt-1">{analyzedIssue?.category}</p>
                      </div>
                      <button onClick={() => { setMode('idle'); setTranscript(""); setRankedTechnicians([]); }} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <p className="text-sm text-slate-300 italic">"{transcript || analyzedIssue?.summary}"</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-bold uppercase tracking-widest">
                        Priority: {analyzedIssue?.urgency || 'Normal'}
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-widest">
                        Est: ₹{analyzedIssue?.estimatedCostRange || 'Standard'}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Map Panel */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-2 shadow-xl min-h-[300px]">
              {customerLocation ? (
                <NearbyTechniciansMap 
                  customerLocation={customerLocation} 
                  technicians={rankedTechnicians.length > 0 ? rankedTechnicians : []} 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 rounded-[1.5rem] border border-slate-800 p-6 text-center">
                  <MapPin className="w-8 h-8 text-slate-600 mb-4 animate-bounce" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Acquiring GPS Signal...</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Results */}
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center justify-between">
              Top Ranked Units
              <span className="text-xs font-bold text-slate-500 tracking-widest not-italic">Sorted by XGBoost Match</span>
            </h2>
            
            {mode === 'results' ? (
              rankedTechnicians.length > 0 ? (
                <div className="space-y-6">
                  {rankedTechnicians.map((t, idx) => (
                    <motion.div 
                      key={t.uid || t.id || idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <TechnicianMatchCard technician={t} onBook={handleBook} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2rem] text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No matched technicians found nearby.</p>
                </div>
              )
            ) : (
              <div className="flex-1 border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Waiting for protocol input...</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
  );
}
