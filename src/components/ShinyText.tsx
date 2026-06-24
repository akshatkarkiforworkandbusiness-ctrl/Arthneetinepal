import React from 'react';

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

const ShinyText = ({
  text,
  speed = 2,
  delay = 0,
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  direction = 'left',
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
  className = '',
}: ShinyTextProps) => {
  const gradientDirection = direction === 'left' ? 'to right' : 'to left';
  const animationDuration = `${speed}s`;
  const animationDelay = `${delay}s`;

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
          : `shine ${animationDuration} ${yoyo ? 'alternate' : 'normal'} linear infinite`,
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
      <style>
        {`
          @keyframes shine {
            0% {
              background-position: ${direction === 'left' ? '200% center' : '-200% center'};
            }
            100% {
              background-position: ${direction === 'left' ? '-200% center' : '200% center'};
            }
          }
        `}
      </style>
    </div>
  );
};

export default ShinyText;
