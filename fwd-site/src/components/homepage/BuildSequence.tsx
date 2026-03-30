import { useState, useEffect, useRef } from 'react';

const PANELS = [
  {
    step: '01',
    title: 'We Talk',
    colour: 'from-slate-900 to-slate-800',
    accent: 'text-amber-400',
    content: 'chat' as const,
  },
  {
    step: '02',
    title: 'I Build',
    colour: 'from-slate-800 to-purple-900',
    accent: 'text-purple-400',
    content: 'build' as const,
  },
  {
    step: '03',
    title: 'You Grow',
    colour: 'from-purple-900 to-slate-900',
    accent: 'text-emerald-400',
    content: 'grow' as const,
  },
];

function ChatPanel({ visible }: { visible: boolean }) {
  const messages = [
    { from: 'client', text: "I run a dog grooming business. Bookings are all over the place.", delay: 0 },
    { from: 'sam', text: "Let's sort that out. Online booking with automatic confirmations?", delay: 400 },
    { from: 'client', text: "Yes! And reminders so people stop no-showing.", delay: 800 },
    { from: 'sam', text: "Easy. I'll have a demo for you in a week.", delay: 1200 },
  ];

  const [showCount, setShowCount] = useState(0);

  useEffect(() => {
    if (!visible) { setShowCount(0); return; }
    const timers = messages.map((msg, i) =>
      setTimeout(() => setShowCount(i + 1), msg.delay + 300)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.from === 'sam' ? 'justify-start' : 'justify-end'} transition-all duration-500 ${
            i < showCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.from === 'sam'
                ? 'bg-purple-600/30 text-purple-100 rounded-bl-sm'
                : 'bg-white/10 text-gray-200 rounded-br-sm'
            }`}
          >
            <span className="block text-[10px] uppercase tracking-wider mb-1 opacity-50">
              {msg.from === 'sam' ? 'Sam' : 'Client'}
            </span>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function BuildPanel({ visible }: { visible: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!visible) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [visible]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mini website preview being "built" */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-white/20">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-[10px] text-slate-400 bg-white rounded px-2 py-0.5 flex-1 max-w-[200px]">yourbusiness.co.uk</span>
        </div>

        {/* Website content building up */}
        <div className="p-4 space-y-3 min-h-[220px]">
          {/* Nav */}
          <div className={`flex items-center justify-between transition-all duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-16 h-4 bg-slate-800 rounded" />
            <div className="flex gap-2">
              <div className="w-10 h-3 bg-slate-200 rounded" />
              <div className="w-10 h-3 bg-slate-200 rounded" />
              <div className="w-10 h-3 bg-slate-200 rounded" />
            </div>
          </div>

          {/* Hero */}
          <div className={`transition-all duration-500 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-center">
              <div className="w-32 h-3 bg-white/40 rounded mx-auto mb-2" />
              <div className="w-48 h-4 bg-white/60 rounded mx-auto mb-3" />
              <div className="w-20 h-6 bg-amber-400 rounded mx-auto" />
            </div>
          </div>

          {/* Service cards */}
          <div className={`grid grid-cols-3 gap-2 transition-all duration-500 delay-200 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div className="w-6 h-6 bg-purple-100 rounded mb-1.5" />
                <div className="w-full h-2 bg-slate-200 rounded mb-1" />
                <div className="w-3/4 h-2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Booking form */}
          <div className={`transition-all duration-500 delay-300 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="w-24 h-3 bg-slate-300 rounded mb-2" />
              <div className="flex gap-2 mb-2">
                <div className="flex-1 h-6 bg-white border border-slate-200 rounded" />
                <div className="flex-1 h-6 bg-white border border-slate-200 rounded" />
              </div>
              <div className="w-16 h-5 bg-amber-400 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrowPanel({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, [visible]);

  const results = [
    { metric: 'Online bookings', before: '0', after: '40+ per week', icon: '📅' },
    { metric: 'Google ranking', before: 'Page 5', after: 'Page 1', icon: '🔍' },
    { metric: 'Admin time', before: '15 hrs/week', after: '2 hrs/week', icon: '⏱️' },
    { metric: 'No-shows', before: '30%', after: '5%', icon: '✅' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-3">
        {results.map((r, i) => (
          <div
            key={i}
            className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-500 ${
              show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: show ? `${i * 150}ms` : '0ms' }}
          >
            <span className="text-2xl block mb-2">{r.icon}</span>
            <p className="text-white/50 text-xs mb-1">{r.metric}</p>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm line-through">{r.before}</span>
              <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-emerald-400 font-bold text-sm">{r.after}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BuildSequence() {
  const [activePanel, setActivePanel] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = panelRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActivePanel(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    panelRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {PANELS.map((panel, i) => (
        <div
          key={i}
          ref={(el) => { panelRefs.current[i] = el; }}
          className={`min-h-[80vh] flex items-center justify-center bg-gradient-to-br ${panel.colour} relative overflow-hidden`}
        >
          {/* Step indicator */}
          <div className="absolute top-8 left-8 md:top-12 md:left-12">
            <span className={`text-7xl md:text-9xl font-black ${panel.accent} opacity-10`}>
              {panel.step}
            </span>
          </div>

          <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Text side */}
              <div className={`transition-all duration-700 ${activePanel >= i ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <span className={`text-sm font-mono ${panel.accent} mb-2 block`}>
                  Step {panel.step}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {panel.title}
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {i === 0 && "You tell me what you need. I listen, ask the right questions, and give you honest advice. No jargon, no pressure. Just a conversation about what would actually help your business."}
                  {i === 1 && "I get to work. You see progress throughout, not a big reveal after weeks of silence. Every decision is yours. I just make the technical bits happen."}
                  {i === 2 && "Your project goes live and starts working for you. I stick around to make sure everything runs smoothly. Real results, not just a pretty website."}
                </p>
              </div>

              {/* Visual side */}
              <div className={`transition-all duration-700 delay-200 ${activePanel >= i ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                {i === 0 && <ChatPanel visible={activePanel === 0} />}
                {i === 1 && <BuildPanel visible={activePanel === 1} />}
                {i === 2 && <GrowPanel visible={activePanel === 2} />}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
