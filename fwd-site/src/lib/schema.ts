export function generateServiceSchema(service: {
  name: string;
  description: string;
  url: string;
  price: string;
  priceCurrency?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      '@type': 'Organization',
      name: 'FWD Thinking Solutions',
      url: 'https://f-w-d.co.uk',
    },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: service.priceCurrency || 'GBP',
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; href?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.href ? `https://f-w-d.co.uk${item.href}` : undefined,
    })),
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    url: article.url,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      '@id': 'https://f-w-d.co.uk/about#sam-fowler',
      name: 'Sam Fowler',
      url: 'https://f-w-d.co.uk/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FWD Thinking Solutions',
      url: 'https://f-w-d.co.uk',
      logo: {
        '@type': 'ImageObject',
        url: 'https://f-w-d.co.uk/fwd-logo.webp',
      },
    },
  };
}

export const SITE = 'https://f-w-d.co.uk';
export const BUSINESS_ID = `${SITE}/#business`;
export const SAM_ID = `${SITE}/about#sam-fowler`;
export const HORSEBOX_HIRE_ID = `${SITE}/#horsebox-hire-software`;

/** Horsebox Hire Software: Sam's own product. */
export function horseboxHireSoftwareSchema() {
  return {
    '@type': 'SoftwareApplication',
    '@id': HORSEBOX_HIRE_ID,
    name: 'Horsebox Hire Software',
    url: 'https://horseboxhiresoftware.co.uk',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Booking platform for horsebox hire businesses, with licence checks, held deposits, digital hire agreements and AI document checks.',
    creator: { '@id': SAM_ID },
  };
}

export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': SAM_ID,
    name: 'Sam Fowler',
    jobTitle: 'Software Developer and Founder',
    url: `${SITE}/about`,
    sameAs: ['https://uk.linkedin.com/in/sam-fowler-226a5524'],
    worksFor: {
      '@type': 'Organization',
      '@id': BUSINESS_ID,
      name: 'FWD Thinking Solutions',
      alternateName: 'Fowler Web Design',
      url: SITE,
    },
    affiliation: [
      { '@type': 'Organization', name: 'Hoofflix', url: 'https://hoofflix.com' },
    ],
    owns: horseboxHireSoftwareSchema(),
    knowsAbout: [
      'Web development',
      'App development',
      'Business automation',
      'AI tools for small businesses',
      'Software for equestrian businesses',
      'Horsebox hire',
      'Farriery education and CPD',
      'Software for engineering and manufacturing businesses',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Norwich',
      addressRegion: 'Norfolk',
      addressCountry: 'GB',
    },
  };
}
