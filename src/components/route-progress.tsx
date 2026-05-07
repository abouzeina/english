'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import nProgress from 'nprogress';

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    nProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });
    
    const handleStart = () => nProgress.start();
    const handleStop = () => nProgress.done();

    // Since Next.js doesn't have native events for navigation anymore, 
    // we use a simple approach or just rely on the fact that this effect runs on change.
    handleStop();

    return () => {
      handleStart();
    };
  }, [pathname, searchParams]);

  return null;
}
