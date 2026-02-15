// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  output: 'static',
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
      lastmod: new Date(),
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        if (url.endsWith('f-w-d.co.uk') || url.endsWith('f-w-d.co.uk/')) {
          item.priority = 1.0;
        } else if (url.endsWith('/services')) {
          item.priority = 0.9;
        } else if (url.includes('/services/')) {
          item.priority = 0.8;
        } else if (url.endsWith('/blog')) {
          item.priority = 0.8;
        } else if (url.includes('/blog/')) {
          item.priority = 0.6;
        } else if (url.endsWith('/portfolio') || url.endsWith('/about')) {
          item.priority = 0.7;
        } else if (url.endsWith('/privacy-policy')) {
          item.priority = 0.3;
        } else {
          item.priority = 0.5;
        }
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