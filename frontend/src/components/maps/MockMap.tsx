'use client';

import React, { useEffect, useRef } from 'react';

interface MockMapProps {
  techLocation: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  className?: string;
}

export default function MockMap({ techLocation, customerLocation, className = '' }: MockMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const custLoc = customerLocation || { lat: 37.7749, lng: -122.4194 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark map background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines (roads)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Draw main roads
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.4);
    ctx.lineTo(w, h * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.6, 0);
    ctx.lineTo(w * 0.6, h);
    ctx.stroke();

    // Map coordinates to canvas
    const latRange = { min: 37.765, max: 37.785 };
    const lngRange = { min: -122.430, max: -122.410 };

    const mapX = (lng: number) => ((lng - lngRange.min) / (lngRange.max - lngRange.min)) * w;
    const mapY = (lat: number) => h - ((lat - latRange.min) / (latRange.max - latRange.min)) * h;

    const techX = mapX(techLocation.lng);
    const techY = mapY(techLocation.lat);
    const custX = mapX(custLoc.lng);
    const custY = mapY(custLoc.lat);

    // Draw route line
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(techX, techY);
    ctx.lineTo(custX, custY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Customer location (blue pulse)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.arc(custX, custY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(custX, custY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Technician location (violet)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.beginPath();
    ctx.arc(techX, techY, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(techX, techY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('📍 You', custX + 14, custY + 4);
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('🔧 Technician', techX + 14, techY + 4);

  }, [techLocation, custLoc.lat, custLoc.lng]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-700 ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full h-full"
        style={{ imageRendering: 'auto' }}
      />
      {/* Map overlay gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/60 to-transparent" />
    </div>
  );
}
