import { useState } from 'react';

const POSITIVE_EXAMPLE = "Brilliant service from start to finish. Sam was professional, arrived on time, and the work was excellent quality. Would definitely recommend to anyone looking for a reliable tradesperson.";

const NEGATIVE_EXAMPLE = "Was quoted one price but the final bill was higher. Work took longer than expected and there was some mess left behind. Disappointed overall.";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AB';
}

function generatePositiveResponse(review: string, reviewerName: string, businessName: string): string {
  const lower = review.toLowerCase();
  const parts: string[] = [];

  parts.push(`Thank you so much for the lovely review, ${reviewerName || 'there'}.`);

  const specifics: string[] = [];
  if (/professional/.test(lower)) specifics.push('professionalism');
  if (/on time|punctual|prompt/.test(lower)) specifics.push('punctuality');
  if (/quality|excellent|brilliant|great|fantastic|amazing/.test(lower)) specifics.push('quality of work');
  if (/recommend/.test(lower)) specifics.push('recommendation');
  if (/friendly|polite|helpful|lovely/.test(lower)) specifics.push('customer service');

  if (specifics.length > 0) {
    const listed = specifics.length > 1
      ? specifics.slice(0, -1).join(', ') + ' and ' + specifics[specifics.length - 1]
      : specifics[0];
    parts.push(`Really glad to hear you appreciated the ${listed}.`);
  } else {
    parts.push('Really glad to hear you had a great experience.');
  }

  parts.push(`It was a pleasure working with you, and we hope to see you again. All the best from the team at ${businessName}.`);

  return parts.join(' ');
}

function generateNegativeResponse(review: string, reviewerName: string, businessName: string): string {
  const lower = review.toLowerCase();
  const parts: string[] = [];

  parts.push(`Thank you for taking the time to share your feedback, ${reviewerName || 'there'}.`);

  const issues: string[] = [];
  if (/price|cost|bill|charge|expensive|money|quoted/.test(lower)) issues.push('the pricing concern');
  if (/time|late|slow|longer|delay|took/.test(lower)) issues.push('the time taken');
  if (/mess|clean|tidy|dirt|dust/.test(lower)) issues.push('the tidiness of the work area');
  if (/quality|poor|bad|disappointing|shoddy/.test(lower)) issues.push('the quality of the work');
  if (/rude|unprofessional|attitude|communication/.test(lower)) issues.push('the communication');

  if (issues.length > 0) {
    const listed = issues.length > 1
      ? issues.slice(0, -1).join(', ') + ' and ' + issues[issues.length - 1]
      : issues[0];
    parts.push(`We are sorry to hear about ${listed}. That is not the standard we aim for, and we take this seriously.`);
  } else {
    parts.push('We are sorry that your experience did not meet expectations. We take all feedback seriously.');
  }

  parts.push('We would welcome the chance to discuss this with you directly and make things right.');
  parts.push(`Please contact us at your convenience so we can look into this further. Kind regards, ${businessName}.`);

  return parts.join(' ');
}

export default function ReviewResponseWriter() {
  const [isPositive, setIsPositive] = useState(true);
  const [review, setReview] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [businessName, setBusinessName] = useState('Your Business Name');
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const loadExample = () => {
    setReview(isPositive ? POSITIVE_EXAMPLE : NEGATIVE_EXAMPLE);
    setReviewerName(isPositive ? 'Sarah M' : 'David R');
    setResponse('');
    setCopied(false);
  };

  const generate = () => {
    if (!review.trim()) return;
    const result = isPositive
      ? generatePositiveResponse(review, reviewerName, businessName)
      : generateNegativeResponse(review, reviewerName, businessName);
    setResponse(result);
    setCopied(false);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (positive: boolean) => {
    setIsPositive(positive);
    setReview('');
    setReviewerName('');
    setResponse('');
    setCopied(false);
  };

  const stars = isPositive ? 5 : 2;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Toggle */}
      <div className="flex gap-2 mb-6" role="radiogroup" aria-label="Review type">
        <button
          onClick={() => handleToggle(true)}
          type="button"
          role="radio"
          aria-checked={isPositive}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            isPositive
              ? 'bg-green-600 text-white'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Positive Review
        </button>
        <button
          onClick={() => handleToggle(false)}
          type="button"
          role="radio"
          aria-checked={!isPositive}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            !isPositive
              ? 'bg-red-600 text-white'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Negative Review
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="rr-review" className="block text-sm font-semibold text-slate-700">
              The review
            </label>
            <button
              onClick={loadExample}
              type="button"
              className="border border-slate-300 text-slate-700 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Load Example
            </button>
          </div>
          <textarea
            id="rr-review"
            value={review}
            onChange={(e) => { setReview(e.target.value); setResponse(''); }}
            placeholder="Paste the review text here..."
            className="w-full h-32 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rr-name" className="block text-sm font-medium text-slate-700 mb-1">
                Reviewer name
              </label>
              <input
                id="rr-name"
                type="text"
                value={reviewerName}
                onChange={(e) => { setReviewerName(e.target.value); setResponse(''); }}
                placeholder="e.g. Sarah M"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="rr-business" className="block text-sm font-medium text-slate-700 mb-1">
                Your business name
              </label>
              <input
                id="rr-business"
                type="text"
                value={businessName}
                onChange={(e) => { setBusinessName(e.target.value); setResponse(''); }}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={generate}
            type="button"
            disabled={!review.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            Generate Response
          </button>
        </div>

        {/* Output: mock Google Review card */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Preview</p>
          <div className="border border-slate-200 rounded-lg p-5 bg-white">
            {/* Review */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
                {getInitials(reviewerName || 'A B')}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{reviewerName || 'Anonymous'}</p>
                <div className="flex gap-0.5 my-1" aria-label={`${stars} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <svg
                      key={n}
                      className={`w-4 h-4 ${n <= stars ? 'text-amber-400' : 'text-slate-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {review || <span className="text-slate-400 italic">Review text will appear here...</span>}
                </p>
              </div>
            </div>

            {/* Response */}
            {response && (
              <div className="border-t border-slate-200 pt-4 ml-13">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
                    {getInitials(businessName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Response from {businessName}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{response}</p>
                  </div>
                </div>
                <button
                  onClick={copyResponse}
                  type="button"
                  className="mt-3 border border-slate-300 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px] w-full"
                >
                  {copied ? 'Copied!' : 'Copy Response'}
                </button>
              </div>
            )}

            {!response && !review && (
              <div className="text-center py-4 text-slate-400 text-sm">
                Load an example or paste a review to get started
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6c0 2.21 1.2 4.16 3 5.2V15a1 1 0 001 1h4a1 1 0 001-1v-1.8c1.8-1.04 3-2.99 3-5.2a6 6 0 00-6-6zm-1 14h2v1a1 1 0 01-2 0v-1z" />
        </svg>
        <p className="text-sm text-slate-500 italic">
          Most businesses either ignore reviews or write awkward responses. A template system like this keeps your replies professional and consistent.
        </p>
      </div>
    </div>
  );
}