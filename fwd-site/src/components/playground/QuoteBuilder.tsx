import { useState } from 'react';

interface LineItem {
  description: string;
  unitPrice: number;
  quantity: number;
}

interface IndustryData {
  label: string;
  items: { description: string; unitPrice: number }[];
}

const INDUSTRIES: Record<string, IndustryData> = {
  plumber: {
    label: 'Plumber',
    items: [
      { description: 'Fix leaking tap', unitPrice: 85 },
      { description: 'Install new radiator', unitPrice: 350 },
      { description: 'Unblock drain', unitPrice: 95 },
      { description: 'Boiler service', unitPrice: 120 },
      { description: 'Install new bathroom suite', unitPrice: 2800 },
      { description: 'Emergency callout', unitPrice: 150 },
    ],
  },
  builder: {
    label: 'Builder',
    items: [
      { description: 'Brick wall (per m\u00B2)', unitPrice: 95 },
      { description: 'Plaster room', unitPrice: 450 },
      { description: 'Fit new door', unitPrice: 180 },
      { description: 'Build garden wall', unitPrice: 1200 },
      { description: 'Loft conversion consultation', unitPrice: 250 },
      { description: 'General labour (per day)', unitPrice: 220 },
    ],
  },
  cleaner: {
    label: 'Cleaner',
    items: [
      { description: 'Standard clean (3 bed)', unitPrice: 75 },
      { description: 'Deep clean (3 bed)', unitPrice: 180 },
      { description: 'End of tenancy clean', unitPrice: 250 },
      { description: 'Oven clean', unitPrice: 55 },
      { description: 'Carpet cleaning (per room)', unitPrice: 40 },
      { description: 'Window cleaning', unitPrice: 35 },
    ],
  },
  electrician: {
    label: 'Electrician',
    items: [
      { description: 'Replace light fitting', unitPrice: 65 },
      { description: 'Install new socket', unitPrice: 95 },
      { description: 'Full rewire survey', unitPrice: 200 },
      { description: 'Fuse board replacement', unitPrice: 850 },
      { description: 'PAT testing (per item)', unitPrice: 3 },
      { description: 'Emergency callout', unitPrice: 150 },
    ],
  },
  gardener: {
    label: 'Gardener',
    items: [
      { description: 'Lawn mowing (standard)', unitPrice: 30 },
      { description: 'Hedge trimming', unitPrice: 45 },
      { description: 'Garden clearance (half day)', unitPrice: 250 },
      { description: 'Fence panel replacement', unitPrice: 120 },
      { description: 'Patio jet wash', unitPrice: 95 },
      { description: 'Tree pruning', unitPrice: 180 },
    ],
  },
};

function generateQuoteNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `Q${y}${m}-${seq}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function QuoteBuilder() {
  const [selectedIndustry, setSelectedIndustry] = useState('plumber');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [businessName, setBusinessName] = useState('Your Business Name');
  const [includeVat, setIncludeVat] = useState(false);
  const [quoteNumber] = useState(generateQuoteNumber);

  const industry = INDUSTRIES[selectedIndustry];

  const addItem = (item: { description: string; unitPrice: number }) => {
    const existing = lineItems.findIndex((li) => li.description === item.description);
    if (existing >= 0) {
      const updated = [...lineItems];
      updated[existing].quantity += 1;
      setLineItems(updated);
    } else {
      setLineItems([...lineItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
      return;
    }
    const updated = [...lineItems];
    updated[index].quantity = qty;
    setLineItems(updated);
  };

  const removeItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vat = includeVat ? subtotal * 0.2 : 0;
  const total = subtotal + vat;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Item selector */}
        <div>
          {/* Industry tabs */}
          <fieldset>
            <legend className="block text-sm font-semibold text-slate-700 mb-3">Select your trade</legend>
            <div className="flex flex-wrap gap-2 mb-6" role="radiogroup" aria-label="Industry selection">
              {Object.entries(INDUSTRIES).map(([key, ind]) => (
                <button
                  key={key}
                  onClick={() => setSelectedIndustry(key)}
                  type="button"
                  role="radio"
                  aria-checked={selectedIndustry === key}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    selectedIndustry === key
                      ? 'bg-purple-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Line items to add */}
          <p className="text-sm font-semibold text-slate-700 mb-3">Click to add to quote</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {industry.items.map((item) => (
              <button
                key={item.description}
                onClick={() => addItem(item)}
                type="button"
                className="text-left border border-slate-200 rounded-lg px-4 py-3 hover:border-purple-300 hover:bg-purple-50 transition-colors min-h-[44px]"
              >
                <span className="text-sm text-slate-800 block">{item.description}</span>
                <span className="text-sm font-semibold text-slate-600">
                  £{item.unitPrice.toFixed(2)}
                </span>
              </button>
            ))}
          </div>

          {/* Client details */}
          <div className="space-y-3">
            <div>
              <label htmlFor="qb-business" className="block text-sm font-medium text-slate-700 mb-1">
                Your business name
              </label>
              <input
                id="qb-business"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="qb-client" className="block text-sm font-medium text-slate-700 mb-1">
                Client name
              </label>
              <input
                id="qb-client"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Mrs Johnson"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="qb-address" className="block text-sm font-medium text-slate-700 mb-1">
                Client address
              </label>
              <input
                id="qb-address"
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="e.g. 14 Oak Lane, Norwich, NR1 3AB"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right: Quote preview */}
        <div className="print-area">
          <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{businessName}</h3>
                <p className="text-sm text-slate-500">Quote</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p className="font-semibold">{quoteNumber}</p>
                <p>{formatDate()}</p>
              </div>
            </div>

            {(clientName || clientAddress) && (
              <div className="mb-4 text-sm text-slate-700">
                <p className="font-medium">Quoted for:</p>
                {clientName && <p>{clientName}</p>}
                {clientAddress && <p>{clientAddress}</p>}
              </div>
            )}

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Add items from the left to build your quote</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 text-slate-600 font-medium">Description</th>
                      <th className="text-center py-2 text-slate-600 font-medium w-16">Qty</th>
                      <th className="text-right py-2 text-slate-600 font-medium w-24">Unit</th>
                      <th className="text-right py-2 text-slate-600 font-medium w-24">Total</th>
                      <th className="w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-200">
                        <td className="py-2 text-slate-800">{item.description}</td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(i, parseInt(e.target.value) || 0)}
                            className="w-14 text-center border border-slate-300 rounded px-1 py-1 text-sm print:border-none"
                            aria-label={`Quantity for ${item.description}`}
                          />
                        </td>
                        <td className="py-2 text-right text-slate-700">
                          £{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-slate-900 font-medium">
                          £{(item.unitPrice * item.quantity).toFixed(2)}
                        </td>
                        <td className="py-2 text-center print:hidden">
                          <button
                            onClick={() => removeItem(i)}
                            type="button"
                            className="text-slate-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={`Remove ${item.description}`}
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1 text-sm text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900 font-medium">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVat}
                        onChange={(e) => setIncludeVat(e.target.checked)}
                        className="rounded border-slate-300 min-w-[20px] min-h-[20px]"
                      />
                      VAT (20%)
                    </label>
                    <span className="text-slate-700">£{vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300">
                    <span className="text-slate-900 font-bold text-lg">Total</span>
                    <span className="text-slate-900 font-bold text-lg">£{total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {lineItems.length > 0 && (
              <button
                onClick={handlePrint}
                type="button"
                className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors min-h-[44px] print:hidden"
              >
                Print Quote
              </button>
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
          A custom quoting tool like this takes a few days to build. No monthly subscription, no third-party platform taking a cut.
        </p>
      </div>
    </div>
  );
}