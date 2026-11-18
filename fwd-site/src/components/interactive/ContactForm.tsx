import { useRef, useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

// window.gtag is declared globally in CookieConsent.tsx.
const WHATSAPP = 'https://wa.me/447516330379';
const EMAIL = 'sam@f-w-d.co.uk';

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const mountedAt = useRef(typeof performance !== 'undefined' ? performance.now() : 0);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your name';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address, like name@example.com';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_website: honeypot,
          elapsedMs: Math.round(performance.now() - mountedAt.current),
          page: window.location.pathname,
        }),
      });
      const result = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !result.ok) throw new Error(result.error || `HTTP ${res.status}`);

      window.gtag?.('event', 'generate_lead', { method: 'contact_form' });
      setStatus('success');
    } catch {
      // Keep what they typed, and give them another way to reach Sam.
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8" role="status">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent</h3>
        <p className="text-slate-600">
          Thanks, {formData.name.split(' ')[0]}. I'll reply to {formData.email}, usually within a few hours on working days.
        </p>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Hi Sam, I'm ${formData.name || 'getting in touch'}. ${formData.message || 'I would like to discuss a project.'}`
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1">
          Name <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          placeholder="Your name"
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-y"
          placeholder="Tell me briefly what you need"
        />
      </div>

      {/* Spam trap: hidden from people, often filled in by bots. */}
      <div className="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-company-website">Leave this empty</label>
        <input
          type="text"
          id="contact-company-website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <p className="font-semibold mb-1">Sorry, that didn't send.</p>
          <p>
            Your message is still here. Please try again, or reach me directly on{' '}
            <a href={`${WHATSAPP}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">WhatsApp</a>
            {' '}or at{' '}
            <a href={`mailto:${EMAIL}`} className="font-semibold underline">{EMAIL}</a>.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>

      <p className="text-sm text-slate-500 text-center">No spam, no mailing lists. Just a reply to your message.</p>
    </form>
  );
}
