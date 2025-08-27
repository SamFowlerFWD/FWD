import React, { useState } from 'react';

interface Calculation {
  hoursPerWeek: number;
  hourlyRate: number;
  automationPercentage: number;
  weeklyHoursSaved: number;
  yearlyHoursSaved: number;
  yearlySavings: number;
  roi: number;
  paybackPeriod: number;
}

const INDUSTRY_PRESETS = {
  retail: { hours: 25, rate: 30, automation: 85 },
  hospitality: { hours: 30, rate: 35, automation: 90 },
  professional: { hours: 20, rate: 50, automation: 75 },
  manufacturing: { hours: 35, rate: 40, automation: 80 },
  healthcare: { hours: 20, rate: 45, automation: 70 },
  custom: { hours: 20, rate: 30, automation: 80 }
};

export default function SavingsCalculator() {
  const [industry, setIndustry] = useState<keyof typeof INDUSTRY_PRESETS>('custom');
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [automationPercentage, setAutomationPercentage] = useState(80);
  const [calculation, setCalculation] = useState<Calculation | null>(null);

  const handleIndustryChange = (newIndustry: keyof typeof INDUSTRY_PRESETS) => {
    setIndustry(newIndustry);
    const preset = INDUSTRY_PRESETS[newIndustry];
    setHoursPerWeek(preset.hours);
    setHourlyRate(preset.rate);
    setAutomationPercentage(preset.automation);
  };

  const calculateSavings = () => {
    const weeklyHoursSaved = (hoursPerWeek * automationPercentage) / 100;
    const yearlyHoursSaved = weeklyHoursSaved * 52;
    const yearlySavings = yearlyHoursSaved * hourlyRate;
    const investmentCost = 799; // Base automation package
    const roi = ((yearlySavings - investmentCost) / investmentCost) * 100;
    const paybackPeriod = (investmentCost / yearlySavings) * 12; // in months

    setCalculation({
      hoursPerWeek,
      hourlyRate,
      automationPercentage,
      weeklyHoursSaved: Math.round(weeklyHoursSaved * 10) / 10,
      yearlyHoursSaved: Math.round(yearlyHoursSaved),
      yearlySavings: Math.round(yearlySavings),
      roi: Math.round(roi),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Your Industry
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(INDUSTRY_PRESETS).map((key) => (
              <button
                key={key}
                onClick={() => handleIndustryChange(key as keyof typeof INDUSTRY_PRESETS)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  industry === key
                    ? 'bg-gradient-to-r from-ai-purple to-trust-blue text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hours on Repetitive Tasks (per week)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="60"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-ai-purple">{hoursPerWeek}</span>
              <span className="text-sm text-gray-600 block">hours</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hourly Rate / Value (£)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="20"
              max="100"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-trust-blue">£{hourlyRate}</span>
              <span className="text-sm text-gray-600 block">per hour</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Automation Potential
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="95"
              value={automationPercentage}
              onChange={(e) => setAutomationPercentage(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-success-green">{automationPercentage}%</span>
              <span className="text-sm text-gray-600 block">automated</span>
            </div>
          </div>
        </div>

        <button
          onClick={calculateSavings}
          className="w-full bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Calculate My Savings
        </button>
      </div>

      {/* Results Section */}
      <div>
        {calculation ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 space-y-4">
            <h3 className="text-xl font-bold text-deep-space mb-4">
              Your AI Transformation Results
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-ai-purple">
                  {calculation.weeklyHoursSaved}
                </div>
                <div className="text-sm text-gray-600">Hours Saved Per Week</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-trust-blue">
                  {calculation.yearlyHoursSaved}
                </div>
                <div className="text-sm text-gray-600">Hours Saved Per Year</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-success-green/10 to-urgent-amber/10 rounded-lg p-6">
              <div className="text-4xl font-bold text-success-green mb-2">
                £{calculation.yearlySavings.toLocaleString()}
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-4">
                Estimated Annual Savings
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-2xl font-bold text-urgent-amber">
                    {calculation.roi}%
                  </div>
                  <div className="text-sm text-gray-600">First Year ROI</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-deep-space">
                    {calculation.paybackPeriod}
                  </div>
                  <div className="text-sm text-gray-600">Months to Break Even</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Based on automating {calculation.automationPercentage}% of your {calculation.hoursPerWeek} weekly hours 
                at £{calculation.hourlyRate}/hour.
              </p>
              <div className="flex gap-3">
                <a
                  href="/#contact"
                  className="flex-1 text-center bg-urgent-amber hover:bg-urgent-amber/90 text-deep-space font-bold py-3 px-4 rounded-lg transition-all"
                >
                  Get Started Today
                </a>
                <button
                  onClick={() => setCalculation(null)}
                  className="px-4 py-3 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-all border border-gray-200"
                >
                  Recalculate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-deep-space mb-2">
              Ready to See Your Savings?
            </h3>
            <p className="text-gray-600 text-center">
              Adjust the sliders and click calculate to see how much you could save with AI automation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}