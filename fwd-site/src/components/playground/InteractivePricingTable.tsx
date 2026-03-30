import { useState, useEffect, useRef } from 'react';

interface Feature {
  text: string;
  included: boolean;
}

interface Tier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: Feature[];
  highlighted: boolean;
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: 'Starter',
    monthlyPrice: 299,
    annualPrice: 249,
    description: 'Perfect for small businesses getting started online.',
    features: [
      { text: 'Up to 5 pages', included: true },
      { text: 'Mobile responsive', included: true },
      { text: 'Basic SEO', included: true },
      { text: 'Contact form', included: true },
      { text: '1 revision round', included: true },
      { text: '2 week delivery', included: true },
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    monthlyPrice: 799,
    annualPrice: 649,
    description: 'For growing businesses that need more features.',
    features: [
      { text: 'Up to 15 pages', included: true },
      { text: 'Mobile responsive', included: true },
      { text: 'Advanced SEO', included: true },
      { text: 'Contact form', included: true },
      { text: 'Blog setup', included: true },
      { text: '3 revision rounds', included: true },
      { text: 'Priority support', included: true },
      { text: '3 week delivery', included: true },
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: 1999,
    annualPrice: 1599,
    description: 'Full-scale solution with everything included.',
    features: [
      { text: 'Unlimited pages', included: true },
      { text: 'Mobile responsive', included: true },
      { text: 'Full SEO strategy', included: true },
      { text: 'Custom forms', included: true },
      { text: 'Blog + CMS', included: true },
      { text: 'Unlimited revisions', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom timeline', included: true },
      { text: 'API integrations', included: true },
    ],
    highlighted: false,
  },
];

function AnimatedPrice({ value, prefix = '£' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const duration = 400;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return (
    <span>
      {prefix}{display.toLocaleString('en-GB')}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function InteractivePricingTable() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);

  const updateTier = (index: number, field: keyof Tier, value: any) => {
    setTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateFeature = (tierIndex: number, featureIndex: number, text: string) => {
    setTiers((prev) => {
      const next = [...prev];
      const features = [...next[tierIndex].features];
      features[featureIndex] = { ...features[featureIndex], text };
      next[tierIndex] = { ...next[tierIndex], features };
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Interactive Pricing Table</h3>
      <p className="text-sm text-slate-500 mb-5">
        A premium pricing toggle with animated price switching. Click "Edit" on any tier to customise.
      </p>

      {/* Monthly/Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className="relative w-14 h-8 rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 min-h-[44px] flex items-center"
          role="switch"
          aria-checked={isAnnual}
          aria-label="Toggle annual pricing"
          style={{ backgroundColor: isAnnual ? '#f59e0b' : '#e2e8f0' }}
        >
          <span
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300"
            style={{ transform: isAnnual ? 'translateX(28px)' : 'translateX(4px)' }}
          />
        </button>
        <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>
          Annual
          <span className="ml-1 text-xs text-emerald-600 font-semibold">Save 20%</span>
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {tiers.map((tier, i) => (
          <div
            key={i}
            className={`relative rounded-xl border-2 p-5 transition-all ${
              tier.highlighted
                ? 'border-amber-500 shadow-lg scale-[1.02] sm:scale-105'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            {/* Most Popular badge */}
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
            )}

            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-slate-900">{tier.name}</h4>
              <p className="text-xs text-slate-500 mt-1 min-h-[2rem]">{tier.description}</p>
            </div>

            {/* Price */}
            <div className="text-center mb-5">
              {isAnnual && (
                <div className="text-sm text-slate-400 line-through mb-0.5">
                  £{tier.monthlyPrice.toLocaleString('en-GB')}
                </div>
              )}
              <div className="text-3xl font-bold text-slate-900">
                <AnimatedPrice value={isAnnual ? tier.annualPrice : tier.monthlyPrice} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isAnnual ? 'per project (annual rate)' : 'per project'}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-5" aria-label={`${tier.name} features`}>
              {tier.features.map((feature, fi) => (
                <li key={fi} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors min-h-[44px] ${
                tier.highlighted
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                  : 'border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              Get Started
            </button>

            {/* Edit button */}
            <button
              onClick={() => setEditingTier(editingTier === i ? null : i)}
              className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors min-h-[44px] flex items-center justify-center"
              aria-label={`Edit ${tier.name} tier`}
            >
              {editingTier === i ? 'Close Editor' : 'Edit'}
            </button>

            {/* Edit panel */}
            {editingTier === i && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                <div>
                  <label htmlFor={`tier-name-${i}`} className="text-xs text-slate-500">Tier Name</label>
                  <input
                    id={`tier-name-${i}`}
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(i, 'name', e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`tier-monthly-${i}`} className="text-xs text-slate-500">Monthly (£)</label>
                    <input
                      id={`tier-monthly-${i}`}
                      type="number"
                      value={tier.monthlyPrice}
                      onChange={(e) => updateTier(i, 'monthlyPrice', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`tier-annual-${i}`} className="text-xs text-slate-500">Annual (£)</label>
                    <input
                      id={`tier-annual-${i}`}
                      type="number"
                      value={tier.annualPrice}
                      onChange={(e) => updateTier(i, 'annualPrice', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm min-h-[44px]"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Features</span>
                  {tier.features.map((f, fi) => (
                    <input
                      key={fi}
                      type="text"
                      value={f.text}
                      onChange={(e) => updateFeature(i, fi, e.target.value)}
                      aria-label={`Feature ${fi + 1}`}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs mb-1 min-h-[36px]"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-sm text-slate-500 italic mt-5 flex items-start gap-2">
        <span className="text-amber-500 text-base leading-5" aria-hidden="true">💡</span>
        Pricing table plugins charge £30 to £100 per year. This one is built in, fully customisable, and costs nothing ongoing.
      </p>
    </div>
  );
}
