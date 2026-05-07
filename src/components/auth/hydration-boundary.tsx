'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function HydrationBoundary({ children }: { children: React.ReactNode }) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During hydration, show nothing to avoid mismatch, but no heavy loader.
  if (!mounted || !isInitialized) {
    return <div className="opacity-0">{children}</div>;
  }

  return <>{children}</>;
}
