import { useState, useEffect, useCallback, useRef } from 'react';

const LINES = [
  { text: '$ sam build --client "your-business"', type: 'command' as const },
  { text: '', type: 'blank' as const },
  { text: '✓ Analysing requirements...', type: 'check' as const },
  { text: '✓ Designing solution...', type: 'check' as const },
  { text: '✓ Building...', type: 'check' as const },
  { text: '✓ Deploying...', type: 'check' as const },
  { text: '', type: 'blank' as const },
  { text: 'Ready. Your business just got faster.', type: 'result' as const },
];

const CHAR_INTERVAL = 40;
const LINE_PAUSE = 200;
const REVEAL_DELAY = 600;

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

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function TerminalHero() {
  const reducedMotion = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [terminalRemoved, setTerminalRemoved] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Skip animation entirely for reduced motion
  useEffect(() => {
    if (reducedMotion) {
      setTypingDone(true);
      setHeroVisible(true);
      setTerminalRemoved(true);
    }
  }, [reducedMotion]);

  // Blinking cursor
  useEffect(() => {
    if (typingDone || reducedMotion) return;
    cursorRef.current = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => {
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
  }, [typingDone, reducedMotion]);

  // Typing effect
  const tick = useCallback(() => {
    setLineIndex((li) => {
      if (li >= LINES.length) return li;
      const currentLine = LINES[li];

      // Blank lines: skip immediately
      if (currentLine.type === 'blank') {
        if (li + 1 >= LINES.length) {
          setTypingDone(true);
          return li;
        }
        return li + 1;
      }

      setCharIndex((ci) => {
        if (ci < currentLine.text.length) {
          return ci + 1;
        }
        // Line done — move to next after pause
        if (li + 1 >= LINES.length) {
          setTypingDone(true);
          return ci;
        }
        // Pause handled by clearing and restarting interval
        return ci;
      });

      return li;
    });
  }, []);

  useEffect(() => {
    if (reducedMotion || typingDone) return;

    intervalRef.current = setInterval(() => {
      setCharIndex((ci) => {
        const currentLine = LINES[lineIndex];
        if (!currentLine) return ci;

        if (currentLine.type === 'blank') {
          setLineIndex((li) => {
            if (li + 1 >= LINES.length) {
              setTypingDone(true);
              return li;
            }
            return li + 1;
          });
          return 0;
        }

        if (ci < currentLine.text.length) {
          return ci + 1;
        }

        // Line complete — pause then advance
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => {
          setLineIndex((li) => {
            if (li + 1 >= LINES.length) {
              setTypingDone(true);
              return li;
            }
            return li + 1;
          });
          setCharIndex(0);
        }, LINE_PAUSE);
        return ci;
      });
    }, CHAR_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lineIndex, reducedMotion, typingDone]);

  // After typing done, reveal hero
  useEffect(() => {
    if (!typingDone || reducedMotion) return;
    const t1 = setTimeout(() => setHeroVisible(true), REVEAL_DELAY);
    const t2 = setTimeout(() => setTerminalRemoved(true), REVEAL_DELAY + 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [typingDone, reducedMotion]);

  const renderLine = (line: (typeof LINES)[number], idx: number) => {
    const isCurrentLine = idx === lineIndex;
    const isTyped = idx < lineIndex;
    const text = isTyped
      ? line.text
      : isCurrentLine
        ? line.text.slice(0, charIndex)
        : '';

    if (line.type === 'blank') {
      return <div key={idx} className="h-5" />;
    }

    if (!text && !isCurrentLine) return null;

    let colourClass = 'text-slate-300';
    if (line.type === 'command') colourClass = 'text-white';
    if (line.type === 'check') colourClass = 'text-emerald-400';
    if (line.type === 'result') colourClass = 'text-amber-400 font-semibold';

    return (
      <div key={idx} className={`${colourClass} leading-relaxed`}>
        <span>{text}</span>
        {isCurrentLine && !typingDone && (
          <span
            className={`inline-block w-2 h-4 bg-white ml-0.5 align-middle transition-opacity ${
              cursorVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a1040] to-[#0a0e27]">
      {/* Terminal */}
      {!terminalRemoved && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-500 ${
            heroVisible ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          aria-hidden={heroVisible}
        >
          <div className="w-full max-w-xl mx-auto rounded-xl bg-slate-900 shadow-2xl shadow-slate-900/50 border border-slate-700/50 overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-slate-500 font-mono">
                terminal
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm min-h-[200px]">
              {LINES.map((line, idx) => renderLine(line, idx))}
            </div>
          </div>
        </div>
      )}

      {/* Hero content */}
      <div
        className={`relative z-20 max-w-3xl mx-auto text-center transition-all duration-700 ${
          heroVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-gray-200 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Based in Norfolk, working across the UK
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
          One Developer.{' '}
          <br />
          <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            No Middlemen.
          </span>
        </h1>

        {/* Lead */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Websites, apps, and automation for UK businesses. You deal directly
          with the person who builds it.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://wa.me/447584417830?text=Hi%20Sam%2C%20I%20found%20your%20website%20and%20I%27m%20interested%20in%20discussing%20a%20project."
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <WhatsAppIcon />
            Message on WhatsApp
          </a>
          <a
            href="/work"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-slate-900 transition-all duration-200"
          >
            See My Work
          </a>
        </div>
      </div>
    </section>
  );
}
