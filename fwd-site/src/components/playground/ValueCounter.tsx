import React, { useState, useEffect } from 'react';

interface ValueMetrics {
  demosCompleted: number;
  tokensUsed: number;
  timeSaved: number; // in minutes
  potentialSavings: number; // in £
}

export default function ValueCounter() {
  const [metrics, setMetrics] = useState<ValueMetrics>({
    demosCompleted: 0,
    tokensUsed: 0,
    timeSaved: 0,
    potentialSavings: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load metrics from sessionStorage
    const savedMetrics = sessionStorage.getItem('playgroundMetrics');
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
      setIsVisible(true);
    }

    // Listen for metric updates
    const handleMetricUpdate = (event: CustomEvent) => {
      const newMetrics = event.detail;
      setMetrics((prev: ValueMetrics) => {
        const updated = {
          demosCompleted: prev.demosCompleted + (newMetrics.demosCompleted || 0),
          tokensUsed: prev.tokensUsed + (newMetrics.tokensUsed || 0),
          timeSaved: prev.timeSaved + (newMetrics.timeSaved || 0),
          potentialSavings: prev.potentialSavings + (newMetrics.potentialSavings || 0)
        };
        sessionStorage.setItem('playgroundMetrics', JSON.stringify(updated));
        return updated;
      });
      setIsVisible(true);
    };

    window.addEventListener('playgroundMetric' as any, handleMetricUpdate as EventListener);
    return () => window.removeEventListener('playgroundMetric' as any, handleMetricUpdate as EventListener);
  }, []);

  if (!isVisible || metrics.demosCompleted === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-deep-space">Your AI Impact</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-2xl font-bold text-ai-purple">
            {metrics.demosCompleted}
          </div>
          <div className="text-xs text-gray-600">Demos Tried</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-trust-blue">
            {metrics.tokensUsed}
          </div>
          <div className="text-xs text-gray-600">Tokens Used</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-success-green">
            {metrics.timeSaved}m
          </div>
          <div className="text-xs text-gray-600">Time Saved</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-gold">
            £{metrics.potentialSavings}
          </div>
          <div className="text-xs text-gray-600">Potential/Year</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-600 mb-2">
          Ready to unlock these savings for real?
        </div>
        <a
          href="/#contact"
          className="block text-center bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
        >
          Get Started →
        </a>
      </div>
    </div>
  );
}

// Helper function to dispatch metrics
export function trackMetric(metric: Partial<ValueMetrics>) {
  window.dispatchEvent(new CustomEvent('playgroundMetric', { detail: metric }));
}