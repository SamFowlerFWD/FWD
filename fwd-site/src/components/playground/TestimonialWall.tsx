import { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  quote: string;
  tags: string[];
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Anna K',
    role: 'Director',
    company: 'Harford Attachments',
    quote:
      "Sam really listens to the client's brief and adds value to their ideas. He is naturally creative and takes time to understand and produce amazing outcomes.",
    tags: ['Websites'],
  },
  {
    id: 2,
    name: 'Matt M',
    role: 'Owner',
    company: 'Millers Fitness',
    quote:
      "We're on the first page of Google in the UK for 'used gym equipment'. For website building and general techy scheming, Sam knows what he's doing!",
    tags: ['Websites'],
  },
  {
    id: 3,
    name: 'Sarah T',
    role: 'Founder',
    company: 'Pet Grooming Studio',
    quote:
      'Our online bookings went from zero to 40+ per week within a month of launching. The system just works.',
    tags: ['Apps', 'Automation'],
  },
  {
    id: 4,
    name: 'James R',
    role: 'Managing Director',
    company: 'JR Construction',
    quote:
      'Finally have a website that shows off our work properly. The before and after gallery gets us more enquiries than anything else.',
    tags: ['Websites'],
  },
  {
    id: 5,
    name: 'Lisa D',
    role: 'Photographer',
    company: 'Wedding Photographer',
    quote:
      'Sam built exactly what I described. Fast site, beautiful gallery, and clients can book directly. No more back-and-forth emails.',
    tags: ['Websites', 'Apps'],
  },
  {
    id: 6,
    name: 'Tom H',
    role: 'Owner',
    company: 'Auto Repairs',
    quote:
      'The automated invoice reminders alone saved me hours every week. Should have done this years ago.',
    tags: ['Automation'],
  },
  {
    id: 7,
    name: 'Rachel M',
    role: 'Salon Manager',
    company: 'Salon 64',
    quote:
      'Professional, easy to work with, and the finished site looks amazing. Our Google presence has completely changed.',
    tags: ['Websites'],
  },
  {
    id: 8,
    name: 'David P',
    role: 'Partner',
    company: 'Accounting Firm',
    quote:
      'The client portal Sam built has transformed how we work. Documents, messages, everything in one place. Our clients love it.',
    tags: ['Apps', 'Automation'],
  },
];

const FILTERS = ['All', 'Websites', 'Apps', 'Automation'];

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-2" aria-label="5 out of 5 stars">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const AVATAR_COLOURS = [
  'bg-purple-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export default function TestimonialWall() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());

  const filtered =
    activeFilter === 'All'
      ? TESTIMONIALS
      : TESTIMONIALS.filter((t) => t.tags.includes(activeFilter));

  // Staggered animation on mount and filter change
  useEffect(() => {
    setVisibleIds(new Set());
    const ids = filtered.map((t) => t.id);
    ids.forEach((id, i) => {
      setTimeout(() => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }, i * 80);
    });
  }, [activeFilter]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Testimonial Wall</h3>
      <p className="text-sm text-slate-500 mb-4">
        A premium masonry-style review section. No plugins needed.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter testimonials">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            aria-pressed={activeFilter === filter}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-all ${
              activeFilter === filter
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Masonry grid using CSS columns */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {filtered.map((testimonial) => (
          <div
            key={testimonial.id}
            className={`break-inside-avoid bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${
              visibleIds.has(testimonial.id)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={{ transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease' }}
          >
            <StarRating />
            <p className="text-sm text-slate-700 leading-relaxed mb-3">"{testimonial.quote}"</p>
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  AVATAR_COLOURS[testimonial.id % AVATAR_COLOURS.length]
                }`}
                aria-hidden="true"
              >
                {getInitials(testimonial.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900">{testimonial.name}</span>
                  <svg
                    className="w-4 h-4 text-blue-500 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-label="Verified"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-slate-500">
                  {testimonial.role}, {testimonial.company}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-400 py-8">No testimonials match this filter.</p>
      )}

      {/* Note */}
      <p className="text-sm text-slate-500 italic mt-5 flex items-start gap-2">
        <span className="text-amber-500 text-base leading-5" aria-hidden="true">💡</span>
        Testimonial plugins cost £50 to £200 per year. A custom review wall is a one-off build that looks better and loads faster.
      </p>
    </div>
  );
}
