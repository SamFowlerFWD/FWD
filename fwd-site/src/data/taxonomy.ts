// One set of tags for the whole site. Projects, blog posts and hub pages all
// use these keys, so related links are built from data instead of by hand.

export const INDUSTRIES = {
  equestrian: { label: 'Equestrian', href: '/equestrian', hub: true },
  engineering: { label: 'Engineering & Manufacturing', href: '/engineering', hub: true },
  'pet-services': { label: 'Pet Services', href: '/industries/pet-services', hub: false },
  'health-fitness': { label: 'Health & Fitness', href: '/industries/health-fitness', hub: false },
  'professional-services': { label: 'Professional Services', href: '/industries/professional-services', hub: false },
  'retail-ecommerce': { label: 'Retail & Ecommerce', href: '/industries/retail-ecommerce', hub: false },
  'technology-saas': { label: 'Technology & SaaS', href: '/industries/technology-saas', hub: false },
  'trades-construction': { label: 'Trades & Construction', href: '/industries/trades-construction', hub: false },
} as const;

export const SERVICES = {
  websites: { label: 'Websites', href: '/services/professional-websites' },
  apps: { label: 'Apps', href: '/services/custom-app-development' },
  automation: { label: 'Automation', href: '/services/business-process-automation' },
  ai: { label: 'AI', href: '/services/ai-training' },
  hosting: { label: 'Hosting', href: '/services/hosting-maintenance' },
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;
export type ServiceKey = keyof typeof SERVICES;

export const INDUSTRY_KEYS = Object.keys(INDUSTRIES) as [IndustryKey, ...IndustryKey[]];
export const SERVICE_KEYS = Object.keys(SERVICES) as [ServiceKey, ...ServiceKey[]];

// Industry content-collection slugs that now live at a hub URL instead.
export const HUB_REPLACES: Record<string, IndustryKey> = {
  equestrian: 'equestrian',
  manufacturing: 'engineering',
};
