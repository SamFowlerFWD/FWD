import React, { useState, useEffect } from 'react';

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks: NavLink[] = [
    { label: 'Services', href: '#services' },
    { label: 'Industries', href: '#industries' },
    { label: 'Case Studies', href: '#case-studies' },
    { label: 'About', href: '#about' },
    { label: 'Pricing', href: '#pricing', badge: 'New' }
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
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-ai-purple to-trust-blue rounded-lg flex items-center justify-center text-white font-bold text-xl">
                F
              </div>
              <span className="text-2xl font-bold text-deep-space">FWD</span>
              <span className="hidden sm:inline text-sm text-gray-600">AI Agency</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-gray-700 hover:text-ai-purple transition-colors font-medium"
              >
                {link.label}
                {link.badge && (
                  <span className="absolute -top-2 -right-6 bg-urgent-amber text-white text-xs px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="text-gray-700 hover:text-ai-purple transition-colors font-medium">
              Sign In
            </button>
            <button className="bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Get Started Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden relative w-10 h-10 flex flex-col items-center justify-center"
            aria-label="Toggle mobile menu"
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
      <div className={`lg:hidden fixed inset-0 top-20 bg-white/95 backdrop-blur-md transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-4">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-xl font-medium text-gray-700 hover:text-ai-purple transition-colors py-2"
              >
                {link.label}
                {link.badge && (
                  <span className="ml-2 bg-urgent-amber text-white text-xs px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
            <button className="w-full text-gray-700 hover:text-ai-purple transition-colors font-medium py-3 border border-gray-300 rounded-lg">
              Sign In
            </button>
            <button className="w-full bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg">
              Get Started Free
            </button>
          </div>

          <div className="mt-8 p-4 bg-urgent-amber/10 rounded-lg border border-urgent-amber/20">
            <p className="text-sm text-urgent-amber font-medium">
              🔥 Limited Time: Get 30% off your first 3 months
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;