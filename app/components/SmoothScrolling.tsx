'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScrolling() {
  const pathname = usePathname();

  useEffect(() => {
    // Wait for DOM to be ready
    const initLenis = () => {
      const wrapper = document.querySelector('main[data-lenis-prevent]') as HTMLElement;
      
      if (!wrapper) {
        console.warn('Lenis: Main element not found');
        return null;
      }

      // Initialize Lenis with ultra-smooth settings on the main content
      const lenis = new Lenis({
        wrapper: wrapper,
        content: wrapper,
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.8,
        touchMultiplier: 1.5,
        infinite: false,
        syncTouch: true,
        syncTouchLerp: 0.1,
      });

      return lenis;
    };

    // Initialize after a small delay to ensure DOM is ready
    let lenis: Lenis | null = null;
    let rafId: number | null = null;
    
    const timeoutId = setTimeout(() => {
      lenis = initLenis();
      
      if (!lenis) return;

      // Request animation frame loop for buttery smooth performance
      function raf(time: number) {
        if (lenis) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
      }

      rafId = requestAnimationFrame(raf);
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (lenis) {
        lenis.destroy();
      }
    };
  }, [pathname]); // Reinitialize on route change

  return null;
}

