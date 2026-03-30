import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export default function ScrollCounter({
  value,
  suffix = '',
  prefix = '',
  label,
  duration = 1500,
}: ScrollCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const reducedMotion = useReducedMotion();

  const animate = useCallback(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;

      // For integer targets, show integers. For decimal targets, keep one decimal.
      setDisplayValue(
        Number.isInteger(value) ? Math.round(current) : parseFloat(current.toFixed(1))
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [value, duration, hasAnimated, reducedMotion]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, hasAnimated]);

  // Show final value immediately for reduced motion
  const shown = reducedMotion ? value : displayValue;

  return (
    <div ref={elementRef} className="flex flex-col items-center text-center">
      <span
        className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {prefix}
        {shown}
        {suffix}
      </span>
      <span className="text-sm text-slate-500 mt-1">{label}</span>
    </div>
  );
}
