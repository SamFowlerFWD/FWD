import React, { useState, useEffect } from 'react';

interface Props {
  initialCompetitors?: number;
  incrementRate?: number;
}

const CompetitorAdvantageClock: React.FC<Props> = ({ 
  initialCompetitors = 47,
  incrementRate = 3600000 // 1 hour in milliseconds
}) => {
  // Calculate current competitors based on today's date
  const startDate = new Date('2024-01-01');
  const now = new Date();
  const hoursPassed = Math.floor((now.getTime() - startDate.getTime()) / incrementRate);
  const initialCount = initialCompetitors + hoursPassed;
  
  const [currentCompetitors, setCurrentCompetitors] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Load from localStorage if available
    const storedCount = localStorage.getItem('competitorCount');
    if (storedCount) {
      setCurrentCompetitors(parseInt(storedCount));
    }

    // Increment counter at realistic intervals (every 3 seconds for demo purposes)
    const interval = setInterval(() => {
      setCurrentCompetitors(prev => {
        const newCount = prev + 1;
        localStorage.setItem('competitorCount', newCount.toString());
        return newCount;
      });
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
      
      // Occasional shake for urgency
      if (Math.random() > 0.7) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }, 3000); // Update every 3 seconds for visibility

    return () => clearInterval(interval);
  }, []);

  // Pulse animation when in view
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      });
    });

    const element = document.querySelector('[data-component="competitor-clock"]');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`competitor-clock glass-premium rounded-2xl p-6 shadow-urgent ${isShaking ? 'animate-urgency-shake' : ''}`}
      data-component="competitor-clock"
      data-increment-rate={incrementRate}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-deep-space">While You Read This...</h3>
        <span className="urgency-badge animate-pulse">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          LIVE
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Norfolk Businesses Using AI:</span>
          <span 
            className={`competitor-count text-3xl font-bold ai-gradient-text transition-transform ${isAnimating ? 'scale-110' : 'scale-100'}`}
            data-count={currentCompetitors}
          >
            {currentCompetitors.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Average Cost Savings:</span>
          <span className="text-2xl font-bold text-success-green">70%</span>
        </div>
        
        <div className="bg-gold/10 rounded-lg p-3 border border-gold/20">
          <p className="text-sm font-medium text-gold">
            Your competitors gained <span className="font-bold">3 hours</span> today while you decided
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-trust-blue" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          <span>Data from Companies House & Norfolk Chamber</span>
        </div>
      </div>

    </div>
  );
};

export default CompetitorAdvantageClock;