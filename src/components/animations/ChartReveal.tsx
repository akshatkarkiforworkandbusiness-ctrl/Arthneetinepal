import React from 'react';
import { motion } from 'framer-motion';

interface ChartRevealProps {
  children: React.ReactNode;
  className?: string;
}

export function ChartReveal({ children, className }: ChartRevealProps) {
  return (
    <svg className={className} width="100%" height="100%" preserveAspectRatio="none">
      <motion.g
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {children}
      </motion.g>
    </svg>
  );
}
