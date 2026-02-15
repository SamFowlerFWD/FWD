import React, { useState, useEffect } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
        applyCookiePreferences(savedPrefs);
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Apply preferences - this is where you'd enable/disable tracking scripts
    if (prefs.analytics) {
      // Enable analytics cookies (Google Analytics, etc.)
      window.gtag?.('consent', 'update', {
        'analytics_storage': 'granted'
      });
    } else {
      // Disable analytics cookies
      window.gtag?.('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }

    if (prefs.marketing) {
      // Enable marketing cookies
      window.gtag?.('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    } else {
      // Disable marketing cookies
      window.gtag?.('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyCookiePreferences(allAccepted);
    setShowBanner(false);
  };

  const acceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyCookiePreferences(preferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const rejectAll = () => {
    const rejected = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(rejected);
    localStorage.setItem('cookieConsent', JSON.stringify(rejected));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyCookiePreferences(rejected);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]" 
        aria-hidden="true"
        onClick={() => setShowDetails(false)}
      />
      
      {/* Cookie Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t-4 border-ai-purple shadow-2xl"
        role="dialog"
        aria-label="Cookie consent"
        aria-describedby="cookie-description"
      >
        <div className="container mx-auto px-6 py-6 lg:px-8">
          <div className="lg:flex lg:items-start lg:justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-deep-space mb-2">
                Cookie Preferences
              </h2>
              <p id="cookie-description" className="text-gray-600 text-sm mb-4">
                We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                By clicking "Accept All", you consent to our use of cookies. 
                <a 
                  href="/privacy-policy" 
                  className="text-ai-purple hover:text-deep-space underline ml-1"
                  target="_blank"
                  rel="noopener"
                >
                  Read our Privacy Policy
                </a>
              </p>

              {showDetails && (
                <div className="space-y-4 mb-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={preferences.necessary}
                        disabled
                        className="mt-1 mr-3 h-4 w-4 text-gray-200"
                        aria-label="Necessary cookies (required)"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Necessary Cookies</span>
                        <span className="text-xs text-gray-500 ml-2">(Always enabled)</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Essential for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                        className="mt-1 mr-3 h-4 w-4 text-ai-purple focus:ring-ai-purple"
                        aria-label="Analytics cookies"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Analytics Cookies</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Help us understand how visitors interact with our website by collecting anonymous information.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                        className="mt-1 mr-3 h-4 w-4 text-ai-purple focus:ring-ai-purple"
                        aria-label="Marketing cookies"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Marketing Cookies</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Used to track visitors across websites to display relevant advertisements.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 lg:ml-8">
              {!showDetails ? (
                <>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Manage cookie preferences"
                  >
                    Manage Preferences
                  </button>
                  <button
                    onClick={rejectAll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Reject all cookies"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-ai-purple rounded-lg hover:bg-deep-space focus:outline-none focus:ring-2 focus:ring-ai-purple"
                    aria-label="Accept all cookies"
                  >
                    Accept All
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Cancel preference changes"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={acceptSelected}
                    className="px-4 py-2 text-sm font-medium text-white bg-ai-purple rounded-lg hover:bg-deep-space focus:outline-none focus:ring-2 focus:ring-ai-purple"
                    aria-label="Save cookie preferences"
                  >
                    Save Preferences
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default CookieConsent;