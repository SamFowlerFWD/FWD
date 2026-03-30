import { useState, useEffect, useRef, useCallback } from 'react';

interface DemoItem {
  id: string;
  label: string;
  icon: string;
}

interface Category {
  key: string;
  label: string;
  colour: string;
  activeColour: string;
  bgColour: string;
  description: string;
  items: DemoItem[];
}

const categories: Category[] = [
  {
    key: 'automation',
    label: 'Business Automation',
    colour: 'text-amber-700',
    activeColour: 'bg-amber-500 text-slate-900',
    bgColour: 'bg-amber-50 border-amber-200',
    description: 'Tools that save you hours every week',
    items: [
      { id: 'ebay-converter', label: 'Listing Converter', icon: '📦' },
      { id: 'quote-builder', label: 'Quote Builder', icon: '📋' },
      { id: 'booking-demo', label: 'Booking System', icon: '📅' },
      { id: 'email-sequences', label: 'Email Automation', icon: '✉️' },
      { id: 'review-responder', label: 'Review Responder', icon: '⭐' },
      { id: 'roi-calculator', label: 'ROI Calculator', icon: '💰' },
    ],
  },
  {
    key: 'components',
    label: 'Website Components',
    colour: 'text-purple-700',
    activeColour: 'bg-purple-600 text-white',
    bgColour: 'bg-purple-50 border-purple-200',
    description: 'Premium features, zero plugin fees',
    items: [
      { id: 'before-after', label: 'Before/After', icon: '📸' },
      { id: 'qr-generator', label: 'QR Codes', icon: '🔗' },
      { id: 'social-preview', label: 'Social Preview', icon: '👀' },
      { id: 'stats-builder', label: 'Stats Section', icon: '📈' },
      { id: 'testimonial-wall', label: 'Testimonials', icon: '💬' },
      { id: 'pricing-table', label: 'Pricing Table', icon: '💲' },
    ],
  },
];

export default function PlaygroundNav() {
  const [activeCategory, setActiveCategory] = useState('automation');
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  // Track which demo is currently in view
  useEffect(() => {
    const allIds = categories.flatMap(c => c.items.map(i => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.id;
          setActiveDemo(id);

          // Update active category based on which demo is visible
          const cat = categories.find(c => c.items.some(i => i.id === id));
          if (cat) setActiveCategory(cat.key);
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5] }
    );

    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Compact mode when scrolled past hero
  useEffect(() => {
    const onScroll = () => {
      setIsCompact(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll active item into view in the nav
  useEffect(() => {
    if (!activeDemo || !itemsRef.current) return;
    const activeEl = itemsRef.current.querySelector(`[data-demo-id="${activeDemo}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeDemo]);

  const scrollToDemo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 180; // account for sticky nav + main nav
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const currentCategory = categories.find(c => c.key === activeCategory)!;
  const progress = (() => {
    const items = currentCategory.items;
    const idx = items.findIndex(i => i.id === activeDemo);
    if (idx === -1) return 0;
    return ((idx + 1) / items.length) * 100;
  })();

  return (
    <nav
      ref={navRef}
      aria-label="Playground demos"
      className={`sticky top-[80px] z-40 transition-all duration-300 ${
        isCompact ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      {/* Category Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center gap-1 py-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              const count = cat.items.length;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    scrollToDemo(cat.items[0].id);
                  }}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[44px]
                    ${isActive
                      ? cat.activeColour + ' shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <span>{cat.label}</span>
                  <span className={`
                    inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                    ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Category description */}
            <span className="hidden md:block ml-auto text-sm text-slate-400 italic">
              {currentCategory.description}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Items Row */}
      <div className={`border-b transition-all duration-300 ${currentCategory.bgColour}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div
            ref={itemsRef}
            className="flex gap-1.5 py-2 overflow-x-auto scrollbar-hide"
          >
            {currentCategory.items.map((item, idx) => {
              const isActive = activeDemo === item.id;
              const isPast = (() => {
                const activeIdx = currentCategory.items.findIndex(i => i.id === activeDemo);
                return activeIdx >= 0 && idx < activeIdx;
              })();

              return (
                <button
                  key={item.id}
                  data-demo-id={item.id}
                  onClick={() => scrollToDemo(item.id)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 min-h-[44px]
                    ${isActive
                      ? 'bg-white shadow-md text-slate-900 scale-[1.02]'
                      : isPast
                        ? 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm'
                        : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                    }
                  `}
                >
                  <span className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-black/5">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              activeCategory === 'automation' ? 'bg-amber-500' : 'bg-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
