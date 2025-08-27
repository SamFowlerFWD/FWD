import React, { useState } from 'react';

interface ComparisonItem {
  feature: string;
  traditional: string | boolean;
  fwd: string | boolean;
}

interface ServiceComparisonProps {
  serviceName: string;
  comparisons: ComparisonItem[];
}

const ServiceComparison: React.FC<ServiceComparisonProps> = ({ serviceName, comparisons }) => {
  const [selectedService, setSelectedService] = useState<'automation' | 'website' | 'app' | 'hosting'>('automation');

  const serviceComparisons: Record<string, ComparisonItem[]> = {
    automation: [
      { feature: 'Setup Time', traditional: '3-6 months', fwd: '2-4 weeks' },
      { feature: 'Initial Cost', traditional: '£25,000+', fwd: 'From £799 + maintenance' },
      { feature: 'Monthly Savings', traditional: '£0', fwd: '£3,000+' },
      { feature: 'Error Rate', traditional: '15-20%', fwd: '<1%' },
      { feature: 'Staff Time Saved', traditional: '0 hours', fwd: '30+ hours/week' },
      { feature: 'ROI Timeline', traditional: 'Never', fwd: '4-8 weeks' },
      { feature: 'Scalability', traditional: false, fwd: true },
      { feature: '24/7 Operation', traditional: false, fwd: true }
    ],
    website: [
      { feature: 'Development Time', traditional: '12-16 weeks', fwd: '3-4 weeks' },
      { feature: 'Cost', traditional: '£10,000+', fwd: 'From £799 + maintenance' },
      { feature: 'Conversion Rate', traditional: '2-3%', fwd: '8-12%' },
      { feature: 'AI Features', traditional: false, fwd: true },
      { feature: 'Self-Updating', traditional: false, fwd: true },
      { feature: 'Performance Score', traditional: '60-70', fwd: '95+' },
      { feature: 'Mobile Optimized', traditional: 'Basic', fwd: 'Advanced' },
      { feature: 'Lead Generation', traditional: 'Manual', fwd: 'Automated' }
    ],
    app: [
      { feature: 'Build Time', traditional: '6-12 months', fwd: '6-8 weeks' },
      { feature: 'Development Cost', traditional: '£100,000+', fwd: 'From £1,299 + maintenance' },
      { feature: 'Maintenance Cost', traditional: '£2,000/month', fwd: '£299/month' },
      { feature: 'Updates', traditional: 'Quarterly', fwd: 'Continuous' },
      { feature: 'AI Integration', traditional: false, fwd: true },
      { feature: 'Scalability', traditional: 'Limited', fwd: 'Unlimited' },
      { feature: 'Bug Fixes', traditional: '1-2 weeks', fwd: 'Same day' },
      { feature: 'Feature Additions', traditional: '£5,000+ each', fwd: 'Included' }
    ],
    hosting: [
      { feature: 'Monthly Cost', traditional: '£500+', fwd: 'From £99' },
      { feature: 'Uptime Guarantee', traditional: '99%', fwd: '99.99%' },
      { feature: 'Response Time', traditional: '24-48 hours', fwd: '< 1 hour' },
      { feature: 'Proactive Monitoring', traditional: false, fwd: true },
      { feature: 'AI Optimization', traditional: false, fwd: true },
      { feature: 'Automatic Backups', traditional: 'Weekly', fwd: 'Real-time' },
      { feature: 'Security Updates', traditional: 'Monthly', fwd: 'Immediate' },
      { feature: 'Performance Tuning', traditional: false, fwd: true }
    ]
  };

  const currentComparisons = serviceComparisons[selectedService];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-deep-space mb-3">
          Why Norfolk Businesses Choose <span className="ai-gradient-text">FWD</span>
        </h3>
        <p className="text-gray-600">See the difference AI makes to your bottom line</p>
      </div>

      {/* Service Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { key: 'automation', label: 'Process Automation', icon: '⚡' },
          { key: 'website', label: 'AI Websites', icon: '🌐' },
          { key: 'app', label: 'Custom Apps', icon: '📱' },
          { key: 'hosting', label: 'AI Hosting', icon: '🚀' }
        ].map(service => (
          <button
            key={service.key}
            onClick={() => setSelectedService(service.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedService === service.key
                ? 'bg-gradient-to-r from-ai-purple to-trust-blue text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{service.icon}</span>
            {service.label}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
              <th className="text-center py-3 px-4">
                <div className="inline-flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Traditional</span>
                  <span className="text-xs text-gray-400">(What you pay now)</span>
                </div>
              </th>
              <th className="text-center py-3 px-4">
                <div className="inline-flex flex-col items-center">
                  <span className="bg-gradient-to-r from-ai-purple to-trust-blue bg-clip-text text-transparent font-bold">FWD</span>
                  <span className="text-xs text-success-green">Save 70%+</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentComparisons.map((item, index) => (
              <tr 
                key={index} 
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="py-3 px-4 font-medium text-gray-700">{item.feature}</td>
                <td className="py-3 px-4 text-center">
                  {typeof item.traditional === 'boolean' ? (
                    item.traditional ? (
                      <svg className="w-5 h-5 text-success-green mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <span className={`text-sm ${item.traditional.includes('£') || item.traditional.includes('month') ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                      {item.traditional}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {typeof item.fwd === 'boolean' ? (
                    item.fwd ? (
                      <svg className="w-5 h-5 text-success-green mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <span className={`text-sm font-semibold ${item.fwd.includes('£') || item.fwd.includes('From') ? 'text-success-green' : 'text-gray-700'}`}>
                      {item.fwd}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-ai-purple/10 to-trust-blue/10 rounded-xl text-center">
        <p className="text-lg font-semibold text-deep-space mb-3">
          Every competitor using FWD saves an average of £4,200/month
        </p>
        <p className="text-sm text-gray-600 mb-4">
          17 businesses in Norfolk switched to FWD this week. Don't let them get ahead.
        </p>
        <button className="bg-urgent-amber hover:bg-urgent-amber/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 animate-pulse-subtle">
          See Your Exact Savings →
        </button>
      </div>
    </div>
  );
};

export default ServiceComparison;