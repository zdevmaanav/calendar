'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glowColor?: 'indigo' | 'cyan' | 'orange';
  style?: React.CSSProperties;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glowColor,
  style,
}: GlassCardProps) {
  const glowStyles = glowColor
    ? {
        indigo: { boxShadow: '0 8px 32px rgba(79, 70, 229, 0.06)' },
        cyan: { boxShadow: '0 8px 32px rgba(6, 182, 212, 0.06)' },
        orange: { boxShadow: '0 8px 32px rgba(232, 114, 42, 0.06)' },
      }[glowColor]
    : {};

  return (
    <div
      className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}
      style={{ ...glowStyles, ...style }}
    >
      {children}
    </div>
  );
}
