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

## Client Area

Private area at `/portal` where clients sign their agreement, fill in a brief and upload content, and Sam tracks every project.

- Screens: `src/components/portal/` (one React app on `src/pages/portal.astro`). API: `server/portal/`, served by `functions/api/portal/[[path]].ts`.
- Stages, brief questions and the starting checklist live in `src/data/portal.ts`.
- Sign-in is by emailed one-time link (Resend). No passwords are stored. The admin is `PORTAL_ADMIN_EMAIL` (defaults to thinking@f-w-d.co.uk).
- Needs two Cloudflare bindings on the Pages project: `DB` (D1) and `FILES` (R2). Tables are created on first use.
- Payments go through Revolut (`server/portal/payments.ts`, `server/portal/revolut.ts`). Each project has payment lines: single payments (deposit, balance) and monthly payments that roll on or stop after a set number of months. Needs the `REVOLUT_API_KEY` secret on the Pages project; without it clients cannot pay online. Card details are only ever entered on Revolut's checkout page.
- A monthly payment can instead be paid by standing order. Nothing is collected automatically for those: Sam ticks each month off on the project page. Bank details shown to clients are entered on the projects page and stored in the `settings` table, never in code.
- Bank payments can be ticked off automatically (`server/portal/bank.ts`). It reads the Revolut account's transactions with a second, read-only key (`REVOLUT_BANK_API_KEY` plus `REVOLUT_BANK_SIGNING_KEY`) and only acts on payments whose reference contains one of our codes (FWD-SO-0001, FWD-INV-0001) and whose amount is exact. Anything else is flagged for Sam. It runs when the client area is opened, at most every 10 minutes.
- Database changes after go-live are added to `MIGRATIONS` in `server/portal/db.ts` and run once on the next request.
- Run it locally with `npm run portal:dev` (port 8788). Sign-in links show on screen instead of being emailed. Never set `PORTAL_DEV` on the live site.

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
