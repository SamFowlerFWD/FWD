import type { IndustryKey, ServiceKey } from './taxonomy';

export interface Project {
  id: string;
  name: string;
  summary: string;
  image: string;
  alt: string;
  industries: IndustryKey[];
  services: ServiceKey[];
  /** What Sam did, shown as small chips. */
  work: string[];
  /** Slug of the blog case study, if there is one. */
  caseStudy?: string;
  url?: string;
  location?: string;
  /** Sam's own business or one he is a director of, not just a client. */
  relationship?: 'own-product' | 'director';
}

export const projects: Project[] = [
  {
    id: 'horsebox-hire-software',
    name: 'Horsebox Hire Software',
    summary: 'My own booking platform for horsebox hire businesses. Licence checks, held deposits, digital hire agreements and AI document checks, with each hire company on its own branded site.',
    image: '/portfolio/wee-horsebox-hire.webp',
    alt: 'Horsebox hire booking system showing vehicle selection and availability',
    industries: ['equestrian', 'technology-saas'],
    services: ['apps', 'automation', 'ai'],
    work: ['SaaS Platform', 'Payments & Deposits', 'AI Document Checks'],
    caseStudy: 'building-horsebox-hire-software',
    url: 'https://horseboxhiresoftware.co.uk',
    relationship: 'own-product',
  },
  {
    id: 'hoofflix',
    name: 'Hoofflix',
    summary: 'The professional platform for farriers. Video, courses, CPD records and 8,600+ research papers in one place, with apps on both stores. I rebuilt it and I\'m now one of its directors.',
    image: '/portfolio/hoofflix.webp',
    alt: 'Hoofflix professional platform for farriers',
    industries: ['equestrian'],
    services: ['apps', 'ai', 'automation'],
    work: ['Platform Rebuild', 'iOS & Android', 'AI Workflows'],
    caseStudy: 'building-hoofflix',
    url: 'https://hoofflix.com',
    relationship: 'director',
  },
  {
    id: 'the-balanced-horse',
    name: 'The Balanced Horse',
    summary: 'A video learning platform for equestrian training, with structured courses and progress tracking for each rider.',
    image: '/portfolio/balanced-horse.webp',
    alt: 'The Balanced Horse equestrian training video platform',
    industries: ['equestrian'],
    services: ['apps'],
    work: ['Learning Platform', 'Video Courses', 'Progress Tracking'],
    caseStudy: 'building-the-balanced-horse',
  },
  {
    id: 'fakenham-dog-field',
    name: 'Fakenham Dog Field',
    summary: 'Customers book and pay online, then get a gate code automatically. The field runs itself, with nobody needed on site to let people in.',
    image: '/portfolio/fakenham-dog-field.webp',
    alt: 'Fakenham Dog Field booking website home page',
    industries: ['pet-services'],
    services: ['apps', 'automation'],
    work: ['Booking System', 'Stripe Payments', 'Gate Access Codes'],
    caseStudy: 'building-fakenham-dog-field',
    url: 'https://fakenham-dog-field.pages.dev',
    location: 'Fakenham, Norfolk',
  },
  {
    id: 'salon-64',
    name: 'Salon 64',
    summary: 'A fast website for a busy Dereham hair salon, built to show off their work and turn up when people search for a hairdresser in Dereham.',
    image: '/portfolio/salon-64.webp',
    alt: 'Styling stations inside Salon 64 in Dereham',
    industries: [],
    services: ['websites'],
    work: ['Website Build', 'Local SEO', 'Hosting'],
    caseStudy: 'building-salon-64-dereham',
    location: 'Dereham, Norfolk',
  },
  {
    id: 'jth-horseboxes',
    name: 'J Taylor Horseboxes',
    summary: 'A horsebox manufacturer. Modernised website with time-saving features, built end to end with SEO and hosting.',
    image: '/portfolio/jth-horseboxes.webp',
    alt: 'J Taylor Horseboxes manufacturer website',
    industries: ['engineering', 'equestrian'],
    services: ['websites', 'hosting'],
    work: ['Website Build', 'SEO', 'Hosting'],
    url: 'https://www.jthltd.co.uk',
  },
  {
    id: 'harford-attachments',
    name: 'Harford Attachments',
    summary: 'An excavator attachments manufacturer. Website with a product catalogue, plus ongoing hosting, SEO and support.',
    image: '/portfolio/harford-attachments.webp',
    alt: 'Harford Attachments excavator attachments website',
    industries: ['engineering'],
    services: ['websites', 'hosting'],
    work: ['Website Build', 'Product Catalogue', 'SEO'],
    url: 'https://www.harfordattachments.co.uk',
  },
  {
    id: 'farriers-choice',
    name: 'Farriers Choice',
    summary: 'A webshop and product catalogue for farriery supplies, with ongoing hosting, maintenance and SEO.',
    image: '/portfolio/farriers-choice.webp',
    alt: 'Farriers Choice farriery supplies webshop',
    industries: ['equestrian', 'retail-ecommerce'],
    services: ['websites', 'hosting'],
    work: ['Webshop', 'Catalogue', 'SEO'],
    url: 'https://www.farrierschoice.uk',
  },
  {
    id: 'britten-farriery',
    name: 'Britten Farriery',
    summary: 'A premium local farriery business. Website build with hosting, email setup and SEO.',
    image: '/portfolio/britten-farriery.webp',
    alt: 'Britten Farriery farrier business website',
    industries: ['equestrian'],
    services: ['websites', 'hosting'],
    work: ['Website Build', 'Hosting', 'SEO'],
    url: 'https://masterfarrier.co.uk',
  },
  {
    id: 'mill-saddlery',
    name: 'Mill Saddlery',
    summary: 'A mobile saddlery business, with a booking request feature built into the website.',
    image: '/portfolio/mill-saddlery.webp',
    alt: 'Mill Saddlery mobile saddlery website',
    industries: ['equestrian'],
    services: ['websites', 'hosting'],
    work: ['Website Build', 'Booking Requests', 'SEO'],
    url: 'https://www.millsaddlery.co.uk',
  },
  {
    id: 'wee-horsebox-hire',
    name: 'Wee Horsebox Hire',
    summary: 'The first hire company on Horsebox Hire Software, in East Lothian. Four horseboxes, booked and paid for online.',
    image: '/portfolio/wee-horsebox-hire.webp',
    alt: 'Wee Horsebox Hire booking site',
    industries: ['equestrian'],
    services: ['apps', 'websites'],
    work: ['Booking Site', 'Payments', 'SEO'],
    url: 'https://weehorseboxhire.horseboxhiresoftware.co.uk',
    location: 'East Lothian, Scotland',
  },
  {
    id: 'norwich-canoe-club',
    name: 'Norwich Canoe Club',
    summary: 'A volunteer project. Membership management, event bookings and communication tools for an inclusive racing club.',
    image: '/portfolio/norwich-canoe-club.webp',
    alt: 'Norwich Canoe Club website',
    industries: [],
    services: ['websites', 'apps'],
    work: ['Club Systems', 'Event Booking', 'Volunteer'],
    url: 'https://norwichcanoeclub.co.uk',
    location: 'Norwich',
  },
  {
    id: 'millers-fitness',
    name: 'Millers Fitness',
    summary: 'A used gym equipment supplier, on the first page of Google UK for "used gym equipment".',
    image: '/portfolio/millers-fitness.webp',
    alt: 'Millers Fitness used gym equipment website',
    industries: ['retail-ecommerce', 'health-fitness'],
    services: ['websites'],
    work: ['Website Build', 'SEO'],
    url: 'https://www.millersfitness.net',
  },
  {
    id: 'serene-safety',
    name: 'Serene Safety',
    summary: 'A health and safety consultancy. Website build with ongoing maintenance and SEO.',
    image: '/portfolio/serene-safety.webp',
    alt: 'Serene Safety consultancy website',
    industries: ['professional-services'],
    services: ['websites', 'hosting'],
    work: ['Website Build', 'Maintenance', 'SEO'],
    url: 'https://serenesafety.co.uk',
  },
  {
    id: 'jdb-carpentry',
    name: 'JDB Carpentry & Building',
    summary: 'A local builder specialising in heritage and listed properties. Website build, hosting and SEO.',
    image: '/portfolio/jdb-carpentry.webp',
    alt: 'JDB Carpentry and Building website',
    industries: ['trades-construction'],
    services: ['websites', 'hosting'],
    work: ['Website Build', 'Hosting', 'SEO'],
    url: 'https://jdbcarpentryandbuilding.co.uk',
  },
];

export const projectsFor = (industry: IndustryKey) =>
  projects.filter(p => p.industries.includes(industry));

// Work in progress. Nothing on the site reads this list, so these stay hidden.
// To publish one: add its image, set caseStudy once the post is live, and move it into `projects`.
export const draftProjects: Project[] = [
  {
    id: 'tricklenet',
    name: 'TrickleNet',
    summary: 'A new Shopify store and an app for TrickleNet, the slow-feed haynet maker.',
    image: '/portfolio/tricklenet.webp', // TODO: add screenshot
    alt: 'TrickleNet slow-feed haynet Shopify store',
    industries: ['equestrian', 'retail-ecommerce'],
    services: ['websites', 'apps'],
    work: ['Shopify Store', 'App', 'Ecommerce'],
    caseStudy: 'building-tricklenet',
    url: 'https://tricklenet.com',
  },
];
