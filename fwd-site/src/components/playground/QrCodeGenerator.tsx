import { useState, useRef, useEffect } from 'react';

type TabKey = 'url' | 'wifi' | 'text';

interface TabConfig {
  key: TabKey;
  label: string;
}

const TABS: TabConfig[] = [
  { key: 'url', label: 'Website URL' },
  { key: 'wifi', label: 'Wi-Fi Network' },
  { key: 'text', label: 'Plain Text' },
];

export default function QrCodeGenerator() {
  const [activeTab, setActiveTab] = useState<TabKey>('url');
  const [url, setUrl] = useState('https://f-w-d.co.uk');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');
  const [plainText, setPlainText] = useState('');
  const [fgColour, setFgColour] = useState('#000000');
  const [bgColour, setBgColour] = useState('#ffffff');
  const [size, setSize] = useState(300);
  const imgRef = useRef<HTMLImageElement>(null);

  const getQrData = (): string => {
    switch (activeTab) {
      case 'url':
        return url || 'https://example.com';
      case 'wifi':
        return `WIFI:T:${wifiSecurity};S:${wifiName};P:${wifiPassword};;`;
      case 'text':
        return plainText || 'Hello';
      default:
        return '';
    }
  };

  const data = getQrData();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${fgColour.replace('#', '')}&bgcolor=${bgColour.replace('#', '')}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'qr-code.png';
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-1">QR Code Generator</h3>
      <p className="text-sm text-slate-500 mb-4">
        Generate QR codes for URLs, Wi-Fi networks, or any text. No sign-up needed.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1" role="tablist" aria-label="QR code content type">
        {TABS.map((tab) => (
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

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          {activeTab === 'url' && (
            <div>
              <label htmlFor="qr-url" className="block text-sm font-medium text-slate-700 mb-1">
                Website URL
              </label>
              <input
                id="qr-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.co.uk"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
              />
            </div>
          )}

          {activeTab === 'wifi' && (
            <>
              <div>
                <label htmlFor="wifi-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Network Name
                </label>
                <input
                  id="wifi-name"
                  type="text"
                  value={wifiName}
                  onChange={(e) => setWifiName(e.target.value)}
                  placeholder="My Wi-Fi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="wifi-pass" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="wifi-pass"
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="wifi-security" className="block text-sm font-medium text-slate-700 mb-1">
                  Security Type
                </label>
                <select
                  id="wifi-security"
                  value={wifiSecurity}
                  onChange={(e) => setWifiSecurity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (no password)</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'text' && (
            <div>
              <label htmlFor="qr-text" className="block text-sm font-medium text-slate-700 mb-1">
                Plain Text
              </label>
              <textarea
                id="qr-text"
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="Enter any text here..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Colour pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qr-fg" className="block text-sm font-medium text-slate-700 mb-1">
                Foreground
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="qr-fg"
                  type="color"
                  value={fgColour}
                  onChange={(e) => setFgColour(e.target.value)}
                  className="w-11 h-11 rounded border border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-mono">{fgColour}</span>
              </div>
            </div>
            <div>
              <label htmlFor="qr-bg" className="block text-sm font-medium text-slate-700 mb-1">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="qr-bg"
                  type="color"
                  value={bgColour}
                  onChange={(e) => setBgColour(e.target.value)}
                  className="w-11 h-11 rounded border border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-mono">{bgColour}</span>
              </div>
            </div>
          </div>

          {/* Size slider */}
          <div>
            <label htmlFor="qr-size" className="block text-sm font-medium text-slate-700 mb-1">
              Size: {size}px
            </label>
            <input
              id="qr-size"
              type="range"
              min={200}
              max={500}
              step={50}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-amber-500 min-h-[44px]"
            />
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2.5 rounded-lg transition-colors min-h-[44px]"
          >
            Download PNG
          </button>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Live Preview</p>
          <div
            className="rounded-lg overflow-hidden shadow-sm border border-slate-200"
            style={{ backgroundColor: bgColour }}
          >
            <img
              ref={imgRef}
              src={qrUrl}
              alt={`QR code for ${data}`}
              width={Math.min(size, 250)}
              height={Math.min(size, 250)}
              className="block"
            />
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="text-sm text-slate-500 italic mt-5 flex items-start gap-2">
        <span className="text-amber-500 text-base leading-5" aria-hidden="true">💡</span>
        Restaurants pay monthly for QR code menus. A custom solution costs nothing to run.
      </p>
    </div>
  );
}
