import React, { useState, useEffect } from 'react';

interface CalculatorInputs {
  employees: number;
  avgSalary: number;
  hoursWasted: number;
  errorRate: number;
  industry: string;
}

interface CalculatorResults {
  timeSaved: number;
  moneySaved: number;
  roiMonths: number;
  efficiencyGain: number;
  show: boolean;
}

const AIAdvantageCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    employees: 10,
    avgSalary: 35000,
    hoursWasted: 3,
    errorRate: 40,
    industry: 'general'
  });

  const [results, setResults] = useState<CalculatorResults>({
    timeSaved: 0,
    moneySaved: 0,
    roiMonths: 0,
    efficiencyGain: 0,
    show: false
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const industries = [
    { value: 'general', label: 'General Business' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'logistics', label: 'Logistics & Transport' },
    { value: 'finance', label: 'Finance & Insurance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'professional', label: 'Professional Services' }
  ];

  const calculateResults = () => {
    setIsCalculating(true);
    
    // Simulate calculation time for effect
    setTimeout(() => {
      const hourlyRate = inputs.avgSalary / (52 * 40); // Weekly hours
      const dailyWaste = inputs.hoursWasted * inputs.employees * hourlyRate;
      const yearlyWaste = dailyWaste * 260; // Working days
      
      // AI can eliminate 70-90% of wasted time
      const efficiencyMultiplier = 0.8;
      const savedYearly = yearlyWaste * efficiencyMultiplier;
      
      // Error cost calculation
      const errorCostPerIncident = 1200;
      const monthlyErrors = (inputs.errorRate / 100) * inputs.employees * 2; // 2 errors per employee per month average
      const errorSavings = monthlyErrors * errorCostPerIncident * 12 * 0.9; // AI prevents 90% of errors
      
      const totalSavings = savedYearly + errorSavings;
      
      // ROI calculation (typical implementation cost)
      const implementationCost = inputs.employees * 2000; // £2000 per employee for AI setup
      const monthsToROI = Math.ceil(implementationCost / (totalSavings / 12));
      
      setResults({
        timeSaved: Math.round(inputs.hoursWasted * inputs.employees * 260 * efficiencyMultiplier),
        moneySaved: Math.round(totalSavings),
        roiMonths: monthsToROI > 0 ? monthsToROI : 1,
        efficiencyGain: Math.round(efficiencyMultiplier * 100),
        show: true
      });
      
      setIsCalculating(false);
    }, 1500);
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setResults(prev => ({ ...prev, show: false }));
  };

  const resetCalculator = () => {
    setCurrentStep(1);
    setResults({ ...results, show: false });
  };

  return (
    <div 
      className="ai-calculator max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
      data-component="ai-calculator"
    >
      <div className="bg-gradient-to-r from-ai-purple to-trust-blue p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">AI ROI Calculator</h3>
        <p className="text-white/80">See your exact savings in 30 seconds</p>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map(step => (
            <div 
              key={step}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                step <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h4 className="text-xl font-semibold text-deep-space mb-4">Tell us about your business</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Employees
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={inputs.employees}
                onChange={(e) => handleInputChange('employees', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1</span>
                <span className="text-lg font-bold text-ai-purple">{inputs.employees}</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Salary (£/year)
              </label>
              <input
                type="number"
                value={inputs.avgSalary}
                onChange={(e) => handleInputChange('avgSalary', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-purple focus:border-transparent"
                placeholder="35000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={inputs.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-purple focus:border-transparent"
              >
                {industries.map(industry => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full bg-ai-purple hover:bg-ai-purple/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Continue →
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h4 className="text-xl font-semibold text-deep-space mb-4">Current inefficiencies</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours wasted per employee per day
              </label>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={inputs.hoursWasted}
                onChange={(e) => handleInputChange('hoursWasted', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1 hour</span>
                <span className="text-lg font-bold text-urgent-amber">{inputs.hoursWasted} hours</span>
                <span>6 hours</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error rate compared to automated systems (%)
              </label>
              <input
                type="range"
                min="10"
                max="70"
                value={inputs.errorRate}
                onChange={(e) => handleInputChange('errorRate', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10%</span>
                <span className="text-lg font-bold text-urgent-amber">{inputs.errorRate}%</span>
                <span>70%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  setCurrentStep(3);
                  calculateResults();
                }}
                className="flex-1 bg-success-green hover:bg-success-green/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Calculate Savings
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {isCalculating ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-ai-purple/10 rounded-full mb-4">
                  <svg className="animate-spin h-8 w-8 text-ai-purple" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-gray-600">Calculating your potential savings...</p>
              </div>
            ) : results.show ? (
              <div className="animate-fade-in">
                <h4 className="text-2xl font-bold text-deep-space mb-6 text-center">
                  Your AI Advantage Results
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-success-green/10 to-success-green/5 p-4 rounded-lg border border-success-green/20">
                    <div className="text-3xl font-bold text-success-green mb-1">
                      £{results.moneySaved.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Annual Savings</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-trust-blue/10 to-trust-blue/5 p-4 rounded-lg border border-trust-blue/20">
                    <div className="text-3xl font-bold text-trust-blue mb-1">
                      {results.timeSaved.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Hours Saved/Year</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-ai-purple/10 to-ai-purple/5 p-4 rounded-lg border border-ai-purple/20">
                    <div className="text-3xl font-bold text-ai-purple mb-1">
                      {results.roiMonths}
                    </div>
                    <div className="text-sm text-gray-600">Months to ROI</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-urgent-amber/10 to-urgent-amber/5 p-4 rounded-lg border border-urgent-amber/20">
                    <div className="text-3xl font-bold text-urgent-amber mb-1">
                      {results.efficiencyGain}%
                    </div>
                    <div className="text-sm text-gray-600">Efficiency Gain</div>
                  </div>
                </div>

                <div className="bg-deep-space/5 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">What this means:</span> By implementing AI automation, 
                    your business could save <span className="font-bold text-success-green">£{(results.moneySaved / 12).toLocaleString()}</span> per 
                    month and free up <span className="font-bold text-trust-blue">{Math.round(results.timeSaved / inputs.employees)} hours</span> per 
                    employee annually for high-value work.
                  </p>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-urgent-amber hover:bg-urgent-amber/90 text-white font-bold py-4 px-4 rounded-lg transition-all duration-200 text-lg">
                    Get Your Personalized AI Strategy →
                  </button>
                  <button
                    onClick={resetCalculator}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Recalculate
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

    </div>
  );
};

export default AIAdvantageCalculator;