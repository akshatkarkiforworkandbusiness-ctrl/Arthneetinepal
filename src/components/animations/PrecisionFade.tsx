import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PrecisionFadeProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export function PrecisionFade({ delay = 0, children, className, ...props }: PrecisionFadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
