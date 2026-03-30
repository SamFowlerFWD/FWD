import { useState, useRef, useEffect, useCallback } from 'react';

interface StatCard {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  icon: string;
  colour: string;
}

const ICONS: Record<string, React.ReactNode> = {
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8" aria-hidden="true">
      <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2M4 22h16M10 22V12m4 10V12M8 3h8v6a4 4 0 01-8 0V3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
};

const ICON_KEYS = Object.keys(ICONS);

const COLOURS: Record<string, string> = {
  purple: 'text-purple-500',
  amber: 'text-amber-500',
  green: 'text-emerald-500',
  blue: 'text-blue-500',
};

const COLOUR_KEYS = Object.keys(COLOURS);

const DEFAULT_STATS: StatCard[] = [
  { value: 150, prefix: '', suffix: '+', label: 'Happy Customers', icon: 'users', colour: 'amber' },
  { value: 98, prefix: '', suffix: '%', label: 'Satisfaction Rate', icon: 'star', colour: 'purple' },
  { value: 40, prefix: '£', suffix: 'k', label: 'Client Savings', icon: 'chart', colour: 'green' },
  { value: 500, prefix: '', suffix: '+', label: 'Hours Saved', icon: 'clock', colour: 'blue' },
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedStatsBuilder() {
  const [stats, setStats] = useState<StatCard[]>(DEFAULT_STATS);
  const [displayValues, setDisplayValues] = useState<number[]>(DEFAULT_STATS.map((s) => s.value));
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);
  const animFrameRef = useRef<number>(0);

  const updateStat = (index: number, field: keyof StatCard, value: string | number) => {
    setStats((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    if (field === 'value') {
      setDisplayValues((prev) => {
        const next = [...prev];
        next[index] = Number(value);
        return next;
      });
    }
  };

  const animate = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(true);
    setDisplayValues([0, 0, 0, 0]);

    const duration = 1500;
    const stagger = 100;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const newVals = stats.map((stat, i) => {
        const statElapsed = Math.max(0, elapsed - i * stagger);
        const progress = Math.min(1, statElapsed / duration);
        return Math.round(easeOutCubic(progress) * stat.value);
      });
      setDisplayValues(newVals);

      if (elapsed < duration + stagger * 3) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
        setDisplayValues(stats.map((s) => s.value));
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [stats]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const generateHtml = () => {
    const items = stats
      .map(
        (s) => `  <div class="stat-card">
    <div class="stat-icon">${s.icon}</div>
    <div class="stat-value">${s.prefix}<span data-target="${s.value}">0</span>${s.suffix}</div>
    <div class="stat-label">${s.label}</div>
  </div>`
      )
      .join('\n');
    return `<section class="stats-section">\n${items}\n</section>`;
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(generateHtml()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Animated Stats Builder</h3>
      <p className="text-sm text-slate-500 mb-4">
        Create the "numbers counting up" section every client wants. Edit the values and preview the animation.
      </p>

      {/* Stat editors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {stats.map((stat, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor={`stat-val-${i}`} className="text-xs text-slate-500">Value</label>
                <input
                  id={`stat-val-${i}`}
                  type="number"
                  value={stat.value}
                  onChange={(e) => updateStat(i, 'value', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
                />
              </div>
              <div className="w-16">
                <label htmlFor={`stat-pre-${i}`} className="text-xs text-slate-500">Prefix</label>
                <input
                  id={`stat-pre-${i}`}
                  type="text"
                  value={stat.prefix}
                  onChange={(e) => updateStat(i, 'prefix', e.target.value)}
                  placeholder="£"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
                />
              </div>
              <div className="w-16">
                <label htmlFor={`stat-suf-${i}`} className="text-xs text-slate-500">Suffix</label>
                <input
                  id={`stat-suf-${i}`}
                  type="text"
                  value={stat.suffix}
                  onChange={(e) => updateStat(i, 'suffix', e.target.value)}
                  placeholder="%"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
                />
              </div>
            </div>
            <div>
              <label htmlFor={`stat-label-${i}`} className="text-xs text-slate-500">Label</label>
              <input
                id={`stat-label-${i}`}
                type="text"
                value={stat.label}
                onChange={(e) => updateStat(i, 'label', e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
              />
            </div>
            <div className="flex gap-4 items-end">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Icon</span>
                <div className="flex gap-0.5">
                  {ICON_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => updateStat(i, 'icon', key)}
                      aria-label={`Select ${key} icon`}
                      className={`w-6 h-6 flex items-center justify-center rounded text-slate-400 transition-colors ${
                        stat.icon === key ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300' : 'hover:bg-slate-100'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        {key === 'star' && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
                        {key === 'users' && <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />}
                        {key === 'chart' && <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" />}
                        {key === 'clock' && <><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>}
                        {key === 'trophy' && <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2M10 22h4M8 3h8v6a4 4 0 01-8 0V3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
                        {key === 'heart' && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Colour</span>
                <div className="flex gap-1">
                  {COLOUR_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => updateStat(i, 'colour', key)}
                      aria-label={`Select ${key} colour`}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        stat.colour === key ? 'border-slate-900 scale-110' : 'border-transparent'
                      } ${
                        key === 'purple' ? 'bg-purple-500' :
                        key === 'amber' ? 'bg-amber-500' :
                        key === 'green' ? 'bg-emerald-500' :
                        'bg-blue-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview area */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 sm:p-8 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`${COLOURS[stat.colour]} mb-2 flex justify-center`}>
                {ICONS[stat.icon]}
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${COLOURS[stat.colour]}`}>
                {stat.prefix}
                {displayValues[i]}
                {stat.suffix}
              </div>
              <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={animate}
          disabled={isAnimating}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2.5 rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
        >
          {isAnimating ? 'Animating...' : 'Preview Animation'}
        </button>
        <button
          onClick={copyHtml}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          {copied ? 'Copied!' : 'Copy HTML'}
        </button>
      </div>

      {/* Note */}
      <p className="text-sm text-slate-500 italic mt-5 flex items-start gap-2">
        <span className="text-amber-500 text-base leading-5" aria-hidden="true">💡</span>
        Page builder plugins charge per site for animated counters. This is built into every website I create.
      </p>
    </div>
  );
}
