import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { errorText } from './api';

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200';

export function Card({ title, status, children, id }: { title?: string; status?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {status}
        </div>
      )}
      {children}
    </section>
  );
}

type Tone = 'grey' | 'amber' | 'green' | 'violet';
const TONES: Record<Tone, string> = {
  grey: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-900',
  green: 'bg-green-100 text-green-800',
  violet: 'bg-violet-100 text-violet-800',
};

export function Pill({ tone = 'grey', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${TONES[tone]}`}>{children}</span>;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
}
const VARIANTS = {
  primary: 'bg-violet-700 text-white hover:bg-violet-800 px-4 py-2 rounded-lg font-semibold',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg font-semibold',
  danger: 'bg-white text-red-700 border border-red-300 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold',
  link: 'text-violet-700 hover:text-violet-900 underline underline-offset-2',
};

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${VARIANTS[variant]} transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${className}`}
      {...rest}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-medium text-slate-900">{label}</span>
      {hint && <span className="mb-1 block text-sm text-slate-600">{hint}</span>}
      {children}
    </label>
  );
}

export function Notice({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone];
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}

// Runs an async action and tracks "busy" and the last error, so every button
// behaves the same way: disabled while working, message if it fails.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}
