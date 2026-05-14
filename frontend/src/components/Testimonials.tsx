'use client';

import React from "react";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Got my AC fixed within 2 hours of raising a complaint. The technician was professional and the live tracking was incredibly accurate.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
    name: "Priya Sharma",
    role: "Homeowner",
    city: "Mumbai",
    category: "HVAC / AC"
  },
  {
    text: "The best part about FixNow is the transparency. I knew exactly how much I'd pay before the electrician even arrived. No hidden costs.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces",
    name: "Arjun Mehta",
    role: "Apartment Resident",
    city: "Bangalore",
    category: "Electrician"
  },
  {
    text: "Raised a complaint for a leaky pipe late at night. A plumber was at my doorstep by 8 AM the next morning. Exceptional service!",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces",
    name: "Sneha Reddy",
    role: "Working Professional",
    city: "Hyderabad",
    category: "Plumbing"
  },
  {
    text: "Very intuitive app. I could send photos of my broken washing machine directly to the tech. He came prepared with the right parts.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    name: "Rahul Verma",
    role: "Small Business Owner",
    city: "Delhi",
    category: "Appliances"
  },
  {
    text: "Used FixNow for pest control. The process was seamless from booking to feedback. Highly recommend for any home service.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    name: "Ananya Iyer",
    role: "Tech Professional",
    city: "Chennai",
    category: "Pest Control"
  },
  {
    text: "The technician was very skilled and polite. The app's interface makes it so easy to manage multiple service requests.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    name: "Vikram Singh",
    role: "Retired Officer",
    city: "Pune",
    category: "Carpentry"
  }
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(0, 3); // Fallback for third column if needed, or remove it

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
