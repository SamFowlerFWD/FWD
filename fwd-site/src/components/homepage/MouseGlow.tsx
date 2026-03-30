import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react';

interface MouseGlowProps {
  children: ReactNode;
  colour?: string;
  intensity?: number;
  className?: string;
}

function parseColour(colour: string, intensity: number): string {
  // Handle hex colours
  if (colour.startsWith('#')) {
    const hex = colour.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${intensity})`;
  }
  // Handle rgb/rgba
  if (colour.startsWith('rgb')) {
    const match = colour.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]},${match[1]},${match[2]},${intensity})`;
    }
  }
  // Named colour fallback — use purple default
  return `rgba(124,58,237,${intensity})`;
}

export default function MouseGlow({
  children,
  colour = 'rgba(124,58,237,1)',
  intensity = 0.06,
  className = '',
}: MouseGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Check for fine pointer and reduced motion
  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const check = () => {
      setEnabled(finePointer.matches && !reducedMotion.matches);
    };
    check();

    finePointer.addEventListener('change', check);
    reducedMotion.addEventListener('change', check);
    return () => {
      finePointer.removeEventListener('change', check);
      reducedMotion.removeEventListener('change', check);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [enabled]
  );

  const handleMouseEnter = useCallback(() => {
    if (enabled) setIsVisible(true);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const gradientColour = parseColour(colour, intensity);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glow layer */}
      {enabled && (
        <div
          className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-300"
          style={{
            opacity: isVisible && position ? 1 : 0,
            background:
              position
                ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${gradientColour}, transparent 70%)`
                : 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
