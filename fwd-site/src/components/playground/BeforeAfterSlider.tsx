import { useState, useRef, useCallback, useEffect } from 'react';

interface DemoPair {
  label: string;
  before: { gradient: string; text: string };
  after: { gradient: string; text: string };
}

const DEMO_PAIRS: DemoPair[] = [
  {
    label: 'Kitchen Renovation',
    before: {
      gradient: 'linear-gradient(135deg, #8B7355 0%, #6B6B6B 40%, #A09080 70%, #7A7A7A 100%)',
      text: 'Before',
    },
    after: {
      gradient: 'linear-gradient(135deg, #FAFAF5 0%, #F5E6D3 30%, #FFF8F0 60%, #F0E0C8 100%)',
      text: 'After',
    },
  },
  {
    label: 'Garden Makeover',
    before: {
      gradient: 'linear-gradient(135deg, #3B5233 0%, #5C4A2A 40%, #4A6B3A 70%, #6B5B3A 100%)',
      text: 'Before',
    },
    after: {
      gradient: 'linear-gradient(135deg, #7BC47F 0%, #A8E063 30%, #56AB2F 60%, #F9E866 100%)',
      text: 'After',
    },
  },
];

export default function BeforeAfterSlider() {
  const [activePair, setActivePair] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pair = DEMO_PAIRS[activePair];

  const getPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    return Math.max(0, Math.min(100, pct));
  }, []);

  const handleStart = useCallback(() => {
    setIsDragging(true);
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      setSliderPos(getPosition(clientX));
    },
    [isDragging, getPosition]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const onEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const switchPair = (index: number) => {
    setActivePair(index);
    setSliderPos(50);
    setHasInteracted(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Before &amp; After Slider</h3>
      <p className="text-sm text-slate-500 mb-4">
        Drag the handle to compare. Perfect for showcasing transformations.
      </p>

      {/* Demo pair toggle */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Demo pair selection">
        {DEMO_PAIRS.map((p, i) => (
          <button
            key={p.label}
            role="tab"
            aria-selected={activePair === i}
            onClick={() => switchPair(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
              activePair === i
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative w-full h-72 sm:h-80 rounded-lg overflow-hidden select-none cursor-col-resize"
        onMouseDown={(e) => {
          handleStart();
          setSliderPos(getPosition(e.clientX));
        }}
        onTouchStart={(e) => {
          handleStart();
          if (e.touches.length > 0) setSliderPos(getPosition(e.touches[0].clientX));
        }}
        role="slider"
        aria-label="Before and after comparison slider"
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setSliderPos((p) => Math.max(0, p - 2));
          if (e.key === 'ArrowRight') setSliderPos((p) => Math.min(100, p + 2));
          if (!hasInteracted) setHasInteracted(true);
        }}
      >
        {/* After layer (full background) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: pair.after.gradient }}
        >
          <span className="text-2xl font-bold text-slate-700/30 select-none">{pair.after.text}</span>
        </div>

        {/* Before layer (clipped) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: pair.before.gradient,
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
        >
          <span className="text-2xl font-bold text-white/40 select-none">{pair.before.text}</span>
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-slate-200">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7 4L3 10L7 16" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 4L17 10L13 16" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute top-3 left-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded">
          Before
        </span>
        <span className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded">
          After
        </span>

        {/* Drag hint */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full transition-opacity duration-700 pointer-events-none ${
            hasInteracted ? 'opacity-0' : 'opacity-100'
          }`}
        >
          Drag to compare
        </div>
      </div>

      {/* Note */}
      <p className="text-sm text-slate-500 italic mt-4 flex items-start gap-2">
        <span className="text-amber-500 text-base leading-5" aria-hidden="true">💡</span>
        Builders, decorators, and beauticians used to pay £200+ for a comparison slider plugin. Now it's a standard feature.
      </p>
    </div>
  );
}
