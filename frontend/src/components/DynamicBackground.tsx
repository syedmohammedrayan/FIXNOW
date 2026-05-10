'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ─── Image URLs (Using high-quality technician imagery) ───
const BACKGROUND_IMAGES = [
  'https://ik.imagekit.io/smr2007/technician_webp_1.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/indian_technician_2.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/indian_technician_3.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/indian_technician_4.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/indian_technician_5.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/indian_technician_6.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/electrician_switchboard_open.webp',
  'https://ik.imagekit.io/smr2007/carpenter_professional_lock.webp?tr=w-1920,q-80',
  'https://ik.imagekit.io/smr2007/indian_technician_8.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/indian_technician_9.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/washing_machine_technician.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/technician_webp_6.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/technician_webp_4.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/laptop_technician_home.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/technician_webp_5.webp?tr=q-80,f-webp',
  'https://ik.imagekit.io/smr2007/technician_webp_3.webp?tr=q-80,f-webp',
];

const SLIDE_DURATION = 6000;      // 6s per image for better appreciation
const TRANSITION_DURATION = 2000; // 2s smooth cinematic crossfade
const LERP_FACTOR = 0.05;        // Smoother cursor movement

export default function DynamicBackground() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);
  const animFrameId = useRef<number>(0);
  const currentSlide = useRef(0);
  const slideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const advanceSlide = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const slides = slider.querySelectorAll<HTMLDivElement>('.bg-slide');
    const current = currentSlide.current;
    const next = (current + 1) % BACKGROUND_IMAGES.length;

    const currentEl = slides[current];
    if (currentEl) {
      currentEl.style.opacity = '0';
      currentEl.style.transform = 'scale(1.05) rotate(0.02deg)';
    }

    const nextEl = slides[next];
    if (nextEl) {
      nextEl.style.opacity = '1';
      nextEl.style.transform = 'scale(1) rotate(0deg)';
    }

    currentSlide.current = next;
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      const slides = slider.querySelectorAll<HTMLDivElement>('.bg-slide');
      if (slides[0]) {
        slides[0].style.opacity = '1';
        slides[0].style.transform = 'scale(1)';
      }
    }
    slideTimer.current = setInterval(advanceSlide, SLIDE_DURATION);
    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [advanceSlide]);

  useEffect(() => {
    const animate = () => {
      smoothMouse.current.x += (mousePos.current.x - smoothMouse.current.x) * LERP_FACTOR;
      smoothMouse.current.y += (mousePos.current.y - smoothMouse.current.y) * LERP_FACTOR;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${smoothMouse.current.x - 300}px, ${smoothMouse.current.y - 300}px, 0)`;
      }

      const sy = scrollY.current;
      if (sliderRef.current) {
        const parallaxY = sy * -0.05;
        sliderRef.current.style.transform = `translate3d(0, ${parallaxY}px, 0)`;
      }

      if (overlayRef.current) {
        const maxScroll = 1000;
        const scrollRatio = Math.min(sy / maxScroll, 1);
        const blur = 2 + scrollRatio * 6; // 2px -> 8px (very subtle)
        overlayRef.current.style.backdropFilter = `blur(${blur}px)`;
        (overlayRef.current.style as any).webkitBackdropFilter = `blur(${blur}px)`;
        // Fully transparent background as requested
        overlayRef.current.style.backgroundColor = 'transparent';
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId.current);
  }, []);

  return (
    <>
      {/* ─── Layer 1: Background Image Slider (z-index: -2) ─── */}
      <div
        ref={sliderRef}
        className="dynamic-bg-slider"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          overflow: 'hidden',
          willChange: 'transform',
        }}
      >
        {BACKGROUND_IMAGES.map((src, i) => (
          <div
            key={i}
            className="bg-slide"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              opacity: 0,
              transform: 'scale(1.1)',
              transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${SLIDE_DURATION}ms linear`,
              willChange: 'opacity, transform',
            }}
          />
        ))}
      </div>

      {/* ─── Layer 2: 3D Glassmorphic Overlay (z-index: -1) ─── */}
      <div
        ref={overlayRef}
        className="dynamic-bg-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundColor: 'transparent', 
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          pointerEvents: 'none',
          willChange: 'backdrop-filter',
          // 3D Glass Depth: Inner glow and subtle vignette
          boxShadow: 'inset 0 0 100px rgba(255, 255, 255, 0.05), inset 0 0 40px rgba(255, 255, 255, 0.02)',
        }}
      />

      {/* ─── Layer 3: Premium Glass Glint (Diagonal Light Streak) ─── */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%, rgba(255,255,255,0.05) 100%)',
          opacity: 0.5,
        }}
      />

      {/* ─── Layer 4: High-End White Glow Cursor (z-index: 0) ─── */}
      <div
        ref={cursorRef}
        className="dynamic-bg-cursor hidden md:block"
        style={{
          position: 'fixed',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none',
          background: `radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            transparent 70%
          )`,
          willChange: 'transform',
          transform: 'translate3d(-400px, -400px, 0)',
          filter: 'blur(40px)',
        }}
      />

      {/* ─── Layer 5: Subtle Cinematic Texture ─── */}
      <div
        className="dynamic-bg-grain"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
    </>
  );
}
