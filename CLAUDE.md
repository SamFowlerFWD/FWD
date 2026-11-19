# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FWD Thinking Solutions** is an AI-powered software development agency website. The project focuses on helping UK SMBs save money on custom software through intelligent automation.

## Project Structure

```
FWD/
├── fwd-site/          # Main Astro website
│   ├── src/
│   │   ├── components/    # React and Astro components
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Astro pages and API routes
│   │   ├── lib/           # Utilities and helpers
│   │   └── styles/        # Global CSS
│   ├── public/            # Static assets
│   └── dist/              # Build output
└── CLAUDE.md
```

## Tech Stack

- **Framework**: Astro with React components
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API for playground demos
- **Deployment**: Hostinger VPS with Nginx

## Development Commands

```bash
cd fwd-site

# Development
npm run dev          # Start dev server on localhost:4321

# Build
npm run build        # Build for production

# Preview
npm run preview      # Preview production build

# Testing
./test-playground.sh # Test AI playground APIs
```

## Services and Prices

Every service name, link and price lives in `fwd-site/src/data/services.ts` (`PRICES` and `SERVICES`). The menu, footer, homepage, services, pricing and service pages, hub pages, llms.txt and structured data all read from it, so change prices there and nowhere else. Never type a price into a page; use `gbp(PRICES...)`.

- The five service pages share one template: content in `src/data/servicePages.ts`, layout in `src/components/services/ServicePage.astro`, route `src/pages/services/[slug].astro`.
- Blog posts are dated articles and keep their own typed prices.

## Branding

- **Full Name**: FWD Thinking Solutions
- **Short Name**: FWD
- **Tagline**: AI-powered software development agency
- **Location**: Norwich, Norfolk, UK

## Environment Variables

```
OPENAI_API_KEY=your_key_here    # For AI playground features
```

## Deployment

The site can be deployed to:
- Hostinger VPS (see HOSTINGER-SETUP.md)
- Any static hosting with Node.js support for API routes
