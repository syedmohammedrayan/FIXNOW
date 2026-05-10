"use client";
import React from "react";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "This AI marketplace revolutionized our operations, connecting us with top technicians seamlessly. The cloud-based platform keeps us completely productive.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
    name: "Briana Patton",
    role: "Operations Manager",
  },
  {
    text: "Implementing this was smooth and quick. The stunning, user-friendly interface made team adoption effortless.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces",
    name: "Bilal Ahmed",
    role: "IT Manager",
  },
  {
    text: "The AI agent is exceptional, guiding us through setup and providing ongoing real-time assistance, ensuring our complete satisfaction.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces",
    name: "Saman Malik",
    role: "Customer Support Lead",
  },
  {
    text: "This platform's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive glowing interface.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    name: "Omar Raza",
    role: "CEO",
  },
  {
    text: "Its robust features and quick support have transformed our workflow, making our technicians significantly more efficient.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    name: "Zainab Hussain",
    role: "Project Manager",
  },
  {
    text: "The smooth implementation exceeded expectations. It streamlined matching processes, improving overall business performance.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    name: "Aliza Khan",
    role: "Business Analyst",
  },
  {
    text: "Our business functions improved with a user-friendly design and glowing customer feedback.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    name: "Farhan Siddiqui",
    role: "Marketing Director",
  },
  {
    text: "They delivered an AI solution that exceeded expectations, perfectly predicting our needs and enhancing our operations.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    name: "Sana Sheikh",
    role: "Sales Manager",
  },
  {
    text: "Using this marketplace, our online presence and repair conversions significantly improved, boosting business performance.",
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
    <section className="bg-indigo-950/30 backdrop-blur-xl my-20 relative px-4 py-16 rounded-3xl overflow-hidden border border-indigo-500/30 shadow-[0_10px_40px_-15px_rgba(79,70,229,0.3)] max-w-7xl mx-auto">
      <div className="container z-10 mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="flex justify-center">
            <div className="border border-indigo-500/40 bg-indigo-950/60 text-indigo-200 font-bold text-sm tracking-widest uppercase py-1 px-4 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-5 glow-heading text-white">
            What our users say
          </h2>
          <p className="text-center mt-5 text-indigo-100/80 font-bold text-lg max-w-md">
            See how the <span className="notranslate">FixNow</span> AI Platform has transformed operations for managers and technicians alike.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-16 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
