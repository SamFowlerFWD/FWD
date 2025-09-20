import React, { useState, useEffect, useRef } from 'react';

interface Props {
  dailyLoss?: number;
  businessType?: string;
}

const RevenueLossCounter: React.FC<Props> = ({ 
  dailyLoss = 847,
  businessType = "without automation"
}) => {
  const hourlyLoss = Math.round(dailyLoss / 24);
  const minuteLoss = Math.round(hourlyLoss / 60);
  const secondLoss = minuteLoss / 60;
  const pencePerInterval = (secondLoss * 100) / 10; // Convert to pence, then divide by 10 for 100ms intervals
  
  const [totalLossPence, setTotalLossPence] = useState(0);
  const [intervals, setIntervals] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const warningShownRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIntervals(prev => {
        const newIntervals = prev + 1;
        const newLossPence = Math.floor(newIntervals * pencePerInterval);
        setTotalLossPence(newLossPence);
        
        // Animate on every penny change
        const prevPence = Math.floor((newIntervals - 1) * pencePerInterval);
        if (newLossPence > prevPence) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 50);
        }
        
        // Add urgency at milestones (every £1)
        if (newLossPence > 0 && newLossPence % 100 === 0) {
          const element = document.querySelector('[data-component="revenue-counter"]');
          element?.classList.add('animate-urgency-shake');
          setTimeout(() => {
            element?.classList.remove('animate-urgency-shake');
          }, 500);
        }
        
        // Show warning at 5 minutes (3000 intervals of 100ms)
        if (newIntervals === 3000 && !warningShownRef.current) {
          setShowWarning(true);
          warningShownRef.current = true;
        }
        
        return newIntervals;
      });
    }, 100); // Update every 100ms for smooth penny increments

    return () => clearInterval(interval);
  }, [pencePerInterval]);

  const handleCalculateSavings = () => {
    // Scroll to calculator section
    const calculator = document.querySelector('[data-component="ai-calculator"]');
    if (calculator) {
      calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div 
      className="revenue-loss-counter bg-gradient-to-br from-gold/5 to-gold/10 rounded-2xl p-6 border border-gold/20"
      data-component="revenue-counter"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-deep-space">Cost of Waiting</h3>
        <span className="text-xs text-gray-500">Real-time calculation</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Since you opened this page:</p>
          <div className="text-4xl font-bold text-gold">
            £<span 
              className={`loss-counter inline-block transition-transform ${isAnimating ? 'scale-110' : 'scale-100'}`}
              data-minute-loss={minuteLoss}
            >
              {(totalLossPence / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Lost to inefficiency</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-lg font-bold text-premium-gray">£{hourlyLoss}</div>
            <div className="text-xs text-gray-500">Per Hour</div>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-lg font-bold text-premium-gray">£{dailyLoss}</div>
            <div className="text-xs text-gray-500">Per Day</div>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-lg font-bold text-premium-gray">£{(dailyLoss * 30).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Per Month</div>
          </div>
        </div>
        
        <div className="bg-deep-space/5 rounded-lg p-3">
          <p className="text-sm">
            <span className="font-semibold text-deep-space">Average small and medium business {businessType}:</span>
            <br />
            <span className="text-gray-600">• 3 hours/day on repetitive tasks</span>
            <br />
            <span className="text-gray-600">• 40% accuracy loss in manual processes</span>
          </p>
        </div>
        
        {showWarning && (
          <div className="mt-3 p-2 bg-gold text-white text-sm rounded-lg animate-slide-up">
            ⚠️ You've already lost £{(totalLossPence / 100).toFixed(2)}. That's a coffee. Imagine a year...
          </div>
        )}
        
        <button 
          onClick={handleCalculateSavings}
          className="btn-urgent w-full group flex items-center justify-center bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
        >
          <span>Calculate Your Savings</span>
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>
      </div>

    </div>
  );
};

export default RevenueLossCounter;