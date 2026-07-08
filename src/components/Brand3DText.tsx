import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';

export function Brand3DText({ className = '', light = false }: { className?: string, light?: boolean }) {
  const logoRef = useRef<HTMLAnchorElement>(null);
  const ambientRef = useRef<any>(null);

  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    const spans = el.querySelectorAll('span');

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -20; 
      const rotateY = ((x - centerX) / centerX) * 20;
      
      animate(spans, {
        rotateX: rotateX,
        rotateY: rotateY,
        translateZ: 30,
        duration: 300,
        ease: 'outQuart'
      });
    };

    const handleMouseLeave = () => {
      animate(spans, {
        rotateX: 0,
        rotateY: 0,
        translateZ: 0,
        duration: 800,
        ease: 'outElastic(1, .5)'
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    
    // Ambient floating 3D effect
    const ambient = animate(spans, {
      y: [0, -3, 0],
      rotateZ: [0, 1, -1, 0],
      duration: 4000,
      ease: 'inOutSine',
      loop: true,
      delay: stagger(200)
    });
    
    ambientRef.current = ambient;

    const handleMouseEnter = () => ambient.pause();
    const handleMouseLeaveAmbient = () => ambient.play();
    
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeaveAmbient);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeaveAmbient);
      ambient.pause();
    };
  }, []);

  return (
    <Link 
      to="/" 
      ref={logoRef}
      className={`flex items-baseline gap-3 group p-2 justify-center ${className}`}
      style={{ perspective: '800px' }}
    >
      <span className={`text-3xl md:text-5xl font-black tracking-widest transition-colors origin-center inline-block ${light ? 'text-white' : 'text-brandwood group-hover:text-coral-flame'}`} style={{ transformStyle: 'preserve-3d' }}>
        ARTHNEETI
      </span>
      <span className="text-xl md:text-3xl font-medium text-coral-flame tracking-widest origin-center inline-block" style={{ transformStyle: 'preserve-3d' }}>
        अर्थनीति
      </span>
    </Link>
  );
}
