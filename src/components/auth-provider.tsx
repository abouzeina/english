'use client';

import { useEffect } from 'react';
import { authService } from '@/lib/firebase/auth-service';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setInitialized(true);
      
      // Sync session token with cookie for middleware if needed
      if (user) {
        user.getIdToken().then((token) => {
          document.cookie = `wafi_token=${token}; path=/; max-age=3600; SameSite=Lax`;
        });
      } else {
        document.cookie = 'wafi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    });

    return () => unsubscribe();
  }, [setUser, setInitialized]);

  return <>{children}</>;
}
