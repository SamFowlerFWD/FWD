import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Button } from './ui';

// A box to draw a signature in with a mouse, finger or pen. It hands back a
// PNG (as a data: address) each time a stroke ends, or '' when cleared.
// The drawing is the same size whatever the screen, so it prints the same.
const WIDTH = 600;
const HEIGHT = 180;

export default function SignaturePad({ label, onChange, disabled }: { label: string; onChange: (png: string) => void; disabled?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - box.left) / box.width) * WIDTH, y: ((e.clientY - box.top) / box.height) * HEIGHT };
  };

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext('2d')!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1); // a tap leaves a dot
    ctx.stroke();
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = e.currentTarget.getContext('2d')!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    setHasInk(true);
    onChange(e.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
    setHasInk(false);
    onChange('');
  };

  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-3">
        <span className="font-medium text-slate-800">{label}</span>
        <Button variant="link" className="text-sm" onClick={clear} disabled={disabled || !hasInk}>Clear and start again</Button>
      </div>
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvas}
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label={hasInk ? `${label}: drawn` : `${label}: empty. Draw with a mouse, finger or pen.`}
          className="block w-full cursor-crosshair touch-none"
          style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-slate-300" />
        {!hasInk && <p aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400">Sign here</p>}
      </div>
    </div>
  );
}
