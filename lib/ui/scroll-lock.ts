'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';

/**
 * Page-scroll locking for overlays (modals, drawers, dialogs).
 *
 * Two things have to happen when an overlay opens, and missing either one makes
 * the page scroll behind it:
 *
 *  1. Lenis has to be paused. It listens for wheel events on the whole document
 *     and animates `window.scrollTo`, so without pausing it the page keeps
 *     moving even when the pointer is over a modal's own scroll container.
 *  2. The body has to be locked, for touch scrolling and for anything Lenis is
 *     not driving.
 *
 * Overlays can nest (a confirm dialog on top of a product modal), so locks are
 * reference-counted — the page is only released once the last overlay closes.
 */

let lenisInstance: Lenis | null = null;
let lockCount = 0;
let restoreBodyStyles: (() => void) | null = null;

/** Called once by ClientProviders when Lenis is created or torn down. */
export function setLenisInstance(instance: Lenis | null) {
  lenisInstance = instance;
}

function applyLock() {
  if (typeof document === 'undefined') return;

  const { body } = document;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;

  // Removing the scrollbar reflows the page and everything shifts sideways;
  // pad by exactly the width the scrollbar occupied to hold the layout still.
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    const currentPadding = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }
  body.style.overflow = 'hidden';

  restoreBodyStyles = () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
  };
}

function releaseLock() {
  restoreBodyStyles?.();
  restoreBodyStyles = null;
}

/** Imperative form, for code that is not a React component. */
export function lockPageScroll() {
  lockCount += 1;
  if (lockCount === 1) {
    lenisInstance?.stop();
    applyLock();
  }
}

export function unlockPageScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    lenisInstance?.start();
    releaseLock();
  }
}

/**
 * Locks page scrolling for as long as `isActive` is true.
 *
 *   useScrollLock(isOpen);
 */
export function useScrollLock(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;
    lockPageScroll();
    return unlockPageScroll;
  }, [isActive]);
}
