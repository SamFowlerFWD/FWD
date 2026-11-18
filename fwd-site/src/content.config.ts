import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { INDUSTRY_KEYS, SERVICE_KEYS } from './data/taxonomy';

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
    industries: z.array(z.enum(INDUSTRY_KEYS)).default([]),
    services: z.array(z.enum(SERVICE_KEYS)).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
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

export const collections = { blog, industries };
