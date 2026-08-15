import React, { useId } from 'react';

interface ShinyTextProps {
  text: string;
  speed?: number;
  delay?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
  direction?: 'left' | 'right';
  yoyo?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
  className?: string;
}

const shinyStyleInjected = typeof document !== 'undefined' ? (() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shinySweep {
      0% { background-position: 250% center; }
      100% { background-position: -250% center; }
    }
    @keyframes shinySweepReverse {
      0% { background-position: -250% center; }
      100% { background-position: 250% center; }
    }
  `;
  document.head.appendChild(style);
  return true;
})() : false;

const ShinyText = ({
  text,
  speed = 3,
  delay = 0,
  color = '#00875a',
  shineColor = '#00F59B',
  spread = 150,
  direction = 'left',
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
  className = '',
}: ShinyTextProps) => {
  const gradientDirection = direction === 'left' ? 'to right' : 'to left';
  const animationDuration = `${speed}s`;
  const animationDelay = `${delay}s`;
  const animationName = direction === 'left' ? 'shinySweep' : 'shinySweepReverse';

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        color: color,
        backgroundImage: disabled
          ? 'none'
          : `linear-gradient(${gradientDirection}, ${color} 0%, ${shineColor} 50%, ${color} 100%)`,
        backgroundSize: `${spread}% 100%`,
        backgroundRepeat: 'no-repeat',
        backgroundClip: disabled ? 'border-box' : 'text',
        WebkitBackgroundClip: disabled ? 'border-box' : 'text',
        WebkitTextFillColor: disabled ? color : 'transparent',
        animation: disabled
          ? 'none'
          : `${animationName} ${animationDuration} ${yoyo ? 'alternate' : 'normal'} linear infinite`,
        animationDelay: animationDelay,
        animationPlayState: pauseOnHover ? 'var(--play-state, running)' : 'running',
      }}
      onMouseEnter={(e) => {
        if (pauseOnHover) e.currentTarget.style.setProperty('--play-state', 'paused');
      }}
      onMouseLeave={(e) => {
        if (pauseOnHover) e.currentTarget.style.setProperty('--play-state', 'running');
      }}
    >
      <span className="relative z-10 pointer-events-none">{text}</span>
    </div>
  );
};

export default ShinyText;
