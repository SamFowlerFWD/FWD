// Every service FWD sells, and every price the site shows, in one place.
// Change a number in PRICES and the menu, homepage, services and pricing pages,
// service pages, hub pages, llms.txt and Google's structured data all follow.
// Blog posts are dated articles and still carry their own prices.

import type { ServiceKey } from './taxonomy';

export const PRICES = {
  websites: { starter: 299, professional: 799, bespoke: 1999, typicalTo: 2500 },
  automation: { simple: 799, typicalFrom: 1500, complex: 3000 },
  apps: { smaller: 1299, typicalFrom: 2000, larger: 5000 },
  hosting: { standard: 20, premium: 149 },
  ai: { oneToOne: 299, workshop: 499, support: 99 },
} as const;

/** Payment plans are offered on projects over this amount. */
export const PAYMENT_PLANS_OVER = 2000;

/** 1299 -> "£1,299" */
export const gbp = (amount: number) => `£${amount.toLocaleString('en-GB')}`;

export interface Service {
  key: ServiceKey;
  /** Short tag used on project and blog cards, e.g. "Websites". */
  label: string;
  /** Full name: menu, footer, services page, related links. */
  name: string;
  /** Shorter name for tight spaces: homepage cards, pricing page. */
  shortName: string;
  href: string;
  icon: string;
  /** Lowest price. */
  from: number;
  monthly?: boolean;
  /** One line under the name in the menu. */
  menuText: string;
  /** Homepage card. */
  homeText: string;
  /** Services page card. */
  summary: string;
  highlights: string[];
  /** Pricing page card. */
  pricingText: string;
  /** Business schema offer catalog. */
  schemaDescription: string;
}

export const SERVICES: Record<ServiceKey, Service> = {
  websites: {
    key: 'websites',
    label: 'Websites',
    name: 'Web Design',
    shortName: 'Web Design',
    href: '/services/professional-websites',
    icon: '🌐',
    from: PRICES.websites.starter,
    menuText: 'Fast websites for Norfolk and UK businesses',
    homeText: 'Fast, mobile-friendly websites for Norwich and Norfolk businesses, built in 2 to 3 weeks. SEO-ready from day one.',
    summary: 'Fast, mobile-friendly websites that represent your business well. Built in 2 to 3 weeks, SEO-ready from day one. You own everything, no subscriptions, no lock-in.',
    highlights: ['Mobile responsive', 'SEO optimised', 'Fast loading', 'Easy to update'],
    pricingText: 'Clean, fast, mobile-friendly sites that represent your business well.',
    schemaDescription: 'Fast, mobile-friendly, SEO-optimised websites for businesses in Norwich, Norfolk and the UK',
  },
  automation: {
    key: 'automation',
    label: 'Automation',
    name: 'Business Process Automation',
    shortName: 'Business Automation',
    href: '/services/business-process-automation',
    icon: '⚡',
    from: PRICES.automation.simple,
    menuText: 'Turn 40-hour weeks into 4-hour oversight',
    homeText: 'Automate invoicing, emails, data entry and scheduling. Let technology handle the routine.',
    summary: 'Automate the repetitive tasks that eat into your day. Invoicing, emails, data entry, and scheduling. Let technology handle the routine work.',
    highlights: ['Invoice & data processing', 'Email automation', 'Workflow integration', 'Works with your existing tools'],
    pricingText: 'Automate repetitive tasks like invoicing, emails, and data entry.',
    schemaDescription: 'Automate repetitive business tasks including invoicing, emails, data entry and scheduling',
  },
  apps: {
    key: 'apps',
    label: 'Apps',
    name: 'Custom App Development',
    shortName: 'Custom Apps',
    href: '/services/custom-app-development',
    icon: '📱',
    from: PRICES.apps.smaller,
    menuText: 'Bespoke apps for your business',
    homeText: 'Booking systems, dashboards, internal tools. Built around your specific needs.',
    summary: 'Bespoke web and mobile applications built to solve your specific business problems. Booking systems, dashboards, and internal tools.',
    highlights: ['Web & mobile apps', 'Booking systems', 'Business dashboards', 'API development'],
    pricingText: 'Bespoke software built around your specific business needs.',
    schemaDescription: 'Bespoke web and mobile applications including booking systems, dashboards and internal tools',
  },
  hosting: {
    key: 'hosting',
    label: 'Hosting',
    name: 'Hosting & Maintenance',
    shortName: 'Hosting & Maintenance',
    href: '/services/hosting-maintenance',
    icon: '🚀',
    from: PRICES.hosting.standard,
    monthly: true,
    menuText: 'Keep your site running smoothly',
    homeText: 'Daily backups, security updates, performance monitoring and support when you need it.',
    summary: 'Reliable hosting with daily backups, security updates, and support when you need it. I keep your site running so you can focus on your business.',
    highlights: ['Daily backups', 'Security updates', 'Performance monitoring', 'Email support'],
    pricingText: 'Reliable hosting with backups, security updates, and support.',
    schemaDescription: 'Reliable hosting with daily backups, security updates, performance monitoring and support',
  },
  ai: {
    key: 'ai',
    label: 'AI',
    name: 'AI Training',
    shortName: 'AI Training',
    href: '/services/ai-training',
    icon: '🤖',
    from: PRICES.ai.oneToOne,
    menuText: 'Learn to use AI tools properly',
    homeText: 'Learn to use ChatGPT, Claude and AI tools properly. Hands-on training for your team.',
    summary: 'Learn to use ChatGPT, Claude, and AI tools properly. Hands-on training tailored to your actual workflows, not generic tips.',
    highlights: ['1-to-1 sessions', 'Team workshops', 'Ongoing support', 'Practical, not theoretical'],
    pricingText: 'Hands-on training for ChatGPT, Claude, and other AI tools.',
    schemaDescription: 'Hands-on AI training for businesses in Norwich, Norfolk and across the UK',
  },
};

/** The order services appear in lists across the site. */
export const SERVICE_ORDER: ServiceKey[] = ['websites', 'automation', 'apps', 'hosting', 'ai'];

export const serviceList = (order: ServiceKey[] = SERVICE_ORDER) => order.map(key => SERVICES[key]);

/** "From £299", "From £20/month" (or "From £20/mo" when short). */
export const fromPrice = (service: Service, short = false) =>
  `From ${gbp(service.from)}${service.monthly ? (short ? '/mo' : '/month') : ''}`;
