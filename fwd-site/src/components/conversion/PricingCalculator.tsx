import { useState } from 'react';

type ServiceType = 'website' | 'automation' | 'app' | 'training';

interface ServiceConfig {
  label: string;
  icon: string;
  questions: Array<{
    label: string;
    options: Array<{ label: string; value: string; modifier: number }>;
  }>;
  baseMin: number;
  baseMax: number;
}

const services: Record<ServiceType, ServiceConfig> = {
  website: {
    label: 'Website',
    icon: '&#127760;',
    questions: [
      {
        label: 'How many pages do you need?',
        options: [
          { label: '1 to 3 pages', value: 'small', modifier: 1 },
          { label: '5 to 10 pages', value: 'medium', modifier: 2.5 },
          { label: '10+ pages', value: 'large', modifier: 4 },
        ],
      },
      {
        label: 'Do you need an online shop?',
        options: [
          { label: 'No', value: 'no', modifier: 0 },
          { label: 'Simple (under 20 products)', value: 'simple', modifier: 1.5 },
          { label: 'Full ecommerce', value: 'full', modifier: 3 },
        ],
      },
      {
        label: 'Do you need a content management system?',
        options: [
          { label: 'No, I\'ll ask you for updates', value: 'no', modifier: 0 },
          { label: 'Yes, I want to update content myself', value: 'yes', modifier: 0.5 },
        ],
      },
    ],
    baseMin: 299,
    baseMax: 799,
  },
  automation: {
    label: 'Automation',
    icon: '&#9889;',
    questions: [
      {
        label: 'How many processes need automating?',
        options: [
          { label: '1 to 2 processes', value: 'few', modifier: 1 },
          { label: '3 to 5 processes', value: 'several', modifier: 2 },
          { label: '6+ processes', value: 'many', modifier: 3.5 },
        ],
      },
      {
        label: 'Do you need custom integrations?',
        options: [
          { label: 'Standard tools (Zapier, Make)', value: 'standard', modifier: 0 },
          { label: 'Custom API integrations', value: 'custom', modifier: 1.5 },
        ],
      },
    ],
    baseMin: 799,
    baseMax: 1500,
  },
  app: {
    label: 'Custom App',
    icon: '&#128241;',
    questions: [
      {
        label: 'What type of app?',
        options: [
          { label: 'Simple web tool or dashboard', value: 'simple', modifier: 1 },
          { label: 'Booking system or customer portal', value: 'medium', modifier: 2.5 },
          { label: 'Full platform with multiple user types', value: 'complex', modifier: 4 },
        ],
      },
      {
        label: 'Do you need a mobile app?',
        options: [
          { label: 'No, web only', value: 'web', modifier: 0 },
          { label: 'Progressive web app (works on phones)', value: 'pwa', modifier: 0.5 },
          { label: 'Native iOS/Android app', value: 'native', modifier: 3 },
        ],
      },
      {
        label: 'Do you need payment processing?',
        options: [
          { label: 'No', value: 'no', modifier: 0 },
          { label: 'Yes (Stripe or similar)', value: 'yes', modifier: 1 },
        ],
      },
    ],
    baseMin: 1299,
    baseMax: 2500,
  },
  training: {
    label: 'AI Training',
    icon: '&#129302;',
    questions: [
      {
        label: 'What format works best?',
        options: [
          { label: '1-to-1 session (2 hours)', value: 'individual', modifier: 1 },
          { label: 'Team workshop (half day, up to 8 people)', value: 'team', modifier: 1.7 },
        ],
      },
      {
        label: 'Do you want ongoing support?',
        options: [
          { label: 'Just the training session', value: 'no', modifier: 0 },
          { label: 'Yes, monthly check-ins', value: 'yes', modifier: 0.3 },
        ],
      },
    ],
    baseMin: 299,
    baseMax: 499,
  },
};

export default function PricingCalculator() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setStep(0);
    setAnswers([]);
  };

  const handleAnswer = (modifier: number) => {
    const newAnswers = [...answers, modifier];
    setAnswers(newAnswers);

    if (selectedService && step < services[selectedService].questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(-1); // Show results
    }
  };

  const calculateRange = (): { min: number; max: number } => {
    if (!selectedService) return { min: 0, max: 0 };
    const config = services[selectedService];
    const totalModifier = answers.reduce((sum, m) => sum + m, 0);
    const min = Math.round(config.baseMin * (1 + totalModifier * 0.3));
    const max = Math.round(config.baseMax * (1 + totalModifier * 0.3));
    return { min, max };
  };

  const reset = () => {
    setSelectedService(null);
    setStep(0);
    setAnswers([]);
  };

  // Step 1: Select service
  if (!selectedService) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-slate-600 mb-8">Select a service to get a rough estimate:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(services) as [ServiceType, ServiceConfig][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleServiceSelect(key)}
              className="p-6 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-center min-h-[44px]"
            >
              <span className="text-3xl block mb-2" dangerouslySetInnerHTML={{ __html: config.icon }} />
              <span className="font-semibold text-slate-900 text-sm">{config.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const config = services[selectedService];

  // Results
  if (step === -1) {
    const { min, max } = calculateRange();
    const waMessage = `Hi Sam, I used the pricing calculator on your site. I'm looking at a ${config.label.toLowerCase()} project. Can we chat about specifics?`;

    return (
      <div className="max-w-lg mx-auto text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Estimated Range</h3>
        <p className="text-4xl font-bold text-[var(--colour-primary)] mb-4">
          {selectedService === 'training' && answers[1] > 0
            ? `£${min} + £99/month`
            : `£${min.toLocaleString()} to £${max.toLocaleString()}`}
        </p>
        <p className="text-slate-600 mb-8">
          This is a rough guide based on your answers. I'll give you an exact fixed quote after we chat about the details.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`https://wa.me/447584417830?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors min-h-[44px]"
          >
            Get an exact quote
          </a>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center border border-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  // Questions
  const question = config.questions[step];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-slate-500">{config.label}</span>
        <span className="text-sm text-slate-500">
          Step {step + 1} of {config.questions.length}
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        {config.questions.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <fieldset>
        <legend className="text-xl font-bold text-slate-900 mb-6">{question.label}</legend>
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.modifier)}
              className="w-full text-left px-6 py-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700 font-medium min-h-[44px]"
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => {
            if (step > 0) {
              setStep(step - 1);
              setAnswers(answers.slice(0, -1));
            } else {
              reset();
            }
          }}
          className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
