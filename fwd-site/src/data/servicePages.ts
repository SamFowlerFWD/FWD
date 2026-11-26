// Content for the five service pages. Each one is rendered by
// src/pages/services/[slug].astro using ServicePage.astro, so they share one
// layout. Prices come from ./services.ts; never type a price here.
// Strings in `pricing.note` and `why.paragraphs` may contain simple <a> links.

import type { ServiceKey } from './taxonomy';
import { PRICES, gbp } from './services';

const P = PRICES;

export interface Link {
  label: string;
  href: string;
}

export interface Feature {
  icon: string;
  title: string;
  description?: string;
  /** A short checklist instead of a description. */
  examples?: string[];
}

/** A package card with a feature list, three to a row. */
export interface Tier {
  name: string;
  audience: string;
  /** null shows "Custom". */
  price: number | null;
  /** Show the price as "£1,999+". */
  plus?: boolean;
  /** Line under the price, e.g. "one-time payment" or "per month". */
  per: string;
  monthly?: boolean;
  features: string[];
  featured?: boolean;
  cta: string;
  schemaDescription: string;
}

/** A "from" price card with a short description, two to a row. */
export interface Range {
  name: string;
  price: number;
  text: string;
  note: string;
  schemaDescription: string;
}

export interface ServicePage {
  service: ServiceKey;
  title: string;
  description: string;
  hero: {
    heading: string;
    highlight: string;
    intro: string;
    secondary: Link;
  };
  features: { heading: string; intro?: string; items: Feature[] };
  process?: { heading: string; intro?: string; steps: { title: string; text: string }[] };
  audience: { heading: string; paragraphs?: string[]; bullets?: string[] };
  /** Case studies, looked up by id in ./projects.ts. */
  projects?: {
    heading: string;
    intro: string;
    items: { id: string; name?: string; tag: string; description: string; position?: string }[];
  };
  why?: {
    heading: string;
    paragraphs: string[];
    story?: { label: string; title: string; text: string; href: string; linkText: string };
  };
  pricing: {
    heading: string;
    intro: string;
    tiers?: Tier[];
    ranges?: Range[];
    included?: { heading: string; items: string[] };
    note?: string;
    /** Show the pay-monthly offer under the packages. */
    monthlyPlans?: boolean;
  };
  related: { service: ServiceKey; text: string }[];
  relatedMore?: Link;
  faqs: { question: string; answer: string }[];
  cta: { heading: string; text: string; whatsapp: string; secondary: Link };
  schema: { name: string; serviceType: string; description: string };
}

const WORK: Link = { label: 'View My Work', href: '/work' };

export const servicePages: ServicePage[] = [
  // ------------------------------------------------------------------ Websites
  {
    service: 'websites',
    title: 'Web Design in Norwich & Norfolk | Sam Fowler',
    description: `Web design for Norwich and Norfolk businesses by Sam Fowler, formerly Fowler Web Design. Fixed prices from ${gbp(P.websites.starter)}, built in 2 to 3 weeks, and you own everything.`,
    hero: {
      heading: 'Web Design in',
      highlight: 'Norwich & Norfolk',
      intro: "I'm Sam Fowler, the independent web designer behind FWD Thinking Solutions (formerly Fowler Web Design). I build websites for Norfolk businesses, from straightforward sites that bring in enquiries to custom builds that take bookings and payments and handle the admin.",
      secondary: WORK,
    },
    features: {
      heading: "What's Included",
      intro: 'Every website I build comes with these features as standard.',
      items: [
        { icon: '\u{1F4F1}', title: 'Mobile Responsive', description: 'Looks great on phones, tablets, and desktops.' },
        { icon: '\u{1F50D}', title: 'SEO Optimised', description: 'Built with search engine best practices to help you get found.' },
        { icon: '\u{26A1}', title: 'Fast Loading', description: 'Optimised for speed. No one waits around for a slow website.' },
        { icon: '\u{1F512}', title: 'Secure', description: 'SSL certificate and security best practices included.' },
        { icon: '\u{270F}\u{FE0F}', title: 'Easy to Update', description: 'Simple content management so you can make changes yourself.' },
        { icon: '\u{1F3A8}', title: 'Custom Design', description: 'Designed to match your brand, not a generic template.' },
      ],
    },
    process: {
      heading: 'How It Works',
      intro: 'From first conversation to live website in 2-3 weeks.',
      steps: [
        { title: 'Consultation', text: 'We discuss your business, your goals, and what you need from your website.' },
        { title: 'Design & Build', text: 'I design and build your site, sharing progress along the way so you can give feedback.' },
        { title: 'Launch & Training', text: 'Your website goes live. I walk you through how to manage and update it.' },
      ],
    },
    audience: {
      heading: 'Who Is This For?',
      paragraphs: [
        "Perfect for small businesses, tradespeople, rural enterprises, and anyone who needs a professional online presence without the agency price tag. Whether you're a new business getting online for the first time or an established company with an outdated website, I can help.",
        "I've built websites for manufacturers, equestrian businesses, fitness companies, safety consultants, builders, and more across Norwich, Norfolk, and the wider UK. Every project gets the same level of care regardless of budget.",
      ],
    },
    projects: {
      heading: 'Recent Norfolk Projects',
      intro: 'One simple site, one that does a lot more behind the scenes.',
      items: [
        {
          id: 'salon-64',
          tag: 'Dereham, Norfolk',
          position: 'object-center',
          description: 'A busy hair salon in Dereham town centre with no real online presence. I built them a fast site that shows off their work and helps them turn up when people search for a hairdresser in Dereham.',
        },
        {
          id: 'fakenham-dog-field',
          tag: 'Fakenham, Norfolk',
          description: 'A private dog field at Fakenham Racecourse. Customers book and pay online, and the system sends them a gate code automatically, so nobody has to be there to let them in.',
        },
      ],
    },
    pricing: {
      heading: 'Pricing',
      intro: 'Pay once and own it outright, or pay monthly with nothing upfront. No hidden fees.',
      tiers: [
        {
          name: 'Starter',
          audience: 'For small businesses',
          price: P.websites.starter,
          per: 'one-time payment',
          features: ['Up to 5 pages', 'Mobile responsive', 'Basic SEO setup', 'Contact form', '2 week delivery', '30 day support'],
          cta: 'Get in Touch',
          schemaDescription: 'Up to 5 pages, mobile responsive, basic SEO and a contact form',
        },
        {
          name: 'Professional',
          audience: 'For growing businesses',
          price: P.websites.professional,
          per: 'one-time payment',
          featured: true,
          features: ['Up to 10 pages', 'Custom design', 'Advanced SEO', 'Blog / news section', 'Social media integration', '3 week delivery', '90 day support'],
          cta: 'Get in Touch',
          schemaDescription: 'Up to 10 pages, custom design, advanced SEO and a blog',
        },
        {
          name: 'Bespoke',
          audience: 'For larger projects',
          price: P.websites.bespoke,
          plus: true,
          per: 'starting from',
          features: ['Unlimited pages', 'Bespoke design', 'Full SEO setup', 'E-commerce ready', 'Custom integrations', 'Priority delivery', '12 month support'],
          cta: 'Get in Touch',
          schemaDescription: 'Bespoke design, e-commerce and custom integrations',
        },
      ],
      note: 'All packages include a free consultation, professional design, and training on how to manage your site. Comparing quotes? Read <a href="/blog/how-much-does-a-website-cost-uk" class="text-ai-purple font-semibold hover:underline">how much a website costs in the UK</a>, including the yearly running costs.',
      monthlyPlans: true,
    },
    related: [
      { service: 'hosting', text: 'Keep your website running smoothly' },
      { service: 'automation', text: 'Automate your business workflows' },
      { service: 'apps', text: 'Build something more complex' },
    ],
    relatedMore: { label: 'View website projects on my work page', href: '/work' },
    faqs: [
      {
        question: 'How much does a website cost?',
        answer: `Websites start from ${gbp(P.websites.starter)} for a simple 5-page business site. Most businesses choose the Professional package at ${gbp(P.websites.professional)}, which includes up to 10 pages, custom design, and advanced SEO. Bespoke projects with e-commerce or complex features start from ${gbp(P.websites.bespoke)}. I provide a fixed quote before starting so there are no surprises.`,
      },
      {
        question: 'Can I pay monthly instead?',
        answer: `Yes. Pay monthly starts from ${gbp(P.monthly.from)} a month with nothing upfront, for your website, hosting and small changes each month. From there I can be as involved as you want: marketing, getting you found on Google, systems that save you time, right up to being properly invested in how your business grows. We agree what's included and the monthly fee before we start.`,
      },
      {
        question: 'How long does it take to build a website?',
        answer: 'Typically 2-4 weeks from our first conversation to going live. A simple starter site can be ready in 2 weeks, while larger bespoke projects may take 4-6 weeks. I share progress along the way so you can give feedback throughout the build.',
      },
      {
        question: 'Will my website work on mobile?',
        answer: 'Yes. Every website I build is fully responsive and tested across phones, tablets, and desktops. With over half of web traffic coming from mobile devices, this is a standard feature, not an add-on.',
      },
      {
        question: 'Do you provide hosting after the website is built?',
        answer: `Yes. I offer hosting and maintenance plans starting from ${gbp(P.hosting.standard)}/month, which include daily backups, security updates, performance monitoring, and support. You can also host elsewhere if you prefer. There's no lock-in.`,
      },
      {
        question: 'Can I update the website myself?',
        answer: "It depends on how the site is built. For content-heavy sites, I can set up a content management system so you can make updates yourself. For simpler sites, I handle updates as part of a maintenance plan. Either way, I provide training so you're comfortable with however we set things up.",
      },
    ],
    cta: {
      heading: 'Ready to Get Online?',
      text: "Let's chat about what you need. I'll give you an honest recommendation and a clear quote.",
      whatsapp: "Hi Sam, I'm interested in a website for my business.",
      secondary: WORK,
    },
    schema: {
      name: 'Web Design in Norwich and Norfolk',
      serviceType: 'Web design',
      description: `Web design for businesses in Norwich, Norfolk and across the UK. Fast, mobile-friendly, SEO-ready websites from ${gbp(P.websites.starter)}.`,
    },
  },

  // ---------------------------------------------------------------- Automation
  {
    service: 'automation',
    title: `Business Process Automation | From ${gbp(P.automation.simple)}`,
    description: `Automate invoicing, emails, data entry, and scheduling for your UK business. Save hours every week with bespoke automation from ${gbp(P.automation.simple)}.`,
    hero: {
      heading: 'Business Process',
      highlight: 'Automation',
      intro: 'Stop spending hours on repetitive tasks. I build automations that handle the routine work, from invoicing and emails to data entry and scheduling, so you can focus on what actually matters.',
      secondary: WORK,
    },
    features: {
      heading: 'What Can Be Automated?',
      intro: "If you're doing the same thing over and over, there's probably a way to automate it.",
      items: [
        { icon: '\u{1F4B8}', title: 'Finance & Invoicing', examples: ['Automatic invoice generation', 'Payment reminders', 'Expense tracking', 'Financial reports'] },
        { icon: '\u{1F4E7}', title: 'Communications', examples: ['Email follow-ups', 'Customer enquiry routing', 'Appointment confirmations', 'Review requests'] },
        { icon: '\u{1F4CA}', title: 'Data & Admin', examples: ['Data entry between systems', 'Report generation', 'Scheduling and booking', 'Stock management'] },
      ],
    },
    process: {
      heading: 'How It Works',
      steps: [
        { title: 'We Talk Through Your Processes', text: 'I learn how your business works day-to-day and identify which tasks are taking up the most time.' },
        { title: 'I Build Your Automation', text: 'Custom automation built around your specific workflow, integrated with the tools you already use.' },
        { title: 'You Get Your Time Back', text: 'Once set up and tested, the automation handles the work. I provide training and support to make sure everything runs smoothly.' },
      ],
    },
    audience: {
      heading: 'Who Is This For?',
      paragraphs: [
        "Business automation is ideal for small business owners, tradespeople, and growing companies who find themselves spending too much time on admin. If you're manually creating invoices, copying data between spreadsheets, sending the same emails repeatedly, or managing bookings by hand, automation can give you that time back.",
        "I've built automations for businesses across Norfolk and the UK, from sole traders to companies with 20+ staff. The common thread is simple: they had repetitive tasks eating into their day, and now technology handles those tasks instead.",
      ],
    },
    pricing: {
      heading: 'Pricing',
      intro: "Every business is different, so I quote based on what you actually need. Here's a rough guide.",
      ranges: [
        {
          name: 'Simple Automations',
          price: P.automation.simple,
          text: '1-3 process automations for small businesses. Email workflows, simple integrations, basic reporting.',
          note: 'Includes setup, testing, and 30 days of support.',
          schemaDescription: '1-3 process automations for small businesses',
        },
        {
          name: 'Complex Projects',
          price: P.automation.complex,
          text: 'Multi-system integrations, custom workflows, advanced automation. Tailored to larger or more complex businesses.',
          note: 'Includes consultation, development, training, and 90 days of support.',
          schemaDescription: 'Multi-system integrations and custom workflows',
        },
      ],
      note: 'Not sure what you need? Happy to have a no-obligation chat about your business and give you an honest idea of costs.',
    },
    related: [
      { service: 'websites', text: 'Pair automation with a modern website' },
      { service: 'apps', text: 'Build bespoke tools for your workflow' },
      { service: 'hosting', text: 'Keep everything running smoothly' },
    ],
    relatedMore: { label: 'View related projects on my work page', href: '/work' },
    faqs: [
      {
        question: 'What is business process automation?',
        answer: 'Business process automation means using technology to handle repetitive tasks that you currently do manually. This includes things like generating invoices, sending follow-up emails, moving data between systems, and scheduling. Instead of spending hours on routine work, the automation handles it for you, accurately and consistently.',
      },
      {
        question: 'How much does automation cost?',
        answer: `Simple automations start from ${gbp(P.automation.simple)}. This covers 1-3 process automations for small businesses, including setup, testing, and 30 days of support. More complex projects involving multiple systems or custom workflows start from ${gbp(P.automation.complex)}. I always provide a fixed quote before starting, so there are no surprises.`,
      },
      {
        question: 'How long does it take to set up?',
        answer: "Simple automations can typically be set up within 1-2 weeks. More complex projects involving multiple systems or custom integrations usually take 3-6 weeks. I'll give you an honest timeline based on your specific needs during our initial conversation.",
      },
      {
        question: 'What tasks can be automated?',
        answer: "Most repetitive tasks can be automated. Common examples include invoice generation, payment reminders, email follow-ups, data entry between systems, report generation, appointment scheduling, customer enquiry routing, and stock management. If you're doing the same thing over and over, there's usually a way to automate it.",
      },
      {
        question: 'Do I need technical knowledge to use the automation?',
        answer: 'No. I build automations that work in the background without you needing to do anything. Where there is a user interface, I design it to be straightforward and provide full training. I also include a support period after setup to make sure everything runs smoothly.',
      },
    ],
    cta: {
      heading: 'Ready to Save Some Time?',
      text: "Let's talk about which tasks are eating into your day and whether automation makes sense for your business.",
      whatsapp: "Hi Sam, I'd like to automate some of the admin in my business.",
      secondary: WORK,
    },
    schema: {
      name: 'Business Process Automation',
      serviceType: 'Business process automation',
      description: `Custom business automation services including invoicing, workflows and data processing. Starting from ${gbp(P.automation.simple)}.`,
    },
  },

  // ---------------------------------------------------------------------- Apps
  {
    service: 'apps',
    title: `App Developer in Norwich & Norfolk | From ${gbp(P.apps.smaller)}`,
    description: `Web and mobile apps built in Norwich by Sam Fowler. Booking systems, customer portals, and iOS and Android apps for UK businesses. Fixed quotes from ${gbp(P.apps.smaller)}.`,
    hero: {
      heading: 'App Development in',
      highlight: 'Norwich & Norfolk',
      intro: "I'm Sam Fowler, an independent app developer based in Norwich. When off-the-shelf software doesn't fit how your business works, I build the app that does. Booking systems, customer portals, internal tools, and iOS and Android apps, from first sketch to the App Store.",
      secondary: WORK,
    },
    features: {
      heading: 'What I Build',
      intro: 'Every project is different. Here are some common types of applications I develop.',
      items: [
        { icon: '\u{1F4C5}', title: 'Booking Systems', description: 'Online booking, availability management, payments, and customer notifications.' },
        { icon: '\u{1F4CA}', title: 'Business Dashboards', description: 'Custom dashboards that pull together your important data in one place.' },
        { icon: '\u{1F465}', title: 'Customer Portals', description: 'Let your customers manage their accounts, track orders, or access services online.' },
        { icon: '\u{1F4F1}', title: 'Mobile Apps', description: 'Cross-platform mobile apps that work on both iOS and Android.' },
        { icon: '\u{1F517}', title: 'System Integrations', description: 'Connect your existing tools together so data flows automatically between them.' },
        { icon: '\u{1F6E0}\u{FE0F}', title: 'Internal Tools', description: 'Staff management, inventory tracking, and reporting tools built around your workflow.' },
      ],
    },
    process: {
      heading: 'How It Works',
      steps: [
        { title: 'We Discuss Your Needs', text: "I learn about your business, what problem you're trying to solve, and what a good solution looks like for you." },
        { title: 'I Design and Build', text: 'I plan the architecture, design the interface, and build your application. You get regular updates and can provide feedback throughout.' },
        { title: 'Testing and Launch', text: 'Thorough testing to make sure everything works properly, then we launch. I provide training and documentation so your team is comfortable.' },
        { title: 'Ongoing Support', text: "After launch, I'm available for updates, fixes, and new features as your business grows." },
      ],
    },
    audience: {
      heading: 'Who Is This For?',
      paragraphs: [
        "Custom app development is for businesses that have outgrown spreadsheets and off-the-shelf tools. If you're managing bookings by phone, tracking inventory on paper, or cobbling together multiple systems that don't talk to each other, a custom app can bring everything together in one place.",
        "I've built apps for businesses across Norfolk and the UK, from booking systems for dog fields and horsebox hire companies to training platforms for equestrian professionals. Whether you need a simple internal tool or a customer-facing platform, I can help.",
      ],
    },
    projects: {
      heading: "Apps I've Built",
      intro: 'Real apps, in use every day, each one built by me.',
      items: [
        {
          id: 'hoofflix',
          tag: 'Web, iOS and Android',
          description: "The professional platform for farriers. Video, courses, CPD records and 8,600+ research papers in one place, with apps on both stores. I rebuilt it and I'm now one of its directors.",
        },
        {
          id: 'horsebox-hire-software',
          name: 'Horsebox Hire',
          tag: 'Booking platform',
          description: 'Started as a booking system for one hire company in Scotland. Now any horsebox hire business can run on it, with AI document checks, DVLA licence checks and held deposits.',
        },
        {
          id: 'fakenham-dog-field',
          tag: 'Fakenham, Norfolk',
          description: 'Customers book and pay online, then get a gate code automatically. The field runs itself, with nobody needed on site to let people in.',
        },
      ],
    },
    pricing: {
      heading: 'Pricing',
      intro: 'Every project is scoped individually, so you get a fixed quote before we start. No surprises.',
      ranges: [
        {
          name: 'Smaller Projects',
          price: P.apps.smaller,
          text: 'Simple tools, MVPs, and straightforward applications. Good for testing an idea or solving a specific problem.',
          note: 'Typical delivery: 3-5 weeks',
          schemaDescription: 'Simple tools, MVPs, and straightforward applications',
        },
        {
          name: 'Larger Projects',
          price: P.apps.larger,
          text: 'Full-featured applications with multiple integrations, user roles, and complex business logic.',
          note: 'Typical delivery: 6-12 weeks',
          schemaDescription: 'Full-featured applications with complex requirements',
        },
      ],
      included: {
        heading: "What's included in every project:",
        items: ['Source code ownership', 'Documentation', 'Training for your team', 'Post-launch support', 'No vendor lock-in', 'Fixed pricing'],
      },
      note: 'Want the detail first? Read <a href="/blog/how-much-does-an-app-cost-uk" class="text-ai-purple font-semibold hover:underline">how much an app costs in the UK</a>, with honest price ranges and what pushes a quote up or down.',
    },
    related: [
      { service: 'websites', text: 'Need a website instead of an app?' },
      { service: 'automation', text: 'Automate workflows alongside your app' },
      { service: 'hosting', text: 'Keep your app running smoothly' },
    ],
    relatedMore: { label: 'See all my projects', href: '/work' },
    faqs: [
      {
        question: 'How much does a custom app cost?',
        answer: `Custom apps start from ${gbp(P.apps.smaller)} for simpler projects like MVPs and straightforward tools. Full-featured applications with multiple integrations, user roles, and complex business logic start from ${gbp(P.apps.larger)}. Every project gets a fixed quote before we start, so you know exactly what you're paying.`,
      },
      {
        question: 'How long does app development take?',
        answer: 'It depends on the complexity. Simpler projects typically take 3-5 weeks, while full-featured applications with complex requirements take 6-12 weeks. I share progress regularly so you can see the app taking shape and provide feedback throughout the build.',
      },
      {
        question: 'Do you build mobile apps?',
        answer: "Yes. I build cross-platform mobile apps for iOS and Android, as well as web applications that work in any browser. The right approach depends on your needs. Sometimes a responsive web app is better than a native app, and I'll advise honestly on what makes sense for your project.",
      },
      {
        question: 'Can you get my app onto the App Store and Google Play?',
        answer: "Yes. I handle the whole submission process for both stores, from setting up your developer accounts to screenshots, privacy details and getting through review. Hoofflix went through exactly that. Some apps are better as web apps that install straight from the browser, which avoids store fees altogether, and I'll tell you honestly which suits you.",
      },
      {
        question: 'Do you only work with businesses in Norwich?',
        answer: "No. I'm based in Norwich and happy to meet clients around Norfolk in person, but I build apps for businesses all over the UK. Horsebox Hire started with a client in Scotland. Most of the work happens over video calls and WhatsApp anyway.",
      },
      {
        question: 'Will I own the code?',
        answer: "Yes, absolutely. You get full source code ownership with every project. There's no vendor lock-in. If you ever want to move to a different developer, you can take everything with you. I also provide documentation so anyone can pick up where I left off.",
      },
      {
        question: 'Do you provide ongoing support after launch?',
        answer: `Yes. Every project includes a post-launch support period. After that, I offer hosting and maintenance plans from ${gbp(P.hosting.standard)}/month that cover updates, bug fixes, and new features as your business grows. Many of my clients have been with me for years.`,
      },
    ],
    cta: {
      heading: 'Got an Idea for an App?',
      text: "Let's talk about what you need. I can give you an honest assessment of what's involved and a clear quote.",
      whatsapp: "Hi Sam, I've got an idea for an app.",
      secondary: WORK,
    },
    schema: {
      name: 'App Development in Norwich & Norfolk',
      serviceType: 'Mobile and web app development',
      description: `Custom web and mobile app development for businesses in Norwich, Norfolk and across the UK, including iOS and Android apps, booking systems and customer portals. Starting from ${gbp(P.apps.smaller)}.`,
    },
  },

  // ------------------------------------------------------------------- Hosting
  {
    service: 'hosting',
    title: `Website Hosting & Maintenance | From ${gbp(P.hosting.standard)}/month`,
    description: `Reliable website hosting with daily backups, security updates, uptime monitoring, and UK-based support. Plans from ${gbp(P.hosting.standard)} per month.`,
    hero: {
      heading: 'Hosting &',
      highlight: 'Maintenance',
      intro: "Reliable hosting with daily backups, security updates, and support when you need it. I keep your website running so you don't have to think about it.",
      secondary: { label: 'View Plans', href: '#pricing' },
    },
    features: {
      heading: "What's Included",
      intro: 'Everything your website needs to stay healthy and secure.',
      items: [
        { icon: '\u{1F4BE}', title: 'Daily Backups', description: 'Automatic daily backups stored securely, so your data is always safe.' },
        { icon: '\u{1F512}', title: 'Security Updates', description: 'Regular security patches and updates to keep your site protected.' },
        { icon: '\u{1F680}', title: 'Performance', description: 'Fast servers and optimisation to keep your site loading quickly.' },
        { icon: '\u{1F4CA}', title: 'Monitoring', description: 'I keep an eye on your site and fix issues before they become problems.' },
        { icon: '\u{1F6E1}\u{FE0F}', title: 'SSL Certificate', description: 'Free SSL certificate included for secure connections.' },
        { icon: '\u{1F4E7}', title: 'Support', description: 'Email support when you need help or have questions about your site.' },
      ],
    },
    process: {
      heading: 'How It Works',
      steps: [
        { title: 'We Set Things Up', text: 'I migrate your existing site or set up hosting for your new build. No downtime during the switch.' },
        { title: 'I Handle the Technical Side', text: "Backups, updates, security patches, and performance monitoring all happen automatically. You don't need to do a thing." },
        { title: 'You Focus on Your Business', text: "If something needs attention, I sort it out. If you have questions, I'm here to help. Simple as that." },
      ],
    },
    audience: {
      heading: 'Who Is This For?',
      paragraphs: [
        'Hosting and maintenance is for any business that wants their website looked after properly without worrying about the technical side. Whether I built your site or someone else did, I can take care of backups, updates, and security so you can focus on running your business.',
        "This is particularly popular with small business owners across Norwich, Norfolk and the UK who don't have an in-house IT team. Rather than paying hourly when something breaks, a monthly plan means your site is proactively maintained and issues are caught early.",
      ],
    },
    pricing: {
      heading: 'Hosting Plans',
      intro: 'Simple monthly pricing. No contracts, cancel anytime.',
      tiers: [
        {
          name: 'Standard',
          audience: 'For small websites',
          price: P.hosting.standard,
          per: 'per month',
          monthly: true,
          features: ['Daily backups', 'SSL certificate', 'Security updates', 'Performance monitoring', 'Email support', 'Monthly reports'],
          cta: 'Get Started',
          schemaDescription: 'Daily backups, security updates, and email support',
        },
        {
          name: 'Premium',
          audience: 'For business websites',
          price: P.hosting.premium,
          per: 'per month',
          monthly: true,
          featured: true,
          features: ['Everything in Standard', 'Priority support', 'Performance optimisation', 'Content updates (2/month)', 'Uptime monitoring', 'Weekly reports'],
          cta: 'Get Started',
          schemaDescription: 'Priority support, performance optimisation, and content updates',
        },
        {
          name: 'Enterprise',
          audience: 'For high-traffic sites',
          price: null,
          per: 'tailored to your needs',
          features: ['Everything in Premium', 'Dedicated resources', 'Advanced security', 'Unlimited content updates', 'Phone support', 'Custom SLA'],
          cta: 'Get in Touch',
          schemaDescription: 'Dedicated resources, advanced security and a custom SLA',
        },
      ],
      note: 'Already hosted elsewhere? I offer free migration to move your site over with no downtime.',
    },
    related: [
      { service: 'websites', text: 'Need a new website to host?' },
      { service: 'automation', text: 'Automate your business processes' },
      { service: 'apps', text: 'Build a custom application' },
    ],
    faqs: [
      {
        question: "What's included in hosting?",
        answer: 'Daily backups, security updates, performance monitoring, and email support. I keep your site running so you can focus on your business.',
      },
      {
        question: 'Can I host elsewhere?',
        answer: 'Yes. I build sites that can be hosted anywhere. Managed hosting through me is an option, not a requirement.',
      },
      {
        question: 'What if my site goes down?',
        answer: 'I monitor uptime and respond quickly to any issues. Most problems are resolved before you even notice them.',
      },
      {
        question: 'Do I need a maintenance plan?',
        answer: 'Not necessarily, but websites need regular updates to stay secure and perform well. Without maintenance, security vulnerabilities can develop over time.',
      },
    ],
    cta: {
      heading: 'Stop Worrying About Your Website',
      text: 'Let me handle the hosting and maintenance while you focus on running your business.',
      whatsapp: "Hi Sam, I'm interested in hosting for my website.",
      secondary: WORK,
    },
    schema: {
      name: 'Website Hosting & Maintenance',
      serviceType: 'Website hosting and maintenance',
      description: `Reliable website hosting with daily backups, security updates, and support for UK businesses. From ${gbp(P.hosting.standard)}/month.`,
    },
  },

  // ------------------------------------------------------------------------ AI
  {
    service: 'ai',
    title: 'AI & ChatGPT Training in Norwich & Norfolk',
    description: `Hands-on AI training for businesses in Norwich and Norfolk. Learn to use ChatGPT, Claude and other AI tools on your own work, not generic tips. From ${gbp(P.ai.oneToOne)}.`,
    hero: {
      heading: 'AI Training in',
      highlight: 'Norwich & Norfolk',
      intro: "Practical, hands-on training that shows you and your team how to actually use AI tools on your own work. No jargon, no hype. I'm Sam Fowler, a Norwich developer who uses these tools every day, and I'll train you at your place anywhere in Norfolk or over video.",
      secondary: { label: 'View All Services', href: '/services' },
    },
    features: {
      heading: "What You'll Learn",
      intro: 'Everything you need to start using AI tools confidently and effectively.',
      items: [
        { icon: '\u{270D}\u{FE0F}', title: 'Writing Better Prompts', description: 'Learn how to ask AI tools the right questions to get useful, accurate answers every time.' },
        { icon: '\u{1F9E0}', title: 'Which Tool for Which Job', description: 'Understand the differences between ChatGPT, Claude, and other tools so you pick the right one for each task.' },
        { icon: '\u{2699}\u{FE0F}', title: 'Real Workflows', description: 'Apply AI to your actual day-to-day tasks. Drafting emails, summarising documents, creating content, and more.' },
        { icon: '\u{26A0}\u{FE0F}', title: 'Where AI Falls Short', description: "Know when AI is helpful and when it's not. Avoid common mistakes and learn to spot bad output." },
        { icon: '\u{1F512}', title: 'Data Safety', description: "Understand what's safe to share with AI tools and what isn't. Keep your business data protected." },
        { icon: '\u{1F504}', title: 'Building AI Into Routine', description: 'Create a practical system for using AI regularly, so it becomes a natural part of how you work.' },
      ],
    },
    audience: {
      heading: 'Who This Is For',
      bullets: [
        "Business owners who keep hearing about AI but aren't sure where to start or what's actually useful.",
        'Teams who are already using ChatGPT but want to get more out of it and avoid common pitfalls.',
        'Managers who want their staff to work smarter without spending thousands on enterprise software.',
        "Anyone who's tried AI tools, got mediocre results, and assumed they weren't that helpful.",
      ],
    },
    why: {
      heading: 'Why Train With Me?',
      paragraphs: [
        "I'm not a trainer who read a book about AI. I'm a developer who builds with these tools every day. I use ChatGPT, Claude, and other AI tools to write code, create content, automate workflows, and solve real business problems for my clients.",
        "That means I can show you what actually works in practice, not just theory. I know which tools are good at what, where they fall over, and how to get the best results without wasting time on trial and error.",
        "I also keep it honest. I won't tell you AI can do things it can't, and I won't oversell it. You'll leave with a clear, practical understanding of how AI fits into your work.",
        'And if the training turns up a job that needs more than a chat window, like an AI step inside your booking system or your invoicing, I can <a href="/services/business-process-automation" class="text-ai-purple font-semibold hover:underline">build that for you</a> too.',
      ],
      story: {
        label: 'Case study: Hoofflix',
        title: 'A self-confessed technophobe, now running AI workflows every day',
        text: "Mark is nearly 70 and had no interest in learning a content system. So I connected his AI assistant to the platform. He talks through an article, or hands it a book chapter and asks for a course, and it lands as a draft for review. Nothing goes live without a person pressing Publish, so he can't break anything, and once he knew that the fear went.",
        href: '/blog/building-hoofflix',
        linkText: 'Read the Hoofflix story',
      },
    },
    pricing: {
      heading: 'Training Formats',
      intro: 'Choose the format that suits your business best.',
      tiers: [
        {
          name: '1-to-1 Training',
          audience: 'Focused, personal session',
          price: P.ai.oneToOne,
          per: 'per session',
          features: ['2-hour hands-on session', 'Tailored to your role', 'Your actual tasks and tools', 'Follow-up notes and resources', '30 days of email support'],
          cta: 'Book a Session',
          schemaDescription: 'Personal AI training session tailored to your role',
        },
        {
          name: 'Team Workshop',
          audience: 'Up to 8 people',
          price: P.ai.workshop,
          per: 'per workshop',
          featured: true,
          features: ['Half-day group session', 'Tailored to your industry', 'Hands-on exercises', 'Team prompt library created', 'Follow-up resources for all', '30 days of email support'],
          cta: 'Book a Workshop',
          schemaDescription: 'Half-day group AI training for up to 8 people',
        },
        {
          name: 'Ongoing Support',
          audience: 'Keep learning as tools evolve',
          price: P.ai.support,
          per: 'per month',
          monthly: true,
          features: ['Monthly check-in call', 'New tool updates and tips', 'Prompt reviews and feedback', 'Priority email support', 'Cancel anytime'],
          cta: 'Get Started',
          schemaDescription: 'Monthly AI support and guidance',
        },
      ],
      note: 'Weighing up the options? Read <a href="/blog/how-much-does-ai-cost-small-business-uk" class="text-ai-purple font-semibold hover:underline">how much AI costs a small business</a>, from free tools to custom builds.',
    },
    related: [
      { service: 'automation', text: 'Automate tasks with AI tools' },
      { service: 'websites', text: 'Get your business online' },
      { service: 'apps', text: 'Build bespoke tools' },
    ],
    faqs: [
      {
        question: 'Do I need any technical knowledge?',
        answer: 'None at all. I tailor the training to your level. If you can use email, you can learn to use AI tools effectively.',
      },
      {
        question: 'Do you run training in person?',
        answer: "Yes. I'm based in Norwich and come to you anywhere in Norfolk, so your team learns at their own desks with their own work. For businesses further away I run the same sessions over video, and they work just as well.",
      },
      {
        question: 'Which AI tools do you cover?',
        answer: "Primarily ChatGPT and Claude, as they're the most useful for business. I'll also cover others where they're relevant to your specific needs.",
      },
      {
        question: 'Can you train my whole team?',
        answer: 'Yes. Team workshops cover up to 8 people. For larger teams, I run multiple sessions so everyone gets hands-on practice.',
      },
      {
        question: 'Will AI replace my staff?',
        answer: 'No, and anyone who tells you it will is selling something. AI tools make people faster and better at their jobs. The goal is to free up your team\'s time for work that actually needs a human.',
      },
      {
        question: 'How is this different from online courses?',
        answer: 'Online courses teach generic prompts. I work with your actual business, your actual tasks, and your actual workflows. You leave with a system that works for you, not a certificate.',
      },
      {
        question: 'What if AI tools change after the training?',
        answer: "They will, that's why I offer an ongoing support plan. But the fundamentals I teach (how to think about prompts, how to evaluate output, where AI fits your workflow) don't change even when the tools do.",
      },
    ],
    cta: {
      heading: 'Ready to Get Your Team Up to Speed?',
      text: "Let's chat about what you need. I'll give you an honest recommendation on the best training format for your business.",
      whatsapp: "Hi Sam, I'm interested in AI training for my business.",
      secondary: { label: 'View All Services', href: '/services' },
    },
    schema: {
      name: 'AI Training in Norwich & Norfolk',
      serviceType: 'AI training',
      description: 'Hands-on AI training for businesses in Norwich, Norfolk and across the UK. Learn to use ChatGPT, Claude and other AI tools on your own work, in person or over video.',
    },
  },
];
