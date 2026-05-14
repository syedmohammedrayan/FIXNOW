"use client";
import React from "react";
import { motion } from "framer-motion";

export type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
  city?: string;
  category?: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-8 pb-8 bg-transparent"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role, city, category }, i) => (
                <div 
                  className="p-10 rounded-[2.5rem] border border-white/60 shadow-xl max-w-xs w-full bg-white/40 backdrop-blur-3xl hover:bg-white/60 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group" 
                  key={i}
                >
                  <div className="text-slate-700 font-bold text-sm leading-relaxed italic">"{text}"</div>
                  <div className="flex items-center gap-4 mt-8">
                    <div className="relative p-1 rounded-full border border-slate-950/10 bg-white/20">
                      <img
                        width={48}
                        height={48}
                        src={image}
                        alt={name}
                        className="h-12 w-12 rounded-full object-cover shadow-sm transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="font-black text-slate-950 tracking-tighter uppercase text-sm">{name}</div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <div className="text-cyan-700 text-[9px] font-black uppercase tracking-widest">{category || role}</div>
                        {city && <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest opacity-60">• {city}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
