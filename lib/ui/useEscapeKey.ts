'use client';

import { useEffect } from 'react';

/**
 * Closes an overlay on Escape.
 *
 * Hand-rolled overlays (the ones not built on Radix) had no keyboard dismissal
 * at all, which matters most on small screens where the close button can be the
 * only way out and is easy to miss.
 */
export function useEscapeKey(isActive: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
}
