import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lastUpdated: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    image: z.string().optional(),
    category: z.enum(['guides', 'case-studies', 'automation', 'web-development', 'business']),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    industry: z.enum(['equestrian', 'manufacturing', 'pet-services', 'trades-construction', 'health-fitness', 'professional-services', 'retail-ecommerce', 'technology-saas']),
    services: z.array(z.enum(['websites', 'automation', 'apps', 'hosting'])),
    description: z.string(),
    thumbnail: z.string(),
    results: z.array(z.string()).optional(),
    testimonial: z.object({
      quote: z.string(),
      name: z.string(),
      role: z.string(),
    }).optional(),
    techStack: z.array(z.string()),
    timeline: z.string(),
    pubDate: z.coerce.date(),
    featured: z.boolean().default(false),
  }),
});

const industries = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/industries' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    painPoints: z.array(z.string()),
    capabilities: z.array(z.string()),
    relatedServices: z.array(z.string()),
    relatedWork: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, work, industries };
