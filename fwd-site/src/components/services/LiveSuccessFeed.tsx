import React, { useState, useEffect } from 'react';

interface SuccessItem {
  id: number;
  type: 'automation' | 'website' | 'app' | 'hosting';
  company: string;
  location: string;
  metric: string;
  value: string;
  timeAgo: string;
  icon: string;
}

const LiveSuccessFeed: React.FC = () => {
  const [items, setItems] = useState<SuccessItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const successStories: SuccessItem[] = [
    {
      id: 1,
      type: 'automation',
      company: 'Norwich Manufacturing Ltd',
      location: 'Norwich',
      metric: 'Time saved',
      value: '32 hours/week',
      timeAgo: '2 hours ago',
      icon: '⚡'
    },
    {
      id: 2,
      type: 'website',
      company: 'Suffolk Retail Co',
      location: 'Bury St Edmunds',
      metric: 'Conversion increase',
      value: '+240%',
      timeAgo: '4 hours ago',
      icon: '🚀'
    },
    {
      id: 3,
      type: 'app',
      company: 'East Coast Logistics',
      location: 'Great Yarmouth',
      metric: 'Cost reduction',
      value: '£8,400/month',
      timeAgo: '6 hours ago',
      icon: '💰'
    },
    {
      id: 4,
      type: 'hosting',
      company: 'Norfolk Services Group',
      location: 'King\'s Lynn',
      metric: 'Uptime improved',
      value: '99.99%',
      timeAgo: '8 hours ago',
      icon: '✨'
    },
    {
      id: 5,
      type: 'automation',
      company: 'Cambridge Tech Solutions',
      location: 'Cambridge',
      metric: 'Orders processed',
      value: '+450/day',
      timeAgo: '12 hours ago',
      icon: '📈'
    },
    {
      id: 6,
      type: 'website',
      company: 'Norfolk Farms Direct',
      location: 'Dereham',
      metric: 'Sales increased',
      value: '+£12,000/month',
      timeAgo: '1 day ago',
      icon: '🎯'
    },
    {
      id: 7,
      type: 'app',
      company: 'Suffolk Transport Ltd',
      location: 'Ipswich',
      metric: 'Efficiency boost',
      value: '+85%',
      timeAgo: '1 day ago',
      icon: '🏆'
    },
    {
      id: 8,
      type: 'automation',
      company: 'Broads Tourism Co',
      location: 'Wroxham',
      metric: 'Bookings automated',
      value: '100%',
      timeAgo: '2 days ago',
      icon: '🎉'
    }
  ];

  useEffect(() => {
    // Initialize with first 4 items
    setItems(successStories.slice(0, 4));

    // Rotate items every 5 seconds
    const interval = setInterval(() => {
      setItems(prevItems => {
        const newItems = [...prevItems];
        newItems.shift(); // Remove first item
        
        // Find next item not currently displayed
        const displayedIds = newItems.map(item => item.id);
        const nextItem = successStories.find(story => !displayedIds.includes(story.id));
        
        if (nextItem) {
          newItems.push(nextItem);
        } else {
          // Start over with first item
          newItems.push(successStories[0]);
        }
        
        return newItems;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: SuccessItem['type']) => {
    switch (type) {
      case 'automation': return 'from-ai-purple to-trust-blue';
      case 'website': return 'from-success-green to-trust-blue';
      case 'app': return 'from-urgent-amber to-ai-purple';
      case 'hosting': return 'from-trust-blue to-success-green';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTypeLabel = (type: SuccessItem['type']) => {
    switch (type) {
      case 'automation': return 'Process Automated';
      case 'website': return 'Website Launched';
      case 'app': return 'App Deployed';
      case 'hosting': return 'Hosting Upgraded';
      default: return 'Success';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success-green rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-deep-space">Live Success Feed</h3>
          <span className="text-xs text-gray-500">Norfolk & Suffolk</span>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Success Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 transition-all duration-500 ${
              index === 0 ? 'animate-slide-in-top' : ''
            }`}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(item.type)} flex items-center justify-center text-white flex-shrink-0`}>
              <span className="text-lg">{item.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-deep-space truncate">
                    {item.company}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {item.location}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{item.timeAgo}</span>
              </div>
              
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getTypeColor(item.type)} text-white font-medium`}>
                  {getTypeLabel(item.type)}
                </span>
                <span className="text-xs text-gray-600">
                  {item.metric}: <span className="font-bold text-success-green">{item.value}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            <span className="font-bold text-deep-space">287</span> businesses transformed
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-bold text-success-green">£2.4M</span> saved this year
          </div>
        </div>
        <a href="#testimonials" className="text-xs text-ai-purple hover:text-ai-purple/80 font-medium transition-colors">
          View all →
        </a>
      </div>

      {/* Animated background gradient */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-ai-purple/10 to-trust-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
    </div>
  );
};

export default LiveSuccessFeed;