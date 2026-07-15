import { Variants } from 'motion/react';

// Standardized easing curve: smooth, executive, financial-grade (no bouncy overshoot)
export const EASE_EMERALD = [0.25, 0.1, 0.25, 1.0];

// Shared Framer Motion Variants with reduced motion fallbacks built-in
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: EASE_EMERALD 
    }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4, ease: EASE_EMERALD }
  }
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: EASE_EMERALD 
    }
  }
};

export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 24 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5, 
      ease: EASE_EMERALD 
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

// Reduced motion variant overrides
export const getAccessibleVariant = (variant: Variants, prefersReducedMotion: boolean): Variants => {
  if (!prefersReducedMotion) return variant;
  return {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.2 } 
    }
  };
};
