'use client';

import React from "react";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "This ecosystem revolutionized our operations, connecting us with top technicians. The glassmorphic interface is stunning and professional.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
    name: "Briana Patton",
    role: "Operations Manager",
  },
  {
    text: "Implementation was seamless. The high-contrast UI made team adoption effortless. Truly a premium experience.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces",
    name: "Bilal Ahmed",
    role: "IT Manager",
  },
  {
    text: "The AI integration is exceptional, providing real-time assistance and ensuring our complete satisfaction.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces",
    name: "Saman Malik",
    role: "Customer Support Lead",
  },
  {
    text: "This platform's lucid design enhanced our business efficiency. Highly recommend for its intuitive terminal-style interface.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    name: "Omar Raza",
    role: "CEO",
  },
  {
    text: "Robust features and quick support have transformed our workflow, making our technicians significantly more efficient.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    name: "Zainab Hussain",
    role: "Project Manager",
  },
  {
    text: "Exceeded expectations. It streamlined matching processes, improving overall business performance through precision logistics.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    name: "Aliza Khan",
    role: "Business Analyst",
  },
  {
    text: "Our business functions improved with a user-friendly design and glowing customer feedback across all nodes.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    name: "Farhan Siddiqui",
    role: "Marketing Director",
  },
  {
    text: "They delivered a solution that perfectly predicts our needs and enhances our operations through smart routing.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    name: "Sana Sheikh",
    role: "Sales Manager",
  },
  {
    text: "Online presence and repair conversions significantly improved, boosting business performance via the White Glass identity.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces",
    name: "Hassan Ali",
    role: "Logistics Manager",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials = () => {
  return (
    <section className="bg-white/40 backdrop-blur-3xl my-32 relative px-4 py-20 rounded-[3rem] overflow-hidden border border-white/60 shadow-2xl max-w-7xl mx-auto">
      <div className="container z-10 mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="flex justify-center">
            <div className="border border-slate-950/20 bg-slate-950/5 text-slate-950 font-black text-[10px] tracking-[0.3em] uppercase py-2 px-6 rounded-full shadow-inner">
              Testimonials Protocol
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mt-8 text-slate-950 uppercase italic">
            User Feedback.
          </h2>
          <p className="text-center mt-6 text-slate-600 font-bold text-lg max-w-md uppercase tracking-tight">
            See how the <span className="notranslate text-slate-950">FixNow</span> ecosystem has transformed operations.
          </p>
        </motion.div>

        <div className="flex justify-center gap-8 mt-20 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[800px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={20} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={24} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={22} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
