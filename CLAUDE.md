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

## Key Services

1. **Business Process Automation** - Starting from £799
2. **AI-Powered Websites** - Starting from £799
3. **Custom App Development** - Starting from £1,299
4. **AI Hosting & Maintenance** - From £99/month

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
