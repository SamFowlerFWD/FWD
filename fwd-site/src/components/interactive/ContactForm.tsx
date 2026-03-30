import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your name';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');

    // Build WhatsApp message as fallback
    const waMessage = `Hi Sam, I'm ${formData.name} (${formData.email}). ${formData.message || 'I would like to discuss a project.'}`;
    const waUrl = `https://wa.me/447584417830?text=${encodeURIComponent(waMessage)}`;

    // Open WhatsApp with the form data
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setStatus('success');
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
        <p className="text-slate-600">Thanks for getting in touch. I'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1">
          Name <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="contact-name"
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
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-y"
          placeholder="Tell me about your project..."
        />
      </div>

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
