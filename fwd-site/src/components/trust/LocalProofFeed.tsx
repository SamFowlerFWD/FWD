import React, { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  business: string;
  location: string;
  action: string;
  result: string;
  timeAgo: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    business: "Norfolk Logistics Ltd",
    location: "Norwich",
    action: "automated invoice processing",
    result: "Saving 15 hours/week",
    timeAgo: "2 hours ago",
  },
  {
    id: 2,
    business: "East Coast Manufacturing",
    location: "Great Yarmouth",
    action: "implemented AI quality control",
    result: "80% fewer defects",
    timeAgo: "5 hours ago",
  },
  {
    id: 3,
    business: "Suffolk Foods Co",
    location: "Bury St Edmunds",
    action: "launched customer chatbot",
    result: "24/7 support coverage",
    timeAgo: "Yesterday",
  },
  {
    id: 4,
    business: "Lynn Digital Services",
    location: "King's Lynn",
    action: "deployed AI analytics",
    result: "3x faster insights",
    timeAgo: "2 days ago",
  },
  {
    id: 5,
    business: "Broads Tech Solutions",
    location: "Wroxham",
    action: "automated data entry",
    result: "Zero manual errors",
    timeAgo: "3 days ago",
  },
  {
    id: 6,
    business: "Coastal Retail Group",
    location: "Cromer",
    action: "integrated inventory AI",
    result: "45% less overstock",
    timeAgo: "4 days ago",
  },
  {
    id: 7,
    business: "Norwich Financial Advisory",
    location: "Norwich",
    action: "built compliance automation",
    result: "100% audit ready",
    timeAgo: "5 days ago",
  },
  {
    id: 8,
    business: "Fenland Agriculture",
    location: "Ely",
    action: "created yield predictor",
    result: "20% better forecasts",
    timeAgo: "1 week ago",
  }
];

const LocalProofFeed: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [visibleItems, setVisibleItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    // Initialize visible items
    setVisibleItems([
      testimonials[0],
      testimonials[1],
      testimonials[2]
    ]);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % testimonials.length;
        const nextThree = [
          testimonials[nextIndex],
          testimonials[(nextIndex + 1) % testimonials.length],
          testimonials[(nextIndex + 2) % testimonials.length]
        ];
        setVisibleItems(nextThree);
        return nextIndex;
      });
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div 
      className="local-proof-feed bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
      data-component="local-proof"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-deep-space">Live Activity Feed</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success-green"></span>
          </span>
          <span className="text-sm text-gray-500">Norfolk & Suffolk</span>
        </div>
      </div>

      <div className="space-y-4">
        {visibleItems.map((item, index) => (
          <div 
            key={`${item.id}-${currentIndex}`}
            className={`testimonial-item transition-all duration-500 ${
              index === 0 ? 'opacity-100 scale-100' : 'opacity-75 scale-95'
            }`}
            style={{
              animation: `slideUp 0.5s ease-out ${index * 0.1}s`
            }}
          >
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ai-purple to-trust-blue flex items-center justify-center text-white font-bold">
                {item.business[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-deep-space">{item.business}</span>
                  <span className="text-xs text-gray-500">• {item.location}</span>
                </div>
                <p className="text-sm text-gray-700">
                  Just {item.action}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-success-green bg-success-green/10 px-2 py-1 rounded">
                    {item.result}
                  </span>
                  <span className="text-xs text-gray-400">{item.timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-trust-blue" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm text-gray-600">Verified client activity</span>
          </div>
          <button className="text-sm text-trust-blue hover:text-ai-purple transition-colors font-medium">
            View all →
          </button>
        </div>
      </div>

    </div>
  );
};

export default LocalProofFeed;