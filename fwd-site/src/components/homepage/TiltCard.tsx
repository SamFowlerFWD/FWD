import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glare?: boolean;
}

const MAX_ROTATION = 8;

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

function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setIsTouch(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isTouch;
}

export default function TiltCard({ children, className = '', glare = false }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const isTouch = useTouchDevice();

  const disabled = reducedMotion || isTouch;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateY = (mouseX / (rect.width / 2)) * MAX_ROTATION;
      const rotateX = -(mouseY / (rect.height / 2)) * MAX_ROTATION;

      setTransform(
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
      );

      if (glare) {
        const percentX = ((e.clientX - rect.left) / rect.width) * 100;
        const percentY = ((e.clientY - rect.top) / rect.height) * 100;
        setGlarePos({ x: percentX, y: percentY });
      }
    },
    [disabled, glare]
  );

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    setGlarePos({ x: 50, y: 50 });
  }, [disabled]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl shadow-lg border border-slate-100 bg-white overflow-hidden p-8 transition-shadow duration-300 ${
        isHovered ? 'shadow-xl' : ''
      } ${className}`}
      style={{
        transform: disabled ? undefined : transform,
        transition: disabled
          ? undefined
          : 'transform 300ms cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 300ms ease',
        willChange: disabled ? undefined : 'transform',
      }}
    >
      {/* Glare overlay */}
      {glare && !disabled && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.10), transparent 60%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
