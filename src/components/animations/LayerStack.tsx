import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface LayerStackProps extends HTMLMotionProps<"div"> {
  index: number;
  children: React.ReactNode;
  className?: string;
}

export function LayerStack({ index, children, className, ...props }: LayerStackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
