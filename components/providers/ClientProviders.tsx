'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Lenis from 'lenis';
import { setLenisInstance } from '@/lib/ui/scroll-lock';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lenis: Lenis | null = null;
    let animationFrameId: number;

    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      // Lenis natively skips any event whose composed path contains an element
      // marked `data-lenis-prevent`, which is how scroll containers inside
      // modals and drawers keep their own wheel events instead of handing them
      // to the page. No extra configuration is needed for that to work.

      // Published so overlays can pause page scrolling while they are open.
      setLenisInstance(lenis);

      function raf(time: number) {
        if (lenis) {
          lenis.raf(time);
          animationFrameId = requestAnimationFrame(raf);
        }
      }

      animationFrameId = requestAnimationFrame(raf);
    } catch (err) {
      console.warn('[LENIS INIT WARN]', err);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (lenis) lenis.destroy();
      setLenisInstance(null);
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
