'use client';

import { ReactNode } from 'react';

interface LenisProviderProps {
  children: ReactNode;
}

/**
 * LenisProvider — smooth scroll removed.
 * Kept as passthrough to avoid breaking imports elsewhere.
 * All GSAP ScrollTrigger animations continue to work with native scroll.
 */
export default function LenisProvider({ children }: LenisProviderProps) {
  return <>{children}</>;
}
