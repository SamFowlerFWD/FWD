import React, { useState, useEffect } from 'react';

interface NavLink {
  label: string;
  href: string;
  badge?: string;
  dropdown?: {
    label: string;
    href: string;
    description?: string;
    badge?: string;
  }[];
}

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navLinks: NavLink[] = [
    { 
      label: 'AI Playground',
      href: '/playground',
      badge: 'Try Now'
    },
    { 
      label: 'Services', 
      href: '#services',
      dropdown: [
        { 
          label: 'Business Process Automation', 
          href: '/services/business-process-automation',
          description: 'Turn 40-hour weeks into 4-hour oversight',
          badge: 'Hot'
        },
        { 
          label: 'Professional Websites', 
          href: '/services/professional-websites',
          description: 'Modern websites built efficiently'
        },
        { 
          label: 'Custom App Development', 
          href: '/services/custom-app-development',
          description: 'Bespoke apps for your business'
        },
        { 
          label: 'Reliable Hosting & Maintenance', 
          href: '/services/reliable-hosting-maintenance',
          description: 'Keep your site running smoothly',
          badge: 'From £99/mo'
        }
      ]
    },
    { label: 'Industries', href: '#industries' },
    { label: 'Case Studies', href: '#case-studies' },
    { label: 'About', href: '#about' },
    { label: 'Pricing', href: '#pricing', badge: 'From £299' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm border-b border-gray-100'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-32 py-4">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-3" aria-label="FWD home page">
              <img 
                src="/fwd-logo.webp" 
                alt="FWD - AI Solutions Agency" 
                className="h-[120px] w-auto"
                loading="lazy"
              />
              <span className="hidden sm:inline text-sm text-gray-800 font-medium">AI Agency</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.dropdown ? undefined : link.href}
                  className="relative text-gray-800 hover:text-ai-purple transition-colors font-medium cursor-pointer flex items-center gap-1"
                  aria-label={link.label}
                  aria-haspopup={link.dropdown ? "true" : undefined}
                  aria-expanded={link.dropdown && activeDropdown === link.label ? "true" : "false"}
                >
                  {link.label}
                  {link.dropdown && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {link.badge && (
                    <span className="absolute -top-2 -right-12 bg-gold text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                      {link.badge}
                    </span>
                  )}
                </a>
                
                {/* Dropdown Menu */}
                {link.dropdown && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50" role="menu" aria-orientation="vertical">
                    {link.dropdown.map(item => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                        role="menuitem"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-deep-space">{item.label}</div>
                            {item.description && (
                              <div className="text-sm text-gray-800 mt-1">{item.description}</div>
                            )}
                          </div>
                          {item.badge && (
                            <span className="bg-gold text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="text-gray-800 hover:text-ai-purple transition-colors font-medium" aria-label="Sign in to your account">
              Sign In
            </button>
            <button className="bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" aria-label="Get started with FWD for free">
              Get Started Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden relative w-10 h-10 flex flex-col items-center justify-center"
            aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`block w-6 h-0.5 bg-deep-space transition-all duration-200 ${
              isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
            }`}></span>
            <span className={`block w-6 h-0.5 bg-deep-space my-1 transition-all duration-200 ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`}></span>
            <span className={`block w-6 h-0.5 bg-deep-space transition-all duration-200 ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 top-20 bg-white/95 backdrop-blur-md transition-transform duration-300 overflow-y-auto ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
        role="dialog"
        aria-label="Mobile navigation menu"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-4">
            {navLinks.map(link => (
              <div key={link.href}>
                {link.dropdown ? (
                  <details className="group">
                    <summary className="flex items-center justify-between text-xl font-medium text-gray-800 hover:text-ai-purple transition-colors py-2 cursor-pointer list-none">
                      {link.label}
                      <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="ml-4 mt-2 space-y-2">
                      {link.dropdown.map(item => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2"
                        >
                          <div className="font-medium text-deep-space flex items-center gap-2">
                            {item.label}
                            {item.badge && (
                              <span className="bg-gold text-white text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-800 mt-1">{item.description}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  </details>
                ) : (
                  <a
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xl font-medium text-gray-800 hover:text-ai-purple transition-colors py-2"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="ml-2 bg-gold text-white text-xs px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </a>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
            <button className="w-full text-gray-800 hover:text-ai-purple transition-colors font-medium py-3 border border-gray-300 rounded-lg" aria-label="Sign in to your account">
              Sign In
            </button>
            <button className="w-full bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg" aria-label="Get started with FWD for free">
              Get Started Free
            </button>
          </div>

          <div className="mt-8 p-4 bg-gold/10 rounded-lg border border-gold/20">
            <p className="text-sm text-gold-dark font-medium">
              🔥 Limited Time: Get 30% off your first 3 months
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;