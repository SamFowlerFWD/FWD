import { useState, useEffect, useRef, useCallback } from 'react';

interface Metric {
  value: number;
  display: string;
  label: string;
  status: 'good' | 'ok';
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

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

function formatKB(bytes: number): string {
  return Math.round(bytes / 1024) + ' KB';
}

function AnimatedValue({
  target,
  formatter,
  duration,
  status,
  skipAnimation,
}: {
  target: number;
  formatter: (v: number) => string;
  duration: number;
  status: 'good' | 'ok';
  skipAnimation: boolean;
}) {
  const [display, setDisplay] = useState(skipAnimation ? formatter(target) : formatter(0));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (skipAnimation) {
      setDisplay(formatter(target));
      return;
    }

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplay(formatter(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(formatter(target));
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, formatter, duration, skipAnimation]);

  const colourClass = status === 'good' ? 'text-emerald-600' : 'text-amber-600';

  return (
    <span
      className={`text-2xl sm:text-3xl font-bold tabular-nums ${colourClass}`}
      style={{ fontFeatureSettings: '"tnum"' }}
    >
      {display}
    </span>
  );
}

export default function LivePageSpeed() {
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const reducedMotion = useReducedMotion();
  const measured = useRef(false);

  const measure = useCallback(() => {
    if (measured.current) return;
    measured.current = true;

    // Page load time
    let loadTime = 0;
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      loadTime = nav.loadEventEnd - nav.startTime;
    } else if (performance.timing) {
      loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    // Clamp negative / zero
    if (loadTime <= 0) loadTime = 500;

    // First paint
    let firstPaint = 0;
    const paintEntries = performance.getEntriesByType('paint');
    const fp = paintEntries.find((e) => e.name === 'first-contentful-paint') ||
      paintEntries.find((e) => e.name === 'first-paint');
    if (fp) {
      firstPaint = fp.startTime;
    }
    if (firstPaint <= 0) firstPaint = 300;

    // Total transfer size
    let totalSize = 0;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    for (const r of resources) {
      totalSize += r.transferSize || 0;
    }
    // Add the document itself
    if (nav && nav.transferSize) {
      totalSize += nav.transferSize;
    }

    setMetrics([
      {
        value: loadTime,
        display: formatSeconds(loadTime),
        label: 'Page Load',
        status: loadTime < 2000 ? 'good' : 'ok',
      },
      {
        value: firstPaint,
        display: formatSeconds(firstPaint),
        label: 'First Paint',
        status: firstPaint < 1500 ? 'good' : 'ok',
      },
      {
        value: totalSize,
        display: formatKB(totalSize),
        label: 'Total Size',
        status: totalSize < 500000 ? 'good' : 'ok',
      },
    ]);
  }, []);

  useEffect(() => {
    // Wait for load to complete
    if (document.readyState === 'complete') {
      // Small delay so loadEventEnd is populated
      setTimeout(measure, 100);
    } else {
      window.addEventListener('load', () => setTimeout(measure, 100));
    }
  }, [measure]);

  if (!metrics) return null;

  const formattersRef = useRef({
    seconds: (v: number) => formatSeconds(v),
    kb: (v: number) => formatKB(v),
  });

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="inline-flex flex-wrap items-start justify-center gap-8 sm:gap-12">
        {metrics.map((metric, i) => (
          <div key={metric.label} className="flex flex-col items-center">
            <AnimatedValue
              target={metric.value}
              formatter={
                i === 2 ? formattersRef.current.kb : formattersRef.current.seconds
              }
              duration={800}
              status={metric.status}
              skipAnimation={reducedMotion}
            />
            <span className="text-sm text-slate-500 mt-1">{metric.label}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-400 mt-4">
        This page. Right now. Your website could be this fast.
      </p>
    </div>
  );
}
