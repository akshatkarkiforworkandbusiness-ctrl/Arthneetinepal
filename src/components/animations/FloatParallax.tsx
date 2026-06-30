import React, { useRef } from 'react';
import { motion, useScroll, useTransform, HTMLMotionProps } from 'framer-motion';

interface FloatParallaxProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export function FloatParallax({ children, offset = 50, className, ...props }: FloatParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className} {...props}>
      {children}
    </motion.div>
  );
}
