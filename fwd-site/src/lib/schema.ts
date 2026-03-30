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

export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Sam Fowler',
    jobTitle: 'Web Developer',
    url: 'https://f-w-d.co.uk/about',
    worksFor: {
      '@type': 'Organization',
      name: 'FWD Thinking Solutions',
      url: 'https://f-w-d.co.uk',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Norwich',
      addressRegion: 'Norfolk',
      addressCountry: 'GB',
    },
  };
}
