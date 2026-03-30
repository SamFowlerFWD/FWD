import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const article = document.querySelector('.prose');
    if (!article) return;

    const h2s = article.querySelectorAll('h2');
    const items: TocItem[] = Array.from(h2s).map((h2) => {
      if (!h2.id) {
        h2.id = h2.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim() || '';
      }
      return {
        id: h2.id,
        text: h2.textContent || '',
        level: 2,
      };
    });
    setHeadings(items);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 min-h-[44px]"
          aria-expanded={isOpen}
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Contents
        </button>
        {isOpen && (
          <nav aria-label="Table of contents" className="mt-2 pl-4 border-l-2 border-slate-200">
            <ul className="space-y-2">
              {headings.map(({ id, text }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setIsOpen(false)}
                    className={`text-sm block py-1 transition-colors ${
                      activeId === id
                        ? 'text-purple-600 font-medium'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop sidebar */}
      <nav
        aria-label="Table of contents"
        className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Contents</h3>
        <ul className="space-y-2 border-l-2 border-slate-200 pl-4">
          {headings.map(({ id, text }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`text-sm block py-1 transition-colors ${
                  activeId === id
                    ? 'text-purple-600 font-medium border-l-2 border-purple-600 -ml-[calc(1rem+2px)] pl-4'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
