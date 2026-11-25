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
- Bank payments can be ticked off automatically (`server/portal/bank.ts`). It reads the Revolut account's transactions with a second, read-only key (`REVOLUT_BANK_API_KEY` plus `REVOLUT_BANK_SIGNING_KEY`) and only acts on payments whose reference contains one of our codes (FWD-SO-48213, FWD-INV-37930) and whose amount is exact. Anything else is flagged for Sam. It runs when the client area is opened, at most every 10 minutes.
- Each paid month of a monthly payment gets its own invoice, emailed to the client as a PDF (`monthlyInvoice` in `server/portal/payments.ts`). Invoice numbers and standing order references are scrambled on purpose so they do not reveal how many there have been.
- A daily check (`server/portal/daily.ts`) does the Revolut checks without anyone opening the client area and emails Sam when a standing order payment is late. It is called each morning by a separate small Worker, `fwd-portal-cron` (`fwd-site/cron-worker/`, deploy with `npm run cron:deploy`). Both hold the same `CRON_SECRET`; `scripts/set-cron-secret.sh` makes a new one. Clients are never chased automatically.
- The agreement runs in a fixed order: Sam signs for FWD (name, position, tick) and that sends it; the client signs; only then can a payment be asked for. Replacing the SOW after sending takes it back so Sam signs the new file.
- Both sides draw their signature in a box (`src/components/portal/SignaturePad.tsx`); the drawings are kept with the contract and printed on the signature page. FWD's name, address, company number and colours for emails, invoices and the signed copy live in `server/portal/company.ts`. Every email is written as plain text and `brandedHtml` in `server/portal/email.ts` dresses it.
- Notifications: everything Sam is emailed about (`tellSam` / `notify` in `server/portal/payments.ts`) also shows at the top of the projects page until he presses Done. A bank payment with no reference of ours but exactly the amount of something waiting is flagged there as "Is this payment for...?" and never ticked automatically.
- Phone app: the client area can be added to a phone's home screen (`public/portal.webmanifest`, `public/portal-sw.js`, icons `public/portal-icon-*.png`). Everything that goes through `notify` is also pushed to each device Sam has turned notifications on for, from the Notifications box on the projects page (`server/portal/push.ts`, `src/components/portal/PushSwitch.tsx`). The push keys are made on first use and kept in the `settings` table; there is nothing to set in Cloudflare. On iPhone, notifications only work once the app is on the home screen.
- The sign-in email carries a 6 digit code as well as the link, because the home screen app cannot open an emailed link (`verifyCode` in `server/portal/router.ts`). Five wrong guesses kill the code.
- Clients uploading a file, ticking a checklist item or leaving a note also notify Sam (`clientNews` in `server/portal/router.ts`), at most once per half hour for the same thing. No email is sent for these.
- Following up (`server/portal/followup.ts`): the `views` table records the first and latest time a client opened their project page, the Statement of Work and the Terms, shown to Sam on the project page and as "read, not signed" on the projects page. Sam is notified the first time a client opens a sent Statement of Work. "Send a reminder" buttons (`src/components/portal/Remind.tsx`) email the client about an unsigned agreement, a missing brief, content still to send or a payment still to make. Reminders only ever go when Sam presses the button.
- Website enquiries: the contact form (`functions/api/contact.ts`) still emails Sam, and also saves each enquiry (`server/portal/enquiries.ts`) so it shows on the projects page and is pushed to his phone.
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
