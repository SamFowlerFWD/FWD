import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Terminal ───────────────────────────────────────────────

const LINES = [
  { text: '$ sam build --client "your-business"', type: 'command' as const },
  { text: '', type: 'blank' as const },
  { text: '✓ Analysing requirements...', type: 'check' as const },
  { text: '✓ Designing solution...', type: 'check' as const },
  { text: '✓ Building...', type: 'check' as const },
  { text: '✓ Deploying...', type: 'check' as const },
  { text: '', type: 'blank' as const },
  { text: 'Ready.', type: 'result' as const },
];

function Terminal({ onDone }: { onDone: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [wordsShown, setWordsShown] = useState(0); // 0=none, 1=faster, 2=+better, 3=+easier
  const [allDone, setAllDone] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypingDone(true); setAllDone(true); setWordsShown(3); onDone();
    }
  }, []);

  // Cursor blink
  useEffect(() => {
    if (allDone) return;
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, [allDone]);

  // Typing effect
  useEffect(() => {
    if (typingDone) return;
    intervalRef.current = setInterval(() => {
      setCharIndex(ci => {
        const line = LINES[lineIndex];
        if (!line) return ci;
        if (line.type === 'blank') {
          setLineIndex(li => {
            if (li + 1 >= LINES.length) { setTypingDone(true); return li; }
            return li + 1;
          });
          return 0;
        }
        if (ci < line.text.length) return ci + 1;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => {
          setLineIndex(li => {
            if (li + 1 >= LINES.length) { setTypingDone(true); return li; }
            return li + 1;
          });
          setCharIndex(0);
        }, 150);
        return ci;
      });
    }, 35);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [lineIndex, typingDone]);

  // Payoff: words compound one at a time. faster → faster. better → faster. better. easier.
  useEffect(() => {
    if (!typingDone || allDone) return;

    const t1 = setTimeout(() => setWordsShown(1), 500);       // "faster."
    const t2 = setTimeout(() => setWordsShown(2), 1500);      // "+ better."
    const t3 = setTimeout(() => setWordsShown(3), 2500);      // "+ easier."
    const t4 = setTimeout(() => { setAllDone(true); onDone(); }, 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [typingDone, allDone]);

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl bg-slate-800/80 shadow-2xl shadow-black/40 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border-b border-slate-600/30">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-slate-500 font-mono">terminal</span>
      </div>
      <div className="p-4 sm:p-5 font-mono text-xs sm:text-sm min-h-[180px]">
        {LINES.map((line, idx) => {
          const typed = idx < lineIndex;
          const current = idx === lineIndex;

          if (line.type === 'blank') {
            if (typed || current) return <div key={idx} className="h-4" />;
            return null;
          }

          // For the result line, show full text once typing is done
          let text: string;
          if (line.type === 'result' && typingDone) {
            text = line.text;
          } else if (typed) {
            text = line.text;
          } else if (current) {
            text = line.text.slice(0, charIndex);
          } else {
            return null;
          }

          if (!text) return null;

          const cls =
            line.type === 'command' ? 'text-white' :
            line.type === 'check' ? 'text-emerald-400' :
            'text-amber-400 font-semibold';

          return (
            <div key={idx} className={`${cls} leading-relaxed`}>
              <span>{text}</span>
              {/* Payoff words compound after "Ready." */}
              {line.type === 'result' && typingDone && (
                <span className="ml-1">
                  Your business just got{' '}
                  <span className={`transition-opacity duration-300 ${wordsShown >= 1 ? 'opacity-100' : 'opacity-0'}`}>faster.</span>
                  {' '}
                  <span className={`transition-opacity duration-300 ${wordsShown >= 2 ? 'opacity-100' : 'opacity-0'}`}>better.</span>
                  {' '}
                  <span className={`transition-opacity duration-300 ${wordsShown >= 3 ? 'opacity-100' : 'opacity-0'}`}>easier.</span>
                </span>
              )}
              {current && !typingDone && (
                <span className={`inline-block w-2 h-4 bg-white ml-0.5 align-middle ${cursorOn ? 'opacity-100' : 'opacity-0'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function range(scrollProgress: number, start: number, end: number) {
  if (scrollProgress <= start) return 0;
  if (scrollProgress >= end) return 1;
  return (scrollProgress - start) / (end - start);
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function HeroSequence() {
  const [terminalDone, setTerminalDone] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTerminalDone(true);
    }
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!containerRef.current) { ticking = false; return; }
        const rect = containerRef.current.getBoundingClientRect();
        const totalScroll = containerRef.current.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        setScrollProgress(Math.max(0, Math.min(1, scrolled / totalScroll)));
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Map scroll progress to layer opacities and transforms
  // 0.00 - 0.15: Terminal visible
  // 0.10 - 0.35: "We Talk" fades in and out
  // 0.30 - 0.55: "I Build" fades in and out
  // 0.50 - 0.75: "You Grow" fades in and out
  // 0.70 - 1.00: CTA fades in

  // Spread phases with clear gaps: terminal, talk, build, grow, cta
  // Title text appears BEFORE the visual side for each phase
  const terminalOpacity = 1 - range(scrollProgress, 0.04, 0.12);
  const terminalScale = lerp(1, 0.9, range(scrollProgress, 0.04, 0.12));
  const terminalY = lerp(0, -60, range(scrollProgress, 0.04, 0.12));

  // Talk: title at 0.08, visual at 0.14, fade out at 0.30
  const talkTitleOpacity = Math.min(range(scrollProgress, 0.08, 0.14), 1 - range(scrollProgress, 0.30, 0.36));
  const talkVisualOpacity = Math.min(range(scrollProgress, 0.14, 0.20), 1 - range(scrollProgress, 0.30, 0.36));
  const talkY = lerp(60, 0, range(scrollProgress, 0.08, 0.16));

  // Build: title at 0.34, visual at 0.40, fade out at 0.54
  const buildTitleOpacity = Math.min(range(scrollProgress, 0.34, 0.40), 1 - range(scrollProgress, 0.54, 0.60));
  const buildVisualOpacity = Math.min(range(scrollProgress, 0.40, 0.46), 1 - range(scrollProgress, 0.54, 0.60));
  const buildY = lerp(60, 0, range(scrollProgress, 0.34, 0.42));

  // Grow: title at 0.58, visual at 0.64, fade out at 0.78
  const growTitleOpacity = Math.min(range(scrollProgress, 0.58, 0.64), 1 - range(scrollProgress, 0.78, 0.84));
  const growVisualOpacity = Math.min(range(scrollProgress, 0.64, 0.70), 1 - range(scrollProgress, 0.78, 0.84));
  const growY = lerp(60, 0, range(scrollProgress, 0.58, 0.66));

  const ctaOpacity = range(scrollProgress, 0.84, 0.94);
  const ctaY = lerp(40, 0, range(scrollProgress, 0.84, 0.94));

  // Chat messages appear progressively within the talk visual phase
  const talkProgress = range(scrollProgress, 0.16, 0.28);
  // Build phases appear progressively
  const buildProgress = range(scrollProgress, 0.42, 0.54);
  // Grow cards appear progressively
  const growProgress = range(scrollProgress, 0.66, 0.78);

  const chatMessages = [
    { from: 'client', text: "I run a dog grooming business. Bookings are all over the place." },
    { from: 'sam', text: "Let's sort that out. Online booking with automatic confirmations?" },
    { from: 'client', text: "Yes! And reminders so people stop no-showing." },
    { from: 'sam', text: "Easy. I'll have a demo for you in a week." },
  ];

  const results = [
    { metric: 'Online bookings', before: '0', after: '40+/week', icon: '📅' },
    { metric: 'Google ranking', before: 'Page 5', after: 'Page 1', icon: '🔍' },
    { metric: 'Admin time', before: '15 hrs/wk', after: '2 hrs/wk', icon: '⏱️' },
    { metric: 'No-shows', before: '30%', after: '5%', icon: '✅' },
  ];

  const buildPhase = Math.floor(buildProgress * 4); // 0-3

  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-b from-[#0a0e27] via-[#12102e] to-[#0a0e27]"
      style={{ height: '650vh' }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">

        {/* Terminal layer */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
          style={{
            opacity: terminalOpacity,
            transform: `scale(${terminalScale}) translateY(${terminalY}px)`,
          }}
        >
          <Terminal onDone={() => setTerminalDone(true)} />
          {/* Scroll prompt appears after terminal finishes */}
          <div
            className={`mt-8 transition-opacity duration-700 ${terminalDone ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="text-white text-sm font-medium tracking-wide">scroll down to see the process</span>
              <div className="animate-bounce">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* "We Talk" layer */}
        <div
          className="absolute inset-0 flex items-center justify-center px-6 z-20"
          style={{ transform: `translateY(${talkY}px)` }}
        >
          <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div style={{ opacity: talkTitleOpacity }}>
              <span className="text-xs font-mono text-amber-400/70 tracking-widest uppercase mb-3 block">Step 01</span>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">We Talk</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                You tell me what you need. I listen, ask the right questions, and give you honest advice. No jargon, no pressure.
              </p>
            </div>
            <div className="space-y-2.5 max-w-sm mx-auto w-full" style={{ opacity: talkVisualOpacity }}>
              {chatMessages.map((m, i) => {
                const msgProgress = range(talkProgress, i * 0.25, i * 0.25 + 0.2);
                return (
                  <div
                    key={i}
                    className={`flex ${m.from === 'sam' ? 'justify-start' : 'justify-end'}`}
                    style={{
                      opacity: msgProgress,
                      transform: `translateY(${lerp(20, 0, msgProgress)}px)`,
                    }}
                  >
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.from === 'sam'
                        ? 'bg-purple-500/25 text-purple-100 rounded-bl-sm'
                        : 'bg-white/10 text-gray-200 rounded-br-sm'
                    }`}>
                      <span className="block text-[10px] uppercase tracking-wider mb-0.5 opacity-40">
                        {m.from === 'sam' ? 'Sam' : 'Client'}
                      </span>
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* "I Build" layer */}
        <div
          className="absolute inset-0 flex items-center justify-center px-6 z-30"
          style={{ transform: `translateY(${buildY}px)` }}
        >
          <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div style={{ opacity: buildTitleOpacity }}>
              <span className="text-xs font-mono text-purple-400/70 tracking-widest uppercase mb-3 block">Step 02</span>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">I Build</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                I get to work. You see progress throughout, not a big reveal after weeks of silence. Every decision is yours.
              </p>
            </div>
            <div className="max-w-sm mx-auto w-full" style={{ opacity: buildVisualOpacity }}>
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="ml-2 text-[9px] text-slate-400 bg-white rounded px-2 py-0.5">yourbusiness.co.uk</span>
                </div>
                <div className="p-3 space-y-2.5 min-h-[180px]">
                  <div className={`flex items-center justify-between transition-opacity duration-300 ${buildPhase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-14 h-3 bg-slate-800 rounded" />
                    <div className="flex gap-1.5"><div className="w-8 h-2.5 bg-slate-200 rounded" /><div className="w-8 h-2.5 bg-slate-200 rounded" /><div className="w-8 h-2.5 bg-slate-200 rounded" /></div>
                  </div>
                  <div className={`transition-opacity duration-300 ${buildPhase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-3 text-center">
                      <div className="w-28 h-2.5 bg-white/40 rounded mx-auto mb-1.5" />
                      <div className="w-40 h-3 bg-white/60 rounded mx-auto mb-2" />
                      <div className="w-16 h-5 bg-amber-400 rounded mx-auto" />
                    </div>
                  </div>
                  <div className={`grid grid-cols-3 gap-1.5 transition-opacity duration-300 ${buildPhase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    {[1,2,3].map(n => (
                      <div key={n} className="bg-slate-50 rounded p-1.5 border border-slate-100">
                        <div className="w-5 h-5 bg-purple-100 rounded mb-1" /><div className="w-full h-1.5 bg-slate-200 rounded mb-0.5" /><div className="w-3/4 h-1.5 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className={`transition-opacity duration-300 ${buildPhase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-slate-50 rounded p-2 border border-slate-100">
                      <div className="w-20 h-2 bg-slate-300 rounded mb-1.5" />
                      <div className="flex gap-1.5 mb-1.5"><div className="flex-1 h-5 bg-white border border-slate-200 rounded" /><div className="flex-1 h-5 bg-white border border-slate-200 rounded" /></div>
                      <div className="w-14 h-4 bg-amber-400 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* "You Grow" layer */}
        <div
          className="absolute inset-0 flex items-center justify-center px-6 z-40"
          style={{ transform: `translateY(${growY}px)` }}
        >
          <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div style={{ opacity: growTitleOpacity }}>
              <span className="text-xs font-mono text-emerald-400/70 tracking-widest uppercase mb-3 block">Step 03</span>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">You Grow</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Your project goes live and starts working for you. Real results, not just a pretty website. I stick around to make sure it keeps running.
              </p>
            </div>
            <div className="max-w-sm mx-auto w-full grid grid-cols-2 gap-2.5" style={{ opacity: growVisualOpacity }}>
              {results.map((r, i) => {
                const cardProgress = range(growProgress, i * 0.2, i * 0.2 + 0.3);
                return (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-xl p-3.5"
                    style={{
                      opacity: cardProgress,
                      transform: `translateY(${lerp(30, 0, cardProgress)}px)`,
                    }}
                  >
                    <span className="text-xl block mb-1.5">{r.icon}</span>
                    <p className="text-white/40 text-[11px] mb-1">{r.metric}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/30 text-xs line-through">{r.before}</span>
                      <svg className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      <span className="text-emerald-400 font-bold text-xs">{r.after}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA layer */}
        <div
          className="absolute inset-0 flex items-center justify-center px-6 z-50"
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-gray-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Based in Norfolk, working across the UK
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
              One Developer.<br />
              <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">No Middlemen.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Websites, apps, and automation for UK businesses. You deal directly with the person who builds it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://wa.me/447584417830?text=Hi%20Sam%2C%20I%20found%20your%20website%20and%20I%27m%20interested%20in%20discussing%20a%20project." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 transition-all duration-200">
                <WaIcon /> Message on WhatsApp
              </a>
              <a href="/work" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white/20 text-white font-bold hover:bg-white hover:text-slate-900 transition-all duration-200">
                See My Work
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
