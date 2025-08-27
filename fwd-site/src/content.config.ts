import { defineCollection, z } from 'astro:content';

const caseStudies = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    client: z.string(),
    industry: z.string(),
    location: z.string(),
    savings: z.string(),
    timeframe: z.string(),
    technologies: z.array(z.string()),
    results: z.array(z.string()),
    testimonial: z.string().optional(),
    image: z.string().optional(),
  }),
});

const testimonials = defineCollection({
  type: 'content',
  schema: z.object({
    author: z.string(),
    role: z.string(),
    company: z.string(),
    location: z.string(),
    rating: z.number().min(1).max(5),
    quote: z.string(),
    savings: z.string().optional(),
    date: z.date(),
  }),
});

export const collections = { 
  'case-studies': caseStudies,
  'testimonials': testimonials,
};