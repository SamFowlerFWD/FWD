import { useState } from 'react';

interface Preset {
  label: string;
  hours: number;
  rate: number;
  staff: number;
  description: string;
}

const PRESETS: Record<string, Preset> = {
  trades: {
    label: 'Trades',
    hours: 8,
    rate: 30,
    staff: 2,
    description: 'Quoting, invoicing, scheduling and job tracking',
  },
  retail: {
    label: 'Retail',
    hours: 12,
    rate: 15,
    staff: 3,
    description: 'Inventory management, order processing and stock updates',
  },
  professional: {
    label: 'Professional Services',
    hours: 10,
    rate: 50,
    staff: 1,
    description: 'Client admin, proposal writing and follow-ups',
  },
  hospitality: {
    label: 'Hospitality',
    hours: 15,
    rate: 12,
    staff: 4,
    description: 'Bookings, table management and staff scheduling',
  },
  fitness: {
    label: 'Health & Fitness',
    hours: 6,
    rate: 20,
    staff: 2,
    description: 'Class bookings, member comms and session reminders',
  },
};

export default function RoiCalculator() {
  const [hours, setHours] = useState(8);
  const [rate, setRate] = useState(30);
  const [staff, setStaff] = useState(2);
  const [selectedPreset, setSelectedPreset] = useState('trades');

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setHours(p.hours);
    setRate(p.rate);
    setStaff(p.staff);
    setSelectedPreset(key);
  };

  const weeklyCost = hours * rate * staff;
  const monthlyCost = weeklyCost * 4.33;
  const annualCost = weeklyCost * 52;
  const annualSaving = annualCost * 0.8;
  const automationCostLow = 799;
  const automationCostHigh = 3000;
  const paybackWeeksLow = Math.ceil(automationCostLow / (weeklyCost * 0.8));
  const paybackWeeksHigh = Math.ceil(automationCostHigh / (weeklyCost * 0.8));

  const beforeWidth = 100;
  const afterWidth = 20;

  const whatsappUrl = `https://wa.me/447000000000?text=${encodeURIComponent('Hi Sam, I used the ROI calculator on your site and I\'d like to discuss what we could automate in my business.')}`;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Industry presets */}
      <fieldset>
        <legend className="block text-sm font-semibold text-slate-700 mb-3">Choose your industry</legend>
        <div className="flex flex-wrap gap-2 mb-6" role="radiogroup" aria-label="Industry preset">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              type="button"
              role="radio"
              aria-checked={selectedPreset === key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                selectedPreset === key
                  ? 'bg-purple-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {selectedPreset && (
        <p className="text-sm text-slate-500 mb-6">
          Typical tasks: {PRESETS[selectedPreset].description}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label htmlFor="roi-hours" className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
              <span>Hours per week on manual tasks</span>
              <span className="text-lg font-bold text-slate-900">{hours}h</span>
            </label>
            <input
              id="roi-hours"
              type="range"
              min={1}
              max={40}
              value={hours}
              onChange={(e) => { setHours(parseInt(e.target.value)); setSelectedPreset(''); }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1h</span>
              <span>40h</span>
            </div>
          </div>

          <div>
            <label htmlFor="roi-rate" className="block text-sm font-medium text-slate-700 mb-1">
              Hourly cost of this work
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">&pound;</span>
              <input
                id="roi-rate"
                type="number"
                min={1}
                value={rate}
                onChange={(e) => { setRate(parseInt(e.target.value) || 0); setSelectedPreset(''); }}
                className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="roi-staff" className="block text-sm font-medium text-slate-700 mb-1">
              Number of people doing this
            </label>
            <input
              id="roi-staff"
              type="number"
              min={1}
              max={50}
              value={staff}
              onChange={(e) => { setStaff(parseInt(e.target.value) || 1); setSelectedPreset(''); }}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Current cost of manual work</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Weekly</span>
                <span className="text-slate-900 font-medium">&pound;{weeklyCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Monthly</span>
                <span className="text-slate-900 font-medium">&pound;{Math.round(monthlyCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Annual</span>
                <span className="text-slate-900 font-bold text-lg">&pound;{annualCost.toLocaleString()}</span>
              </div>
            </div>

            <hr className="border-slate-200 my-4" />

            <h3 className="text-sm font-semibold text-slate-700 mb-2">If automation handles 80% of this:</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Annual saving</span>
                <span className="text-2xl font-bold text-green-600">&pound;{annualSaving.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Typical automation cost</span>
                <span className="text-slate-700">&pound;799 to &pound;3,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pays for itself in</span>
                <span className="text-slate-900 font-semibold">
                  {paybackWeeksLow === paybackWeeksHigh
                    ? `${paybackWeeksLow} weeks`
                    : `${paybackWeeksLow} to ${paybackWeeksHigh} weeks`}
                </span>
              </div>
            </div>

            {/* Visual comparison */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Before automation</span>
                  <span>&pound;{annualCost.toLocaleString()}/yr</span>
                </div>
                <div className="h-6 bg-red-400 rounded-md" style={{ width: `${beforeWidth}%` }} />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>After automation</span>
                  <span>&pound;{Math.round(annualCost * 0.2).toLocaleString()}/yr</span>
                </div>
                <div className="h-6 bg-green-500 rounded-md" style={{ width: `${afterWidth}%` }} />
              </div>
            </div>
          </div>

          {/* CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Want to see what we could automate?
          </a>
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6c0 2.21 1.2 4.16 3 5.2V15a1 1 0 001 1h4a1 1 0 001-1v-1.8c1.8-1.04 3-2.99 3-5.2a6 6 0 00-6-6zm-1 14h2v1a1 1 0 01-2 0v-1z" />
        </svg>
        <p className="text-sm text-slate-500 italic">
          These numbers are real. Most businesses don't realise how much manual work actually costs until they see it written down.
        </p>
      </div>
    </div>
  );
}