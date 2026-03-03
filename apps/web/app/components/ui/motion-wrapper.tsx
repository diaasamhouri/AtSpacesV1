"use client";

import { motion, Variants } from "framer-motion";

interface MotionWrapperProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  type?: "fade-up" | "fade-in" | "scale-up";
  /** Use true for above-the-fold content so it animates on mount instead of on scroll */
  immediate?: boolean;
}

export function MotionWrapper({ children, delay = 0, className = "", type = "fade-up", immediate = false }: MotionWrapperProps) {
  const variants: Record<string, Variants> = {
    "fade-up": {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as any } },
    },
    "fade-in": {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5, delay, ease: "easeOut" } },
    },
    "scale-up": {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay, ease: [0.175, 0.885, 0.32, 1.275] as any } },
    },
  };

  if (immediate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants[type]}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants[type]}
      className={className}
    >
      {children}
    </motion.div>
  );
}
