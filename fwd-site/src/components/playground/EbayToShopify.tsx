import { useState } from 'react';

const SAMPLE_LISTING = `<div class="listing-title">VINTAGE Mid Century TEAK sideboard - BEAUTIFUL condition!!</div>
<p class="desc">Lovely vintage <b>TEAK SIDEBOARD</b> from the 1960s.   Three drawers and   TWO   cupboards.  <br/><br/>
Some minor scratches on top but overall EXCELLENT   condition for its age!!!</p>
<span style="color:red; font-size:18px">PRICE: £285 ONO</span>
<div class="dims">Dimensions approx:   152cm   wide x  45cm  deep x   78cm  high</div>
<p><i>Can deliver within   30 miles of  NORWICH    for £35,  otherwise BUYER   COLLECTS</i></p>
<br/><br/>
<div class="listing-title">SET of 4 vintage DINING   CHAIRS - ercol style</div>
<p>Set of four <b>elm and beech   dining chairs</b>.  Solid   frames,   seats have some wear.
<span>Would benefit from   reupholstering but   perfectly   USABLE   as they are!!!</span></p>
<span class="price">asking   £120 for the   SET</span>
<p>dims -  each chair   approx 45cm w x   42cm d x  88cm   h (seat height    46cm)</p>
<p style="color:green">COLLECTION ONLY from    NR3   norwich.   Cash or   bank   transfer.</p>
<br/>
<div class="listing-title">large   VICTORIAN pine  BLANKET   box / toy chest</div>
<p><b>Original Victorian   PINE   blanket box</b>.   Could also be used as a   toy chest or   coffee table.
Has original   cast iron   HINGES   and lock (no key).   Some woodworm treatment marks   on base but   structurally SOUND.</p>
<span>£95   or   nearest offer</span>
<p>Size:    92cm long x   48cm   wide x   44cm   tall</p>
<p>Can   DELIVER   locally   for   £20.   Message for   details.</p>`;

interface ProductData {
  title: string;
  description: string;
  price: string;
  category: string;
  dimensions: string;
  condition: string;
  delivery: string;
}

function toTitleCase(str: string): string {
  const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in', 'with'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (i === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/sideboard|cabinet|dresser|cupboard/.test(lower)) return 'Sideboards & Cabinets';
  if (/chair|seat|stool/.test(lower)) return 'Chairs & Seating';
  if (/table|desk/.test(lower)) return 'Tables & Desks';
  if (/blanket box|chest|trunk|storage/.test(lower)) return 'Storage & Chests';
  if (/bookcase|shelv|shelf/.test(lower)) return 'Bookcases & Shelving';
  if (/sofa|settee|couch/.test(lower)) return 'Sofas & Seating';
  if (/bed|headboard|mattress/.test(lower)) return 'Bedroom Furniture';
  if (/mirror|frame|picture/.test(lower)) return 'Mirrors & Art';
  if (/lamp|light/.test(lower)) return 'Lighting';
  return 'Furniture';
}

function extractCondition(text: string): string {
  const lower = text.toLowerCase();
  if (/excellent|beautiful|perfect|immaculate|pristine/.test(lower)) return 'Excellent';
  if (/good|solid|sturdy|sound|usable/.test(lower)) return 'Good';
  if (/fair|worn|scratche?s?|minor|marks|woodworm|benefit from/.test(lower)) return 'Fair - some wear';
  if (/poor|damaged|broken|repair/.test(lower)) return 'For restoration';
  return 'Used';
}

function extractDelivery(text: string): string {
  const lower = text.toLowerCase();
  const deliveryMatch = lower.match(/deliver[y\s].*?(?:for\s*)?£(\d+)/);
  if (deliveryMatch) return `Local delivery available for £${deliveryMatch[1]}`;
  if (/deliver.*locally|local delivery/.test(lower)) return 'Local delivery available';
  if (/collection only|buyer collects/.test(lower)) return 'Collection only';
  if (/can deliver/.test(lower)) return 'Delivery available';
  return 'Collection only';
}

function parseListings(raw: string): ProductData[] {
  // Split on listing title divs or double line breaks that look like separators
  const chunks: string[] = [];
  const parts = raw.split(/<div class="listing-title">/i);

  for (let i = 1; i < parts.length; i++) {
    chunks.push('<div class="listing-title">' + parts[i]);
  }

  if (chunks.length === 0) {
    chunks.push(raw);
  }

  return chunks.map((chunk) => {
    // Strip HTML tags
    const text = chunk
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title from first line/chunk
    const titleMatch = chunk.match(/<div class="listing-title">(.*?)<\/div>/i);
    let title = titleMatch ? titleMatch[1] : text.split(/[.\n]/)[0];
    title = title
      .replace(/<[^>]+>/g, '')
      .replace(/!+/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[-–]\s*$/, '')
      .trim();
    title = toTitleCase(title);

    // Extract price
    const priceMatch = text.match(/£\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const price = priceMatch ? `£${priceMatch[1]}` : 'Price on request';

    // Extract dimensions
    const dimPatterns = [
      /(\d+)\s*cm\s*(?:wide|w)\s*x\s*(\d+)\s*cm\s*(?:deep|d)\s*x\s*(\d+)\s*cm\s*(?:high|h|tall)/i,
      /(\d+)\s*cm\s*(?:long|l)\s*x\s*(\d+)\s*cm\s*(?:wide|w)\s*x\s*(\d+)\s*cm\s*(?:tall|h|high)/i,
      /(\d+)\s*cm\s*w\s*x\s*(\d+)\s*cm\s*d\s*x\s*(\d+)\s*cm\s*h/i,
    ];
    let dimensions = '';
    for (const pattern of dimPatterns) {
      const match = text.match(pattern);
      if (match) {
        dimensions = `${match[1]}cm W x ${match[2]}cm D x ${match[3]}cm H`;
        break;
      }
    }
    if (!dimensions) {
      const generalDim = text.match(/(\d+)\s*cm\s*x\s*(\d+)\s*cm\s*x\s*(\d+)\s*cm/i);
      if (generalDim) {
        dimensions = `${generalDim[1]}cm x ${generalDim[2]}cm x ${generalDim[3]}cm`;
      }
    }

    // Build clean description
    let desc = text
      .replace(/£\s*\d+(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:ONO|ono|or nearest offer|for the set))?/gi, '')
      .replace(/\d+\s*cm\s*(?:wide|w|long|l|deep|d|high|h|tall)\s*x\s*\d+\s*cm\s*(?:wide|w|long|l|deep|d|high|h|tall)\s*x\s*\d+\s*cm\s*(?:wide|w|long|l|deep|d|high|h|tall)(?:\s*\([^)]*\))?/gi, '')
      .replace(/dims?\s*[-:.]?\s*/gi, '')
      .replace(/price\s*[-:.]?\s*/gi, '')
      .replace(/asking\s*/gi, '')
      .replace(/!+/g, '.')
      .replace(/,{2,}/g, ',')
      .replace(/\.\s*\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove title text from description
    const titleLower = title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const descWords = desc.split(' ');
    const titleWords = titleLower.split(' ');
    if (descWords.length > titleWords.length) {
      desc = desc.slice(title.length).replace(/^\s*[-–.]\s*/, '').trim();
    }

    // Clean up description start
    desc = desc.replace(/^\s*[-–.]\s*/, '').trim();
    if (desc.length > 0) {
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    }

    return {
      title,
      description: desc || 'No description available.',
      price,
      category: inferCategory(text),
      dimensions: dimensions || 'Not specified',
      condition: extractCondition(text),
      delivery: extractDelivery(text),
    };
  });
}

export default function EbayToShopify() {
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [hasConverted, setHasConverted] = useState(false);

  const loadExample = () => {
    setInput(SAMPLE_LISTING);
    setProducts([]);
    setHasConverted(false);
  };

  const convert = () => {
    if (!input.trim()) return;
    const results = parseListings(input);
    setProducts(results);
    setHasConverted(true);
  };

  const reset = () => {
    setInput('');
    setProducts([]);
    setHasConverted(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className={`${hasConverted ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
        {/* Input side */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="ebay-input" className="block text-sm font-semibold text-slate-700">
              {hasConverted ? 'Raw eBay Listing' : 'Paste a messy eBay listing (HTML and all)'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={loadExample}
                type="button"
                className="border border-slate-300 text-slate-700 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                Load Example
              </button>
              {hasConverted && (
                <button
                  onClick={reset}
                  type="button"
                  className="border border-slate-300 text-slate-700 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Start Over
                </button>
              )}
            </div>
          </div>
          <textarea
            id="ebay-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your eBay listing HTML here, or click 'Load Example' to see it in action..."
            className="w-full h-64 border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            aria-label="eBay listing input"
          />
          {!hasConverted && (
            <button
              onClick={convert}
              type="button"
              disabled={!input.trim()}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Convert to Shopify Format
            </button>
          )}
        </div>

        {/* Output side */}
        {hasConverted && products.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Extracted Products ({products.length} found)
            </p>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {products.map((product, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{product.title}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-500">Price</span>
                      <p className="text-slate-900 font-semibold text-lg">{product.price}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Category</span>
                      <p className="text-slate-900">{product.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Condition</span>
                      <p className="text-slate-900">{product.condition}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Dimensions</span>
                      <p className="text-slate-900">{product.dimensions}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-slate-500">Delivery</span>
                      <p className="text-slate-900">{product.delivery}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-slate-500">Description</span>
                      <p className="text-slate-700 text-sm leading-relaxed">{product.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-6 flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6c0 2.21 1.2 4.16 3 5.2V15a1 1 0 001 1h4a1 1 0 001-1v-1.8c1.8-1.04 3-2.99 3-5.2a6 6 0 00-6-6zm-1 14h2v1a1 1 0 01-2 0v-1z" />
        </svg>
        <p className="text-sm text-slate-500 italic">
          This script processed an entire catalogue of 500+ listings in seconds. Try doing that one ChatGPT prompt at a time.
        </p>
      </div>
    </div>
  );
}