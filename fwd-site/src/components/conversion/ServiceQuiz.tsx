import { useState } from 'react';

interface QuizResult {
  title: string;
  description: string;
  serviceLink: string;
  serviceName: string;
  whatsappMessage: string;
}

const results: Record<string, QuizResult> = {
  website: {
    title: 'You need a Professional Website',
    description: 'A fast, mobile-friendly website that represents your business well and helps you get found online. Built in 2 to 3 weeks, SEO-ready from day one.',
    serviceLink: '/services/professional-websites',
    serviceName: 'Professional Websites',
    whatsappMessage: "Hi Sam, I took the quiz on your site and I think I need a website for my business. Can we chat?",
  },
  automation: {
    title: 'You need Business Automation',
    description: "You're spending too much time on repetitive tasks. Let's automate the routine work so you can focus on growing your business.",
    serviceLink: '/services/business-process-automation',
    serviceName: 'Business Automation',
    whatsappMessage: "Hi Sam, I took the quiz on your site and I think I need automation for my business. Can we chat?",
  },
  app: {
    title: 'You need a Custom App',
    description: "Off-the-shelf tools aren't cutting it. You need something built specifically for your business, whether that's a booking system, dashboard, or internal tool.",
    serviceLink: '/services/custom-app-development',
    serviceName: 'Custom App Development',
    whatsappMessage: "Hi Sam, I took the quiz on your site and I think I need a custom app. Can we chat?",
  },
  training: {
    title: 'You need AI Training',
    description: "You might be using ChatGPT as a sticking plaster. Let me show you what AI tools can actually do for your business, and where you need proper code instead.",
    serviceLink: '/services/ai-training',
    serviceName: 'AI Training',
    whatsappMessage: "Hi Sam, I took the quiz on your site and I'm interested in AI training. Can we chat?",
  },
  unsure: {
    title: "Let's Figure It Out Together",
    description: "No problem. I'll ask a few questions about your business and suggest the right approach. No pressure, no obligation.",
    serviceLink: '/contact',
    serviceName: 'Get in Touch',
    whatsappMessage: "Hi Sam, I'm not sure what I need but I'd like to chat about my business.",
  },
};

export default function ServiceQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const questions = [
    {
      question: "What's your biggest challenge right now?",
      options: [
        { label: "I don't have a website (or mine is outdated)", value: 'website' },
        { label: "I'm drowning in admin and repetitive tasks", value: 'automation' },
        { label: "I need a custom tool or app for my business", value: 'app' },
        { label: "I want to use AI tools better", value: 'training' },
        { label: "I'm not sure", value: 'unsure' },
      ],
    },
    {
      question: "What's your budget range?",
      options: [
        { label: "Under £500", value: 'low' },
        { label: "£500 to £2,000", value: 'mid' },
        { label: "£2,000 to £5,000", value: 'high' },
        { label: "Over £5,000", value: 'enterprise' },
        { label: "Not sure yet", value: 'unsure' },
      ],
    },
    {
      question: "How soon do you need this?",
      options: [
        { label: "As soon as possible", value: 'asap' },
        { label: "Within the next month", value: 'month' },
        { label: "In the next few months", value: 'quarter' },
        { label: "Just researching for now", value: 'researching' },
      ],
    },
  ];

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(questions.length);
    }
  };

  const getResult = (): QuizResult => {
    const firstAnswer = answers[0];
    return results[firstAnswer] || results.unsure;
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
  };

  const isComplete = step >= questions.length;
  const result = isComplete ? getResult() : null;

  return (
    <div className="max-w-2xl mx-auto">
      {!isComplete ? (
        <fieldset>
          <legend className="text-xl font-bold text-slate-900 mb-6">
            {questions[step].question}
          </legend>

          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="space-y-3" role="radiogroup">
            {questions[step].options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full text-left px-6 py-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700 font-medium min-h-[44px]"
              >
                {option.label}
              </button>
            ))}
          </div>

          {step > 0 && (
            <button
              onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}
              className="mt-4 text-sm text-slate-500 hover:text-slate-700 min-h-[44px]"
            >
              Back
            </button>
          )}
        </fieldset>
      ) : result && (
        <div className="text-center" role="status" aria-live="polite">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">{result.title}</h3>
          <p className="text-slate-600 mb-8">{result.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/447584417830?text=${encodeURIComponent(result.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
            <a
              href={result.serviceLink}
              className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Learn about {result.serviceName}
            </a>
          </div>
          <button
            onClick={reset}
            className="mt-6 text-sm text-slate-500 hover:text-slate-700 min-h-[44px]"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
