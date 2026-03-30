import { useState } from 'react';

interface SequenceStep {
  time: string;
  subject: string;
  preview: string;
  icon: 'envelope' | 'clock' | 'star' | 'warning' | 'gift' | 'check';
}

interface Trigger {
  label: string;
  description: string;
  steps: SequenceStep[];
}

const TRIGGERS: Record<string, Trigger> = {
  signup: {
    label: 'New Customer Signs Up',
    description: 'Automatically onboard every new customer with a sequence that builds trust and drives engagement.',
    steps: [
      {
        time: 'Immediately',
        subject: 'Welcome to [Business]! Here are your login details',
        preview: 'Thanks for signing up. Here is everything you need to get started, including your login link and a quick setup guide.',
        icon: 'envelope',
      },
      {
        time: 'Day 1',
        subject: 'Getting started with [Business]',
        preview: 'A short walkthrough of the three things most new customers do first. Takes about five minutes.',
        icon: 'star',
      },
      {
        time: 'Day 3',
        subject: 'How are you finding things so far?',
        preview: 'Just checking in. If you have any questions or need a hand with anything, reply to this email and I will get back to you personally.',
        icon: 'check',
      },
      {
        time: 'Day 7',
        subject: 'Features you might not have tried yet',
        preview: 'Most customers don\'t discover these until week two. Here are three features that could save you even more time.',
        icon: 'star',
      },
      {
        time: 'Day 14',
        subject: 'Quick question (takes 30 seconds)',
        preview: 'We would love to hear how your first two weeks have been. Click below to leave a quick rating and any feedback.',
        icon: 'clock',
      },
      {
        time: 'Day 30',
        subject: 'Something for you (and a friend)',
        preview: 'As a thank you for your first month, here is 15% off your next order. Plus, refer a friend and you both get a bonus.',
        icon: 'gift',
      },
    ],
  },
  appointment: {
    label: 'Appointment Booked',
    description: 'Reduce no-shows, collect feedback, and drive rebookings without lifting a finger.',
    steps: [
      {
        time: 'Immediately',
        subject: 'Booking confirmed for [date] at [time]',
        preview: 'Your appointment is booked. Here are the details, including what to bring and what to expect.',
        icon: 'envelope',
      },
      {
        time: '24 hours before',
        subject: 'Reminder: your appointment is tomorrow',
        preview: 'Just a reminder about your appointment tomorrow. Here are directions, parking info, and our contact number in case you need to reach us.',
        icon: 'clock',
      },
      {
        time: '1 hour before',
        subject: 'See you soon!',
        preview: 'We are looking forward to seeing you shortly. If you are running late or need to reach us, call us on [phone].',
        icon: 'check',
      },
      {
        time: '2 hours after',
        subject: 'How did it go?',
        preview: 'Thanks for visiting today. We would love to know how your experience was. It takes less than a minute to leave feedback.',
        icon: 'star',
      },
      {
        time: '7 days after',
        subject: 'Ready to book your next visit?',
        preview: 'It has been a week since your last appointment. Click below to see available slots and book your next session.',
        icon: 'envelope',
      },
      {
        time: '30 days after',
        subject: 'Time for another visit?',
        preview: 'It has been a month since we last saw you. Book this week and get 10% off your next appointment.',
        icon: 'gift',
      },
    ],
  },
  invoice: {
    label: 'Invoice Overdue',
    description: 'Chase late payments professionally and consistently, without awkward phone calls.',
    steps: [
      {
        time: 'Due date',
        subject: 'Invoice #[number] is now due',
        preview: 'This is a reminder that your invoice is due today. Click below to view the invoice and make a payment online.',
        icon: 'envelope',
      },
      {
        time: 'Day 3',
        subject: 'Just in case you missed it',
        preview: 'A quick reminder that invoice #[number] was due three days ago. These things slip through sometimes. Here is the payment link.',
        icon: 'clock',
      },
      {
        time: 'Day 7',
        subject: 'Payment reminder: invoice #[number]',
        preview: 'Your invoice is now seven days overdue. Please make a payment at your earliest convenience using the link below.',
        icon: 'warning',
      },
      {
        time: 'Day 14',
        subject: 'Overdue invoice: can we help?',
        preview: 'We understand things come up. If you are having difficulty with this payment, please get in touch so we can discuss options.',
        icon: 'warning',
      },
      {
        time: 'Day 21',
        subject: 'Final reminder before escalation',
        preview: 'This is a final reminder regarding invoice #[number]. If we do not receive payment within seven days, we will need to escalate this matter.',
        icon: 'warning',
      },
      {
        time: 'Day 30',
        subject: 'Invoice escalated',
        preview: 'As we have not received payment for invoice #[number], this has now been escalated. Please contact us immediately to resolve this.',
        icon: 'warning',
      },
    ],
  },
};

const ICON_MAP: Record<string, JSX.Element> = {
  envelope: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  gift: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function EmailSequenceVisualiser() {
  const [selectedTrigger, setSelectedTrigger] = useState('signup');

  const trigger = TRIGGERS[selectedTrigger];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Trigger selector */}
      <fieldset>
        <legend className="block text-sm font-semibold text-slate-700 mb-3">What triggers the sequence?</legend>
        <div className="flex flex-wrap gap-2 mb-8" role="radiogroup" aria-label="Trigger selection">
          {Object.entries(TRIGGERS).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setSelectedTrigger(key)}
              type="button"
              role="radio"
              aria-checked={selectedTrigger === key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                selectedTrigger === key
                  ? 'bg-purple-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="text-slate-600 mb-6">{trigger.description}</p>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-200 hidden md:block" aria-hidden="true" />

        <div className="space-y-4 md:space-y-6">
          {trigger.steps.map((step, i) => (
            <div key={i} className="flex gap-4 relative">
              {/* Timeline dot */}
              <div
                className={`hidden md:flex w-10 h-10 rounded-full flex-shrink-0 items-center justify-center z-10 ${
                  i === 0
                    ? 'bg-purple-100 text-purple-600'
                    : step.icon === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : step.icon === 'gift'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {ICON_MAP[step.icon]}
              </div>

              {/* Content card */}
              <div className="flex-1 border border-slate-200 rounded-lg p-4 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      i === 0
                        ? 'bg-purple-100 text-purple-700'
                        : step.icon === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {step.time}
                  </span>
                  <span className="md:hidden text-slate-400">{ICON_MAP[step.icon]}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{step.subject}</h4>
                <p className="text-sm text-slate-500">{step.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mt-8 flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6c0 2.21 1.2 4.16 3 5.2V15a1 1 0 001 1h4a1 1 0 001-1v-1.8c1.8-1.04 3-2.99 3-5.2a6 6 0 00-6-6zm-1 14h2v1a1 1 0 01-2 0v-1z" />
        </svg>
        <p className="text-sm text-slate-500 italic">
          Set this up once. It runs for every customer, every booking, every invoice. That's what real automation looks like.
        </p>
      </div>
    </div>
  );
}