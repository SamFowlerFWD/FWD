const reviews = [
  {
    name: 'Anna Kidd',
    role: 'Director, Harford Attachments Ltd',
    quote: 'Sam really listens to the client\'s brief and adds value to their ideas. He is naturally creative and takes time to understand and produce amazing outcomes. Highly recommended.',
    stars: 5,
  },
  {
    name: 'Matt Miller',
    role: 'Owner, Millers Fitness',
    quote: "We're on the first page of Google in the UK for 'used gym equipment'. For website building and general techy scheming, Sam knows what he's doing!",
    stars: 5,
  },
];

export default function ReviewsSection() {
  const averageRating = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;

  return (
    <div>
      {/* Aggregate Rating */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-lg font-bold text-slate-900">{averageRating.toFixed(1)} out of 5</p>
        <p className="text-sm text-slate-500">Based on {reviews.length} verified Google reviews</p>
      </div>

      {/* Reviews Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {reviews.map((review, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-md border border-slate-100">
            <div className="flex gap-0.5 mb-3" aria-label={`${review.stars} out of 5 stars`}>
              {Array.from({ length: review.stars }).map((_, j) => (
                <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-slate-700 mb-4 italic">"{review.quote}"</blockquote>
            <footer>
              <cite className="not-italic">
                <span className="font-semibold text-slate-900">{review.name}</span>
                <span className="block text-sm text-slate-500">{review.role}</span>
              </cite>
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full mt-2">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified Google Review
              </span>
            </footer>
          </div>
        ))}
      </div>

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AggregateRating',
            ratingValue: averageRating.toFixed(1),
            reviewCount: reviews.length,
            bestRating: '5',
            worstRating: '1',
          }),
        }}
      />
    </div>
  );
}
