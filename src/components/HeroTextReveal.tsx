import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useReducedMotion } from 'motion/react';

gsap.registerPlugin(SplitText);

interface HeroTextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function HeroTextReveal({ children, className = '', delay = 0 }: HeroTextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;

    const ctx = gsap.context(() => {
      const split = new SplitText(ref.current!, {
        type: 'chars,words',
        charsClass: 'hero-char',
        wordsClass: 'hero-word',
      });

      gsap.from(split.chars, {
        opacity: 0,
        y: 20,
        rotateX: -40,
        stagger: 0.02,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay,
      });
    }, ref);

    return () => ctx.revert();
  }, [reduce, delay]);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
