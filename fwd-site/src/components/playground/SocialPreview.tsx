import { useState } from 'react';

type PreviewTab = 'google' | 'facebook' | 'twitter';

export default function SocialPreview() {
  const [title, setTitle] = useState('FWD Thinking Solutions | AI-Powered Software for UK SMBs');
  const [description, setDescription] = useState(
    'Custom software, automation, and AI-powered websites for small businesses across Norfolk and the UK. Save money, save time, grow faster.'
  );
  const [pageUrl, setPageUrl] = useState('https://f-w-d.co.uk/services');
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState<PreviewTab>('google');

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  const domain = (() => {
    try {
      return new URL(pageUrl).hostname;
    } catch {
      return 'example.co.uk';
    }
  })();

  const breadcrumb = (() => {
    try {
      const u = new URL(pageUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      return u.hostname + (parts.length ? ' › ' + parts.join(' › ') : '');
    } catch {
      return 'example.co.uk';
    }
  })();

  const titleLen = title.length;
  const descLen = description.length;

  const tabs: { key: PreviewTab; label: string }[] = [
    { key: 'google', label: 'Google' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'twitter', label: 'Twitter/X' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Social &amp; Search Preview</h3>
      <p className="text-sm text-slate-500 mb-4">
        See how your page will look on Google, Facebook, and Twitter before you publish.
      </p>

      {/* Inputs */}
      <div className="space-y-3 mb-5">
        <div>
          <label htmlFor="sp-title" className="block text-sm font-medium text-slate-700 mb-1">
            Page Title
            <span className={`ml-2 text-xs font-normal ${titleLen > 60 ? 'text-red-500' : 'text-green-600'}`}>
              {titleLen}/60 chars
            </span>
          </label>
          <input
            id="sp-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
          />
        </div>
        <div>
          <label htmlFor="sp-desc" className="block text-sm font-medium text-slate-700 mb-1">
            Description
            <span className={`ml-2 text-xs font-normal ${descLen > 160 ? 'text-red-500' : 'text-green-600'}`}>
              {descLen}/160 chars
            </span>
          </label>
          <textarea
            id="sp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="sp-url" className="block text-sm font-medium text-slate-700 mb-1">
              Page URL
            </label>
            <input
              id="sp-url"
              type="url"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="sp-image" className="block text-sm font-medium text-slate-700 mb-1">
              Image URL <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="sp-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Preview tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1" role="tablist" aria-label="Preview platform">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium min-h-[44px] transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Previews */}
      <div className="bg-slate-50 rounded-lg p-4 sm:p-6 min-h-[180px]" role="tabpanel" aria-label={`${activeTab} preview`}>
        {activeTab === 'google' && (
          <div className="max-w-lg font-sans">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">Google Search Result</p>
            <div className="space-y-0.5">
              <p className="text-sm text-green-700 truncate">{breadcrumb}</p>
              <h4 className="text-lg text-blue-700 hover:underline cursor-pointer leading-snug">
                {truncate(title, 60)}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {truncate(description, 160)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'facebook' && (
          <div className="max-w-lg">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">Facebook / Open Graph Card</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {/* Image area */}
              <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="OG preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">1200 x 630px recommended</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{domain}</p>
                <p className="font-semibold text-slate-900 text-sm mt-0.5 leading-snug">{truncate(title, 65)}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{truncate(description, 130)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'twitter' && (
          <div className="max-w-lg">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">Twitter/X Summary Card</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              {/* Image area */}
              <div className="h-36 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Twitter card preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">Add an image URL above</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{truncate(title, 70)}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{truncate(description, 125)}</p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {domain}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <p className="text-sm text-slate-500 italic mt-5 flex items-start gap-2">
        <span className="text-amber-500 text-base leading-5" aria-hidden="true">💡</span>
        SEO tools charge £100+/month for this. Check how your pages look before you publish, for free.
      </p>
    </div>
  );
}
