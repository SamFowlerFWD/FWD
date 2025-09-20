import React, { useState, useEffect } from 'react';

interface Service {
  name: string;
  price: string;
  href: string;
  icon: string;
}

const StickyServiceBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const services: Service[] = [
    { 
      name: 'Automation', 
      price: 'From £799/mo', 
      href: '/services/business-process-automation',
      icon: '⚡'
    },
    { 
      name: 'AI Websites', 
      price: 'From £1,299', 
      href: '/services/ai-powered-websites',
      icon: '🌐'
    },
    { 
      name: 'Custom Apps', 
      price: 'From £15k', 
      href: '/services/custom-app-development',
      icon: '📱'
    },
    { 
      name: 'AI Hosting', 
      price: 'From £99/mo', 
      href: '/services/ai-hosting-maintenance',
      icon: '🚀'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show bar after scrolling 500px down and when scrolling up
      if (currentScrollY > 500) {
        if (currentScrollY < lastScrollY) {
          // Scrolling up
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY && currentScrollY > 600) {
          // Scrolling down and past threshold
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-2xl border-t border-gray-200 z-40 transform transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Services Grid */}
          <div className="hidden lg:flex items-center gap-4 flex-1">
            {services.map((service, index) => (
              <a
                key={index}
                href={service.href}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ai-purple/5 transition-all duration-200"
              >
                <span className="text-xl">{service.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-deep-space group-hover:text-ai-purple transition-colors">
                    {service.name}
                  </div>
                  <div className="text-xs text-success-green font-medium">{service.price}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Mobile: Scrollable Services */}
          <div className="lg:hidden flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1">
            {services.map((service, index) => (
              <a
                key={index}
                href={service.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <span className="text-lg">{service.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-deep-space">{service.name}</div>
                  <div className="text-xs text-success-green">{service.price}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Bundle Offer */}
          <div className="hidden md:flex items-center gap-3 ml-4 px-4 py-2 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/20">
            <div>
              <p className="text-xs text-gray-700">Bundle & Save</p>
              <p className="text-sm font-bold text-gold">35% OFF</p>
            </div>
            <svg className="w-5 h-5 text-gold animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* CTA Button */}
          <button className="ml-4 bg-gold hover:bg-gold/90 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap animate-pulse-subtle">
            Get Free Quote
          </button>
        </div>

        {/* Urgency Message - Mobile Only */}
        <div className="md:hidden mt-3 text-center">
          <p className="text-xs text-gold font-medium">
            🔥 17 Norfolk businesses automated this week
          </p>
        </div>
      </div>
    </div>
  );
};

export default StickyServiceBar;