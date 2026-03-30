import { useState, useEffect, useCallback } from 'react';

interface Story {
  before: string;
  after: string;
  client: string;
  link?: string;
}

const stories: Story[] = [
  {
    before: 'A plumber was quoting jobs on the back of an envelope.',
    after: 'Now he sends professional quotes from his phone in 30 seconds.',
    client: 'Custom quoting tool',
    link: '/playground#quote-builder',
  },
  {
    before: 'A dog field owner was taking bookings by phone and text.',
    after: 'Now customers book online and get a gate access code automatically.',
    client: 'Fakenham Dog Field',
    link: '/blog/building-fakenham-dog-field',
  },
  {
    before: 'A gym owner couldn\'t get found on Google.',
    after: 'Now they\'re on page one in the UK for "used gym equipment."',
    client: 'Millers Fitness',
  },
  {
    before: 'A horsebox hire company was managing bookings in a spreadsheet.',
    after: 'Now they have a platform that handles licences, deposits, and signatures.',
    client: 'Wee Horsebox Hire',
    link: '/blog/building-horsebox-hire-software',
  },
  {
    before: 'A confidence coach was running his business through WhatsApp groups.',
    after: 'Now he has a native iOS app with video lessons, habit tracking, and analytics.',
    client: 'Ask Stephen',
    link: '/blog/building-ask-stephen',
  },
  {
    before: 'An eBay seller was copy-pasting listings into Shopify one at a time.',
    after: 'A Python script now processes the entire catalogue in seconds.',
    client: 'Retail automation',
    link: '/playground#ebay-converter',
  },
];

const DISPLAY_DURATION = 5000;
const FADE_DURATION = 600;

export default function StoryTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible');
  const [isPaused, setIsPaused] = useState(false);

  const advance = useCallback(() => {
    setPhase('fading');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
      setPhase('visible');
    }, FADE_DURATION);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = setInterval(advance, DISPLAY_DURATION);
    return () => clearInterval(timer);
  }, [advance, isPaused]);

  const story = stories[currentIndex];

  const goTo = (index: number) => {
    if (index === currentIndex) return;
    setPhase('fading');
    setTimeout(() => {
      setCurrentIndex(index);
      setPhase('visible');
    }, FADE_DURATION);
  };

  return (
    <div
      className="py-12 md:py-16"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
        {/* Story content */}
        <div
          className={`transition-all min-h-[140px] flex flex-col items-center justify-center ${
            phase === 'visible'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
          aria-live="polite"
        >
          {/* Before */}
          <p className="text-slate-400 text-lg md:text-xl mb-3 line-through decoration-slate-300 decoration-1">
            {story.before}
          </p>

          {/* After */}
          <p className="text-slate-900 text-lg md:text-xl font-semibold mb-4">
            {story.after}
          </p>

          {/* Client attribution */}
          {story.link ? (
            <a
              href={story.link}
              className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-medium hover:underline"
            >
              {story.client}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <span className="text-sm text-slate-500 font-medium">{story.client}</span>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-6" role="tablist" aria-label="Client stories">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Story ${i + 1}`}
              className={`transition-all duration-300 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${
                i === currentIndex
                  ? ''
                  : ''
              }`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-8 h-2 bg-amber-500'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
