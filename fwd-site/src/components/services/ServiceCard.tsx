import React, { useState } from 'react';

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  monthlyPrice?: string;
  benefits: string[];
  competitorCount: number;
  savingsAmount: string;
  href: string;
  badge?: string;
  icon: string;
  testimonial?: {
    quote: string;
    author: string;
    location: string;
  };
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  price,
  monthlyPrice,
  benefits,
  competitorCount,
  savingsAmount,
  href,
  badge,
  icon,
  testimonial
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Competitor Badge */}
      {competitorCount > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-urgent-amber/10 border border-urgent-amber/20 rounded-full px-3 py-1 animate-pulse-subtle">
          <span className="text-xs font-medium text-urgent-amber">
            {competitorCount} competitors have this
          </span>
        </div>
      )}

      {/* Special Badge */}
      {badge && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-ai-purple to-trust-blue text-white text-xs font-bold px-3 py-1 rounded-br-lg">
          {badge}
        </div>
      )}

      <div className="p-6">
        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br from-ai-purple/10 to-trust-blue/10 flex items-center justify-center transition-all duration-300 text-2xl ${
            isHovered ? 'scale-110 rotate-3' : ''
          }`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-deep-space mb-1">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-deep-space">{price}</span>
            {monthlyPrice && (
              <span className="text-sm text-gray-500">or {monthlyPrice}/month</span>
            )}
          </div>
          <div className="text-sm text-success-green mt-1 font-medium">
            Save {savingsAmount} vs traditional solutions
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <svg className="w-5 h-5 text-success-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Testimonial Quote */}
        {testimonial && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg border-l-2 border-ai-purple">
            <p className="text-xs text-gray-600 italic mb-1">"{testimonial.quote}"</p>
            <p className="text-xs font-medium text-gray-700">
              {testimonial.author}, {testimonial.location}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <a 
          href={href}
          className="block w-full text-center bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-xl"
        >
          Learn More & Save
        </a>

        {/* Urgency Text */}
        <p className="text-xs text-center text-gray-500 mt-3">
          Only 3 spots left this month
        </p>
      </div>

      {/* Hover Effect Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-ai-purple/5 to-transparent pointer-events-none animate-fade-in" />
      )}
    </div>
  );
};

export default ServiceCard;