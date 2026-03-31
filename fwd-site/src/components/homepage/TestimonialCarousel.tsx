import { useState, useEffect, useCallback } from 'react';

const reviews = [
  {
    name: 'Anna Kidd',
    role: 'Director, Harford Attachments Ltd',
    quote: 'Sam really listens to the client\'s brief and adds value to their ideas. He is naturally creative and takes time to understand and produce amazing outcomes. Highly recommended.',
  },
  {
    name: 'Matt Miller',
    role: 'Owner, Millers Fitness',
    quote: "We're on the first page of Google in the UK for 'used gym equipment'. For website building and general techy scheming, Sam knows what he's doing!",
  },
];

function Stars() {
  return (
    <div className="flex items-center justify-center gap-1 mb-6" role="img" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const advance = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setActive((prev) => (prev + 1) % reviews.length);
      setFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance]);

  const review = reviews[active];

  return (
    <div className="text-center max-w-3xl mx-auto">
      <Stars />
      <div
        className="transition-opacity duration-400 ease-in-out min-h-[180px] flex flex-col items-center justify-center"
        style={{ opacity: fading ? 0 : 1 }}
        aria-live="polite"
      >
        <blockquote className="text-2xl md:text-3xl font-light text-white leading-relaxed mb-8">
          &ldquo;{review.quote}&rdquo;
        </blockquote>
        <footer>
          <cite className="not-italic">
            <span className="block text-lg font-semibold text-white">{review.name}</span>
            <span className="block text-sm text-gray-400 mt-1">{review.role}</span>
          </cite>
        </footer>
      </div>
      {/* Indicator dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setActive(i); setFading(false); }, 400); }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === active ? 'bg-amber-400 w-6' : 'bg-white/30 hover:bg-white/50'}`}
            aria-label={`Show review ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
