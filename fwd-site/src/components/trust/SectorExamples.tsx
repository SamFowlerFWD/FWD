import React, { useState, useEffect, useRef } from 'react';

interface Example {
  id: number;
  sector: string;
  icon: string;
  challenge: string;
  solution: string;
  impact: string;
  timeAgo: string;
}

const sectorExamples: Example[] = [
  {
    id: 1,
    sector: "Retail",
    icon: "🛍️",
    challenge: "Hours spent answering the same customer questions",
    solution: "AI chatbot handles FAQs about opening hours, stock, returns",
    impact: "Staff free for actual selling",
    timeAgo: "2 hours ago"
  },
  {
    id: 2,
    sector: "Manufacturing",
    icon: "🏭",
    challenge: "Manual counting of inventory takes all day",
    solution: "Phone camera + AI counts stock in seconds",
    impact: "Instant stocktakes, zero errors",
    timeAgo: "4 hours ago"
  },
  {
    id: 3,
    sector: "Healthcare",
    icon: "🏥",
    challenge: "Receptionist tied up booking appointments",
    solution: "AI books appointments via text/WhatsApp 24/7",
    impact: "Never miss a booking again",
    timeAgo: "5 hours ago"
  },
  {
    id: 4,
    sector: "Hospitality",
    icon: "🍽️",
    challenge: "Missing calls during busy service",
    solution: "AI answers, takes bookings, handles enquiries",
    impact: "Every call answered, every booking captured",
    timeAgo: "6 hours ago"
  },
  {
    id: 5,
    sector: "Professional Services",
    icon: "💼",
    challenge: "Typing up meeting notes takes hours",
    solution: "AI transcribes & summarises meetings instantly",
    impact: "Focus on clients, not admin",
    timeAgo: "Yesterday"
  },
  {
    id: 6,
    sector: "Logistics",
    icon: "🚚",
    challenge: "Manually planning delivery routes wastes fuel",
    solution: "AI finds fastest routes in seconds",
    impact: "30% less fuel, happier drivers",
    timeAgo: "Yesterday"
  },
  {
    id: 7,
    sector: "Agriculture",
    icon: "🌾",
    challenge: "Walking fields to check crops takes all day",
    solution: "AI analyses drone photos for issues",
    impact: "Spot problems before they spread",
    timeAgo: "2 days ago"
  },
  {
    id: 8,
    sector: "Education",
    icon: "🎓",
    challenge: "Creating personalised feedback for each student",
    solution: "AI generates first draft of feedback",
    impact: "More time for actual teaching",
    timeAgo: "2 days ago"
  },
  {
    id: 9,
    sector: "Retail",
    icon: "🛍️",
    challenge: "Writing product descriptions for hundreds of items",
    solution: "AI writes SEO-optimised descriptions from photos",
    impact: "List products 10x faster",
    timeAgo: "3 days ago"
  },
  {
    id: 10,
    sector: "Construction",
    icon: "🏗️",
    challenge: "Chasing invoices and quotes by phone",
    solution: "AI follows up automatically via email/text",
    impact: "Get paid faster, quote more",
    timeAgo: "3 days ago"
  },
  {
    id: 11,
    sector: "Healthcare",
    icon: "🏥",
    challenge: "Patients forget post-appointment instructions",
    solution: "AI sends personalised follow-up reminders",
    impact: "Better outcomes, fewer repeat visits",
    timeAgo: "4 days ago"
  },
  {
    id: 12,
    sector: "Manufacturing",
    icon: "🏭",
    challenge: "Excel spreadsheets for production planning",
    solution: "AI predicts demand and suggests schedules",
    impact: "Less waste, no stockouts",
    timeAgo: "4 days ago"
  },
  {
    id: 13,
    sector: "Professional Services",
    icon: "💼",
    challenge: "Reading through long contracts for key points",
    solution: "AI highlights important clauses instantly",
    impact: "Review contracts in minutes not hours",
    timeAgo: "5 days ago"
  },
  {
    id: 14,
    sector: "Hospitality",
    icon: "🍽️",
    challenge: "Guessing tomorrow's covers for food prep",
    solution: "AI predicts busy periods from past data",
    impact: "Less food waste, no shortages",
    timeAgo: "5 days ago"
  },
  {
    id: 15,
    sector: "Retail",
    icon: "🛍️",
    challenge: "Social media posts take hours to create",
    solution: "AI creates posts from product photos",
    impact: "Daily posts in 5 minutes",
    timeAgo: "1 week ago"
  },
  {
    id: 16,
    sector: "Logistics",
    icon: "🚚",
    challenge: "Customers calling to ask 'where's my delivery?'",
    solution: "AI texts automatic delivery updates",
    impact: "80% fewer support calls",
    timeAgo: "1 week ago"
  },
  {
    id: 17,
    sector: "Healthcare",
    icon: "🏥",
    challenge: "Staff rotas changed multiple times a week",
    solution: "AI suggests optimal shifts based on demand",
    impact: "Happy staff, covered shifts",
    timeAgo: "1 week ago"
  },
  {
    id: 18,
    sector: "Education",
    icon: "🎓",
    challenge: "Parents asking the same questions repeatedly",
    solution: "AI parent portal answers common queries",
    impact: "Teachers teach, not email",
    timeAgo: "2 weeks ago"
  },
  {
    id: 19,
    sector: "Agriculture",
    icon: "🌾",
    challenge: "Greenhouse heating on 24/7 wastes money",
    solution: "AI adjusts temperature based on weather",
    impact: "30% lower energy bills",
    timeAgo: "2 weeks ago"
  },
  {
    id: 20,
    sector: "Professional Services",
    icon: "💼",
    challenge: "Sorting through 100s of CVs for one role",
    solution: "AI shortlists best matches in seconds",
    impact: "Find perfect candidates faster",
    timeAgo: "2 weeks ago"
  }
];

// Unique sectors for filter tags
const sectors = Array.from(new Set(sectorExamples.map(ex => ex.sector))).sort();

const SectorExamples: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const itemHeightRef = useRef<number>(80); // Approximate height of each item

  // Filter examples based on selected sector
  const filteredExamples = selectedSector
    ? sectorExamples.filter(ex => ex.sector === selectedSector)
    : sectorExamples;

  // Double the examples array to create seamless loop
  const doubledExamples = [...filteredExamples, ...filteredExamples];

  useEffect(() => {
    // Measure actual item height after render
    if (scrollRef.current) {
      const firstItem = scrollRef.current.querySelector('.example-item');
      if (firstItem) {
        const height = firstItem.getBoundingClientRect().height + 12; // Include gap
        itemHeightRef.current = height;
      }
    }
  }, [filteredExamples]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      if (!isPaused) {
        const deltaTime = timestamp - lastTimeRef.current;
        const speed = 0.03; // Pixels per millisecond (adjust for desired speed)
        
        setTranslateY(prev => {
          const newTranslate = prev - (deltaTime * speed);
          const totalHeight = filteredExamples.length * itemHeightRef.current;
          
          // Reset to beginning when we've scrolled through all original items
          if (Math.abs(newTranslate) >= totalHeight) {
            return 0;
          }
          return newTranslate;
        });
      }
      
      lastTimeRef.current = timestamp;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, filteredExamples]);

  const handleSectorClick = (sector: string) => {
    if (selectedSector === sector) {
      // Deselect
      setSelectedSector(null);
      setTranslateY(0); // Reset scroll position
    } else {
      // Select new sector
      setSelectedSector(sector);
      setTranslateY(0); // Reset scroll position
      setIsPaused(false);
    }
  };

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div 
      className="sector-examples bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
      data-component="sector-examples"
      ref={containerRef}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            See What AI Could Do For Your Business
          </h3>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Real solutions businesses are using right now
        </p>
      </div>

      {/* Sector Filter Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedSector(null)}
          className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
            !selectedSector 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Sectors
        </button>
        {sectors.map(sector => (
          <button
            key={sector}
            onClick={() => handleSectorClick(sector)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              selectedSector === sector 
                ? 'bg-purple-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Rolling Examples */}
      <div 
        className="overflow-hidden relative h-[400px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={scrollRef}
          className="space-y-3"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: 'none', // No CSS transition, we're using requestAnimationFrame for smoothness
          }}
        >
          {doubledExamples.map((example, index) => (
            <div 
              key={`${example.id}-${index}`}
              className="example-item"
            >
              <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200 hover:border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{example.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {example.sector}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                        {example.timeAgo}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="text-red-600 font-medium">The Problem:</span> {example.challenge}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="text-purple-600 font-medium">AI Solution:</span> {example.solution}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        ✅ {example.impact}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Fade gradients at top and bottom */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {isPaused ? 'Paused' : 'Auto-scrolling'} • {filteredExamples.length} examples
            {selectedSector && ` in ${selectedSector}`}
          </p>
          <button 
            onClick={() => {
              const calculator = document.querySelector('[data-component="ai-calculator"]');
              calculator?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Calculate your savings →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectorExamples;