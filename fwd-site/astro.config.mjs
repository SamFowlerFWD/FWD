// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// Real last-modified dates for the sitemap: blog posts use their frontmatter
// dates, other pages use the last git commit that touched their source file.
function sourceFor(pathname) {
  const clean = pathname.replace(/^\/|\/$/g, '');
  if (!clean) return 'src/pages/index.astro';
  const [first, ...rest] = clean.split('/');
  if (first === 'blog' && rest.length) return `src/content/blog/${rest.join('/')}.mdx`;
  if (first === 'industries' && rest.length) return `src/content/industries/${rest.join('/')}.mdx`;
  if ((first === 'equestrian' || first === 'engineering') && rest.length) return 'src/data/hubPages.ts';
  for (const candidate of [`src/pages/${clean}.astro`, `src/pages/${clean}/index.astro`]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}
function lastModified(pathname) {
  const file = sourceFor(pathname);
  if (!file || !existsSync(file)) return undefined;
  if (file.startsWith('src/content/blog/')) {
    const fm = readFileSync(file, 'utf8').split('\n---')[0];
    const date = fm.match(/^lastUpdated:\s*(\S+)/m)?.[1] ?? fm.match(/^pubDate:\s*(\S+)/m)?.[1];
    if (date) return new Date(date).toISOString();
  }
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf8' }).trim();
    return out || new Date().toISOString();
  } catch {
    return undefined;
  }
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  redirects: {
    '/portfolio': '/work',
    '/services/reliable-hosting-maintenance': '/services/hosting-maintenance',
    '/industries/equestrian': '/equestrian',
    '/industries/manufacturing': '/engineering',
    '/blog/building-ask-stephen': '/services/custom-app-development',
  },
  server: {
    headers: {
      // Security headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }
  },
  site: 'https://f-w-d.co.uk',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    format: 'file'
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[hash][extname]',
          chunkFileNames: 'assets/[hash].js',
          entryFileNames: 'assets/[hash].js'
        }
      }
    }
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      serialize(item) {
        const lastmod = lastModified(new URL(item.url).pathname);
        if (lastmod) item.lastmod = lastmod;
        if (item.url === 'https://f-w-d.co.uk/') item.priority = 1.0;
        else if (/\/(equestrian|engineering)$/.test(item.url)) item.priority = 0.9;
        else if (/\/(equestrian|engineering)\/[^/]+$/.test(item.url)) item.priority = 0.8;
        else if (item.url === 'https://f-w-d.co.uk/pricing') item.priority = 0.9;
        else if (item.url.includes('/services') && !item.url.includes('/services/')) item.priority = 0.9;
        else if (item.url.includes('/services/')) item.priority = 0.8;
        else if (item.url.includes('/industries/')) item.priority = 0.7;
        else if (item.url.includes('/work/')) item.priority = 0.6;
        else if (item.url.includes('/blog/')) item.priority = 0.5;
        else if (item.url.includes('/privacy-policy')) item.priority = 0.3;
        return item;
      }
    })
  ],
  prefetch: {
    defaultStrategy: 'hover',
    prefetchAll: true
  },
  image: {
    remotePatterns: [{ protocol: "https" }],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      }
    }
  }
});