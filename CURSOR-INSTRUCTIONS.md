# FWD Thinking Solutions — Cursor Build Instructions

Drop this file into the project root. It contains everything needed to rebuild f-w-d.co.uk from the existing Astro 5 + React + Tailwind CSS 4 codebase. Work through the phases in order. Each phase builds on the last.

Reference documents in this repo for deeper detail:
- `RESEARCH-STEP1-MARKET-KEYWORDS.md` — competitor analysis, keyword clusters
- `RESEARCH-STEP2-SEO-AUDIT.md` — technical audit, schema examples, linking strategy
- `RESEARCH-STEP3-CONTENT-STRATEGY.md` — voice profile, page copy, FAQ pairs, blog plan
- `RESEARCH-STEP4-ENHANCEMENTS.md` — enhancement briefs, implementation details
- `RESEARCH-STEP5-DESIGN-SYSTEM.md` — design tokens, component specs, conversion architecture, accessibility
- `RESEARCH-STEP6-PERFORMANCE-TESTING-GROWTH.md` — performance budgets, hydration strategy, test plans
- `BUILD-BRIEF.md` — master build document

---

## Stack & Constraints

- **Framework:** Astro 5 (static output, `output: 'static'`)
- **UI:** React 19 islands for interactive components, Astro components for everything static
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite` plugin + CSS custom properties for design tokens
- **Images:** Astro `<Image>` component with Sharp (already configured)
- **Content:** Astro Content Collections (MDX) for blog and case studies
- **Fonts:** System font stack only — zero external font loading
- **Primary CTA:** WhatsApp (`https://wa.me/447584417830?text={encodedMessage}`)
- **Deployment:** Static build to Hostinger VPS with Nginx
- **Performance targets:** Lighthouse 95+ performance, 98+ accessibility, 100 SEO, LCP < 2s, CLS < 0.05
- **Accessibility:** WCAG 2.1 AA throughout

---

## Voice & Tone

Confident, direct, warm. Like a knowledgeable friend — no fluff, no jargon, no overselling. Professional but not corporate.

**Use:** build, create, sort out, set up, help, save, practical, honest, straightforward, work smarter
**Never use:** leverage, harness, synergy, navigate, empower, cutting-edge, world-class, seamless, "in today's digital landscape"

### Key Messaging Angle: AI vs Code (Real Solutions, Not Chat Prompts)

A recurring theme throughout the site — especially on automation and app pages — is the distinction between using AI tools like ChatGPT as a band-aid versus building proper code-based solutions that actually scale. This is a real differentiator for FWD.

**The principle:** ChatGPT and AI chat tools are great for one-off tasks, but they're not automation. Real automation means writing a Python script, an n8n workflow, or a custom integration that runs reliably every time without someone sitting there prompting it. FWD builds the latter.

**Real example to reference:** Sam built an eBay-to-Shopify integration where product text needed splitting and reformatting. A business owner might paste each listing into ChatGPT one at a time — that's not automation, that's just a faster version of doing it manually. The proper solution was a Python script that processes the entire catalogue in seconds, every time, with consistent results. No prompting, no copy-pasting, no human in the loop.

**Where to weave this in:**
- `/services/business-process-automation` — add a section or callout: "AI tools vs real automation" explaining that FWD builds solutions that run themselves
- `/services/ai-training` — the companion service: "I'll build the automation where you need it, and teach you to use AI tools properly where they're the right fit"
- `/pricing` — in the comparison table or FAQ, address "can't I just use ChatGPT?" honestly (yes for some things, no for anything that needs to run reliably at scale). Include AI training pricing.
- `/about` — reinforces Sam's credibility as someone who knows when AI is the right tool and when proper code is better
- Blog articles — dedicated content (see Phase 5)
- Service Quiz — if someone says "drowning in admin", the result should address this: "You might be using ChatGPT as a sticking plaster. Let me show you what actual automation looks like." If they say "not sure", the result can mention AI training as an option.

**The two-sided pitch:** FWD offers both sides of the AI coin. Need something that runs itself? I'll build proper automation. Want to use AI tools better yourself? I'll train you. Either way, you get honest advice about which approach fits.

---

## URL Architecture

```
/                                    Homepage
/about                               About Sam & FWD
/services                            Services hub
/services/professional-websites      Websites service page
/services/business-process-automation  Automation service page
/services/custom-app-development     Apps service page
/services/hosting-maintenance        Hosting service page
/services/ai-training                AI training service page (NEW)
/industries                          Industries hub
/industries/equestrian               Equestrian landing page
/industries/manufacturing            Manufacturing landing page
/industries/pet-services             Pet services landing page
/industries/trades-construction      Trades landing page
/industries/health-fitness           Health & fitness landing page
/industries/professional-services    Professional services landing page
/industries/retail-ecommerce         Retail landing page
/industries/technology-saas          Tech/SaaS landing page
/work                                Case studies hub
/work/[slug]                         Individual case studies
/blog                                Blog index
/blog/[slug]                         Blog posts
/pricing                             Pricing guide (NEW)
/contact                             Contact page
/privacy-policy                      Privacy policy
```

**Redirects (add to astro.config.mjs):**
```
/portfolio -> /work (301)
/services/reliable-hosting-maintenance -> /services/hosting-maintenance (301)
```

---

## File Structure

Create this structure inside `src/`:

```
components/
  layout/
    Container.astro          # Max-width 1280px wrapper, responsive padding
    Section.astro            # Full-width section with variants: default, muted, dark, gradient
  navigation/
    Header.astro             # Sticky nav with backdrop blur, skip link, dark mode toggle
    MobileMenu.tsx           # Full-screen overlay, focus trap, Escape to close
    Footer.astro             # Links, industries, contact, trust signals
    Breadcrumbs.astro        # Visual breadcrumbs + BreadcrumbList JSON-LD
    SkipLink.astro           # "Skip to main content" link
  content/
    Card.astro               # Variants: service, project, blog, industry
    Testimonial.astro        # blockquote, cite, stars, "Verified Google Review" badge
    AnimatedCounter.tsx      # IntersectionObserver, requestAnimationFrame, ease-out
    FreshnessBadge.astro     # "Last updated: March 2026"
    StatsBar.astro           # 4x AnimatedCounter in a row
    ProcessSteps.astro       # Numbered steps (3-step "How It Works")
  interactive/
    Button.astro             # Variants: primary (amber), secondary, ghost, dark. Sizes: sm, md, lg
    SmartCTA.astro           # Contextual CTA block with WhatsApp + secondary action
    Accordion.tsx            # FAQ with aria-expanded, aria-controls, FAQPage JSON-LD
    ContactForm.tsx          # 3 fields (name, email, message), inline validation
    DarkModeToggle.tsx       # Sun/moon icon, cookie preference, system preference fallback
    WhatsAppWidget.tsx       # Floating bottom-right, page-context pre-fill, dismissible
  conversion/
    PricingCalculator.tsx    # Multi-step estimator with 4 service paths
    ServiceQuiz.tsx          # "Not sure what you need?" 3-4 question wizard
    ReviewsSection.tsx       # Client reviews grid/scroll with aggregate rating
    ProjectGallery.tsx       # Filterable grid with service type + industry tag filters
  blog/
    ReadingProgress.tsx      # 3px amber bar at viewport top, role="progressbar"
    TableOfContents.tsx      # Auto-generated from H2s, sticky sidebar desktop, collapsible mobile
    PostCard.astro           # Blog card with image, title, excerpt, date, category
    AuthorBox.astro          # Sam's bio with link to /about
    RelatedPosts.astro       # 3 related articles
layouts/
  Layout.astro               # Updated (see Phase 1 fixes)
  BlogLayout.astro           # Blog post wrapper with ReadingProgress + ToC
pages/
  pricing.astro              # NEW
  services/
    ai-training.astro        # NEW — AI training service page
  industries/
    index.astro              # NEW
    [slug].astro             # NEW (or individual files)
  work/
    index.astro              # NEW (replaces /portfolio)
    [...slug].astro          # NEW
content/
  work/                      # NEW collection — case study MDX files
  industries/                # NEW collection — industry data
  config.ts                  # Update with work + industries collections
styles/
  tokens.css                 # Design tokens (CSS custom properties)
  global.css                 # Base styles, accessibility defaults
  animations.css             # Micro-interactions, reduced-motion overrides
lib/
  schema.ts                  # JSON-LD generation helpers
  utils.ts                   # Formatting, date helpers
```

---

## PHASE 1: Foundation (do first — affects every page)

### 1.1 Design Tokens

Create `src/styles/tokens.css`:

```css
:root {
  /* Brand */
  --colour-primary: #7c3aed;
  --colour-primary-light: #a78bfa;
  --colour-primary-dark: #5b21b6;
  --colour-accent: #f59e0b;
  --colour-accent-light: #fbbf24;
  --colour-accent-dark: #d97706;

  /* Neutrals */
  --colour-neutral-50: #f8fafc;
  --colour-neutral-100: #f1f5f9;
  --colour-neutral-200: #e2e8f0;
  --colour-neutral-300: #cbd5e1;
  --colour-neutral-400: #94a3b8;
  --colour-neutral-500: #64748b;
  --colour-neutral-600: #475569;
  --colour-neutral-700: #334155;
  --colour-neutral-800: #1e293b;
  --colour-neutral-900: #0f172a;

  /* Semantic */
  --colour-success: #16a34a;
  --colour-warning: #d97706;
  --colour-error: #dc2626;
  --colour-info: #2563eb;

  /* Surfaces */
  --colour-background: #ffffff;
  --colour-surface: #f8fafc;
  --colour-surface-dark: #0f172a;
  --colour-text-primary: #0f172a;
  --colour-text-secondary: #475569;
  --colour-text-muted: #64748b;
  --colour-text-inverse: #ffffff;
  --colour-border: #e2e8f0;

  /* Typography — system font stack */
  --font-heading: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;

  /* Spacing */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem; --space-6: 1.5rem; --space-8: 2rem;
  --space-12: 3rem; --space-16: 4rem; --space-20: 5rem; --space-24: 6rem;

  /* Radius */
  --radius-sm: 0.375rem; --radius-md: 0.5rem; --radius-lg: 0.75rem;
  --radius-xl: 1rem; --radius-2xl: 1.5rem; --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Dark Mode */
[data-theme="dark"] {
  --colour-background: #0f172a;
  --colour-surface: #1e293b;
  --colour-surface-dark: #020617;
  --colour-text-primary: #f1f5f9;
  --colour-text-secondary: #cbd5e1;
  --colour-text-muted: #94a3b8;
  --colour-text-inverse: #0f172a;
  --colour-border: #334155;
  --colour-accent: #fbbf24;
}
```

Create `src/styles/animations.css`:

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Scroll-triggered reveals */
[data-animate] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--duration-normal) var(--ease-default),
              transform var(--duration-normal) var(--ease-default);
}
[data-animate].is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered grid reveals */
[data-stagger] > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--duration-normal) var(--ease-default),
              transform var(--duration-normal) var(--ease-default);
}
[data-stagger].is-visible > *:nth-child(1) { transition-delay: 0ms; }
[data-stagger].is-visible > *:nth-child(2) { transition-delay: 100ms; }
[data-stagger].is-visible > *:nth-child(3) { transition-delay: 200ms; }
[data-stagger].is-visible > *:nth-child(4) { transition-delay: 300ms; }
[data-stagger].is-visible > * { opacity: 1; transform: translateY(0); }

/* Button press */
button:active, a[role="button"]:active {
  transform: scale(0.98);
  transition: transform 100ms var(--ease-default);
}

/* Card hover */
.card-hover {
  transition: transform var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Dark mode colour transition */
body {
  transition: background-color 200ms, color 200ms;
}
```

### 1.2 Fix Layout.astro

Apply these changes to `src/layouts/Layout.astro`:

**Title tag fix:**
```astro
---
const isHomepage = Astro.url.pathname === '/' || Astro.url.pathname === '';
const pageTitle = isHomepage ? title : `${title} | FWD`;
---
<title>{pageTitle}</title>
```

**Remove keywords meta tag entirely.** Delete the `keywords` prop and any `<meta name="keywords">` tag.

**Add to Organization schema:**
```json
"telephone": "+447584417830",
"contactPoint": {
  "@type": "ContactPoint",
  "telephone": "+447584417830",
  "contactType": "customer service",
  "availableLanguage": "English"
},
"sameAs": [
  "https://g.page/fwd-thinking-solutions"
]
```

**Add resource hints to `<head>`:**
```html
<link rel="preconnect" href="https://wa.me">
```

**Import token and animation stylesheets:**
```astro
import '../styles/tokens.css';
import '../styles/animations.css';
```

**Add dark mode script (inline, before paint):**
```html
<script is:inline>
  (function() {
    const stored = document.cookie.match(/theme=(\w+)/);
    const pref = stored ? stored[1] : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', pref);
  })();
</script>
```

### 1.3 Create robots.txt

Create `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://f-w-d.co.uk/sitemap-index.xml
```

### 1.4 Update Breadcrumbs.astro

Add BreadcrumbList JSON-LD that mirrors the visual breadcrumbs:
```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": crumb.label,
    "item": crumb.href ? `https://f-w-d.co.uk${crumb.href}` : undefined
  }))
})} />
```

### 1.5 Update astro.config.mjs

Add redirects and update sitemap:
```js
export default defineConfig({
  redirects: {
    '/portfolio': '/work',
    '/services/reliable-hosting-maintenance': '/services/hosting-maintenance',
  },
  integrations: [
    sitemap({
      serialize(item) {
        if (item.url === 'https://f-w-d.co.uk/') item.priority = 1.0;
        else if (item.url.includes('/services/') && !item.url.endsWith('/services/')) item.priority = 0.8;
        else if (item.url.includes('/services')) item.priority = 0.9;
        else if (item.url === 'https://f-w-d.co.uk/pricing') item.priority = 0.9;
        else if (item.url.includes('/industries/')) item.priority = 0.7;
        else if (item.url.includes('/work/')) item.priority = 0.6;
        else if (item.url.includes('/blog/')) item.priority = 0.5;
        return item;
      }
    }),
    // ... existing integrations
  ],
});
```

### 1.6 Content Collections

Update `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    lastUpdated: z.date().optional(),
    category: z.enum(['guides', 'case-studies', 'automation', 'web-development', 'business']),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const work = defineCollection({
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
    pubDate: z.date(),
    featured: z.boolean().default(false),
  }),
});

const industries = defineCollection({
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
```

### 1.7 Build Foundation Components

Build these components first as they're used everywhere:

**SkipLink.astro** — `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to main content</a>`

**Container.astro** — `<div class="max-w-7xl mx-auto px-6 md:px-8"><slot /></div>`

**Section.astro** — Props: `variant` (default/muted/dark/gradient), `id`. Use `<section aria-labelledby>` with the section heading.

**Button.astro** — Props: `variant` (primary/secondary/ghost/dark), `size` (sm/md/lg), `href?`, `icon?`. Use `<a>` when `href` present, `<button>` otherwise. Minimum 44x44px touch target.

**SmartCTA.astro** — Props: `heading`, `text`, `primaryLabel`, `primaryWhatsappMessage`, `secondaryLabel?`, `secondaryHref?`. WhatsApp link: `https://wa.me/447584417830?text=${encodeURIComponent(primaryWhatsappMessage)}`. Include micro-copy: "No obligation. I typically reply within 2 hours."

**DarkModeToggle.tsx** — `client:load`. Read cookie > system preference. Toggle `data-theme` on `<html>`. Store in cookie. `aria-label` updates between "Switch to dark mode" / "Switch to light mode". `aria-pressed` state.

**WhatsAppWidget.tsx** — `client:idle`. Floating bottom-right on all pages except /contact. Props: `message` (pre-fill text). Pulse animation on first visit (one cycle). Expandable on hover/tap. Dismissible for session (cookie). `aria-label="Message us on WhatsApp"`.

**Accordion.tsx** — `client:visible`. Props: `items: Array<{question: string, answer: string}>`. Each trigger is a `<button>` inside a heading. `aria-expanded`, `aria-controls`, content panel has `role="region"`. Generates FAQPage JSON-LD from items.

---

## PHASE 2: Core Pages

### 2.1 Homepage (`src/pages/index.astro`)

Full rebuild. Composition:

1. **Hero** (Section variant: gradient)
   - Badge: "Based in Norfolk, working across the UK"
   - H1: "One Developer. No Middlemen."
   - Lead: "Websites, apps, and automation for UK businesses. You deal directly with the person who builds it."
   - Primary CTA: "Message on WhatsApp" (pre-fill: "Hi Sam, I found your website and I'm interested in discussing a project.")
   - Secondary CTA: "See Our Work" → /work

2. **Social Proof Bar** (Section variant: default)
   - 4x AnimatedCounter: "Dozens of" projects, "5.0" rating, "Diverse" sectors, "UK-wide"

3. **Services** (Section variant: default)
   - H2: "What I Build"
   - Lead: "From simple websites to custom applications. Fixed quotes, no jargon, and I'll tell you if you don't need it."
   - 5x Card (variant: service):
     - Business Process Automation (from £799) — see RESEARCH-STEP3
     - Professional Websites (from £299) — see RESEARCH-STEP3
     - Custom App Development (from £1,299) — see RESEARCH-STEP3
     - Hosting & Maintenance (from £99/month) — see RESEARCH-STEP3
     - AI Training & Workshops (from £299) — "Learn to use ChatGPT, Claude, and AI tools properly for your business. Hands-on training tailored to your actual workflows — not generic tips from YouTube."

4. **How It Works** (Section variant: muted)
   - H2: "How It Works"
   - 3 steps: "We Talk" / "I Build" / "You Grow" — see RESEARCH-STEP3 Section 4 for exact copy

5. **Service Quiz** (Section variant: default)
   - H2: "Not Sure What You Need?"
   - `<ServiceQuiz client:visible />`

6. **Testimonials** (Section variant: dark)
   - H2: "What Clients Say"
   - `<ReviewsSection client:visible />`

7. **Blog Preview** (Section variant: default)
   - H2: "From the Blog"
   - 3x Card (variant: blog) — latest posts
   - Link: "View all posts" → /blog

8. **CTA** (Section variant: gradient)
   - SmartCTA: heading "Got an Idea? Let's Talk."

**SEO:**
- Title: "FWD Thinking Solutions | Web Developer for UK Businesses"
- Meta: "Web development, business automation, and custom apps for UK small businesses. One developer, no middlemen, transparent pricing. Based in Norwich, working UK-wide."
- Schema: WebSite + Organization/LocalBusiness (enhanced, from Layout)

### 2.2 About Page (`src/pages/about.astro`)

Rewrite with copy from RESEARCH-STEP3 Section 4.

**SEO:**
- Title: "About Sam Fowler | FWD Thinking Solutions"
- Meta: "Meet Sam Fowler, the developer behind FWD. Dozens of projects across diverse sectors. Based in Norwich, working with businesses across the UK."
- Schema: Person + Organization

### 2.3 Service Pages

Each service page follows this template:
1. Hero (dark) with Breadcrumbs, H1, price anchor, CTA
2. "What you get" / capabilities grid
3. "How It Works" process steps
4. Pricing tiers
5. Related case studies (2-3 Card variant: project)
6. FAQ section with Accordion + FAQPage schema
7. Related services (3 cards linking to other service pages)
8. SmartCTA (contextual) + FreshnessBadge

**Automation page extra section — "AI Tools vs Real Automation":**
Add a callout or dedicated section between capabilities and pricing on `/services/business-process-automation`:

```
H3: "Can't I Just Use ChatGPT?"

You can — for one-off tasks. But if you're copying and pasting the same data into
a chat window every day, that's not automation. That's just a faster version of
doing it manually.

Real automation means a script or workflow that runs on its own. No prompting,
no copy-pasting, no human in the loop. I built a Python script for an eBay-to-Shopify
migration that processes an entire product catalogue in seconds — splitting, reformatting,
and uploading listings automatically. Try doing that one ChatGPT prompt at a time.

I'll always tell you when an AI tool is enough and when you need proper code.
That's the honest advice part.
```

Add a corresponding FAQ pair:
- Q: "Do I need custom automation or can I just use ChatGPT?" / A: "For one-off tasks like rewriting an email or summarising a document, ChatGPT is great. But for anything that needs to run reliably every time — processing orders, syncing data between platforms, generating reports on a schedule — you need proper automation. I build solutions that run themselves so you don't have to sit there prompting anything."

**FAQ pairs for each service page are in RESEARCH-STEP3 — use them exactly.**

**Per-page SEO metadata:**

| Page | Title | Pre-fill |
|---|---|---|
| /services/professional-websites | Professional Websites for Small Business \| From £299 \| FWD | "Hi Sam, I'm interested in a website for my business." |
| /services/business-process-automation | Business Process Automation \| From £799 \| FWD | "Hi Sam, I'm interested in automation for my business." |
| /services/custom-app-development | Custom App Development \| From £1,299 \| FWD | "Hi Sam, I'm interested in a custom app for my business." |
| /services/hosting-maintenance | Website Hosting & Maintenance \| From £99/month \| FWD | "Hi Sam, I'm interested in hosting for my website." |
| /services/ai-training | AI Training for Business \| From £299 \| FWD | "Hi Sam, I'm interested in AI training for my team." |

Schema per service page: Service + FAQPage + BreadcrumbList

### 2.6 AI Training Page (`src/pages/services/ai-training.astro`) — NEW

This is the natural companion to the automation service. Where automation replaces manual work with code, AI training teaches people to use LLMs effectively for the tasks where AI tools genuinely are the right answer.

**Positioning:** This is NOT "prompt engineering for techies." It's practical, hands-on training for business owners and their teams who are already using ChatGPT badly (or not at all) and want to get real value from it. Sam knows where AI tools work and where they don't — that credibility comes from building proper automation alongside it.

**Page composition:**
1. Hero (dark) with Breadcrumbs, H1, price anchor, CTA
2. "What You'll Learn" capabilities grid
3. Training formats section
4. "Who This Is For" section
5. Pricing tiers
6. FAQ section with Accordion + FAQPage schema
7. Related services (automation, websites)
8. SmartCTA + FreshnessBadge

**Content sections:**

```
H1: AI Training for Your Business

Lead: Learn to use ChatGPT, Claude, and other AI tools properly —
not from a YouTube video, but from a developer who builds with
these tools every day and knows where they actually help.

H2: What You'll Learn

- How to write prompts that actually work (and why most people get poor results)
- Which AI tool fits which job (ChatGPT vs Claude vs Gemini — honest comparison)
- Real workflows: drafting emails, summarising documents, analysing data, creating content
- Where AI falls short and what to do instead (when you need code, not chat)
- How to keep your business data safe when using AI tools
- Building AI into your daily routine without it becoming another distraction

H2: Training Formats

1-to-1 Session (from £299)
Two hours of focused, hands-on training tailored to your specific
business and workflows. We work through your actual tasks together.
You leave with a clear playbook for using AI tools in your day-to-day.

Team Workshop (from £499)
Half-day workshop for your team (up to 8 people). I cover the
fundamentals, then we work through real scenarios from your business.
Everyone leaves confident and actually using the tools.

Ongoing Support (from £99/month)
Monthly check-in plus email/WhatsApp support. As AI tools evolve
(they change fast), I keep you updated on what matters and what's hype.

H2: Who This Is For

- Business owners who've tried ChatGPT but aren't getting real value from it
- Teams who need to work faster but don't know where to start with AI
- Anyone who's heard "you should be using AI" but isn't sure how
- Businesses already using AI tools but worried about data privacy and accuracy

H2: Why Me?

I don't just use AI tools — I build with them. I integrate AI into
custom software, I build automation workflows, and I know exactly where
these tools are brilliant and where they'll waste your time. That means
you get honest, practical advice, not hype.
```

**FAQ pairs:**
1. Q: "Do I need any technical knowledge?" / A: "None at all. I tailor the training to your level. If you can use email, you can learn to use AI tools effectively."
2. Q: "Which AI tools do you cover?" / A: "Primarily ChatGPT and Claude, as they're the most useful for business. I'll also cover others where they're relevant to your specific needs — like AI image tools or transcription services."
3. Q: "Can you train my whole team?" / A: "Yes. Team workshops cover up to 8 people. For larger teams, I run multiple sessions so everyone gets hands-on practice."
4. Q: "Will AI replace my staff?" / A: "No — and anyone who tells you it will is selling something. AI tools make people faster and better at their jobs. The goal is to free up your team's time for work that actually needs a human."
5. Q: "How is this different from online courses?" / A: "Online courses teach generic prompts. I work with your actual business, your actual tasks, and your actual workflows. You leave with a system that works for you, not a certificate."
6. Q: "What if AI tools change after the training?" / A: "They will — that's why I offer an ongoing support plan. But the fundamentals I teach (how to think about prompts, how to evaluate output, where AI fits your workflow) don't change even when the tools do."

**SEO:**
- Title: "AI Training for Business | ChatGPT & Claude Workshops | FWD"
- Meta: "Hands-on AI training for UK businesses. Learn to use ChatGPT, Claude, and AI tools properly. Tailored to your workflows, not generic tips. From £299."
- Schema: Service + FAQPage + BreadcrumbList

### 2.4 Pricing Page (`src/pages/pricing.astro`) — NEW

See RESEARCH-STEP3 Section 2 for full content spec and FAQ pairs (8 questions).

Composition:
1. Hero: H1 "Transparent Pricing", lead copy from RESEARCH-STEP3
2. Pricing table (all 4 services with tiers)
3. PricingCalculator (`client:visible`)
4. "Why Are My Prices Lower?" section — copy from RESEARCH-STEP3
5. Comparison table: FWD vs Agency vs Budget vs DIY
6. FAQ Accordion (8 pricing questions from RESEARCH-STEP3)
7. SmartCTA + FreshnessBadge

**SEO:**
- Title: "How Much Does a Website Cost? | Transparent Pricing | FWD"
- Schema: FAQPage + BreadcrumbList

### 2.5 Contact Page (`src/pages/contact.astro`)

Rebuild with:
- Brief reassurance paragraph
- ContactForm (`client:visible`): Name (required), Email (required), Service type (select, optional), Message (textarea, optional)
- WhatsApp link + email address visible above form
- Expected response time: "I typically reply within a few hours during business days."
- Trust micro-copy: "No spam, no mailing lists. Just a reply to your message."

**SEO:**
- Title: "Get in Touch | FWD Thinking Solutions"
- Schema: ContactPage

---

## PHASE 3: Content Pages

### 3.1 Industry Pages

Create `src/content/industries/` with data files for each of the 8 industries.

Each industry page (300-500 words, lightweight):
1. Hero: H1 "Web Development for [Industry] Businesses"
2. Pain points specific to industry
3. "What I Can Build" — 3-4 capability cards
4. Related projects (if case studies exist)
5. Relevant service links
6. SmartCTA: "Got a [industry] project? Let's chat." Pre-fill: "Hi Sam, I run a [industry] business and I'm looking for help with..."

Industry-specific angles are in RESEARCH-STEP3.

### 3.2 Work Hub (`src/pages/work/index.astro`) — NEW

- H1: "Our Work"
- `<ProjectGallery client:visible />`
- Filters: All, Websites, Automation, Apps + industry tags
- Grid: 3 columns desktop, 2 tablet, 1 mobile
- Each card: thumbnail, title, industry tag, services used, one-line result

**Schema:** ItemList

### 3.3 Case Study Template (`src/pages/work/[...slug].astro`)

Structure per case study:
- Breadcrumbs
- H1: Project name
- Meta bar: industry, services used, timeline
- The Brief (2-3 paragraphs)
- The Solution (3-4 paragraphs)
- The Results (measurable outcomes)
- Client testimonial
- Tech stack
- Related work (2-3 other case studies)
- SmartCTA: "Got a similar project?" Pre-fill includes project name

Migrate existing 4 blog posts (building-*) into the work collection with proper frontmatter.

### 3.4 Blog Enhancements

Create `BlogLayout.astro` wrapping blog posts with:
- ReadingProgress (`client:load`) — 3px amber bar, role="progressbar"
- TableOfContents (`client:visible`) — auto-generated from H2s, sticky sidebar, highlight current section
- FreshnessBadge (if lastUpdated differs from pubDate)
- AuthorBox
- RelatedPosts (3 related articles)
- SmartCTA contextual to post topic

---

## PHASE 4: Polish

### 4.1 Interactive Components

**AnimatedCounter.tsx** (`client:visible`)
- Props: `target`, `duration` (default 1500), `prefix?`, `suffix?`
- IntersectionObserver triggers once
- requestAnimationFrame with ease-out
- `prefers-reduced-motion`: show final number immediately

**ServiceQuiz.tsx** (`client:visible`)
- 3-4 multi-choice questions
- Q1: "What's your biggest challenge?" (website / admin / custom tool / not sure)
- Q2: Refinement based on Q1
- Q3: Budget range
- Result: personalised recommendation + service page link + WhatsApp CTA
- Fieldset/legend per step, radio buttons, step announcements

**PricingCalculator.tsx** (`client:visible`)
- Step 1: Select service type (4 icons)
- Step 2: 3-4 questions per service type
- Step 3: Estimated range with breakdown
- CTA: WhatsApp pre-fill with their selections
- Back/Next buttons, visual progress indicator

**ProjectGallery.tsx** (`client:visible`)
- Filter by service type + industry
- Cards animate in/out (opacity + transform, 300ms)
- `aria-live="polite"` announces count on filter change
- Empty state message

**ReviewsSection.tsx** (`client:visible`)
- Hardcoded reviews (upgrade to Google Places API later)
- Horizontal scroll mobile, grid desktop
- Aggregate rating with stars
- Link to Google Business Profile

### 4.2 Dark Mode

- All pages should work in both themes
- Test every text/background combination for WCAG AA contrast
- Smooth 200ms transition on toggle
- No flash of wrong theme on page load (handled by inline script in Layout)

### 4.3 Accessibility Audit

Before considering this phase complete:
- [ ] Skip link on every page
- [ ] One H1 per page, logical heading hierarchy
- [ ] All interactive elements have visible focus indicator (3px outline)
- [ ] All images have descriptive alt text or alt=""
- [ ] All forms have explicit labels + aria-describedby for errors
- [ ] Colour contrast 4.5:1 body text, 3:1 large text
- [ ] prefers-reduced-motion disables all animations
- [ ] lang="en-GB" on html element
- [ ] Mobile menu: focus trap, Escape closes, focus returns to trigger
- [ ] Accordion: aria-expanded, aria-controls
- [ ] Minimum 44x44px touch targets
- [ ] Tab through every page — no traps, logical order

### 4.4 Performance

- Run `npm run build` and check output sizes
- Lighthouse 95+ performance on every page type
- Total homepage weight under 400KB
- JS budget under 150KB initial load
- All below-fold images: `loading="lazy"` `decoding="async"`
- Hero images: `loading="eager"` `fetchpriority="high"` max 200KB
- Use Astro's Image component everywhere (WebP, srcset, explicit dimensions)

---

## PHASE 5: Content Engine

- Publish first 5 blog articles (see RESEARCH-STEP3 priority list)
- Ensure all case studies have proper MDX content and frontmatter
- Verify all industry pages have real content, not placeholders
- Submit sitemap to Google Search Console
- Test all schema with Google Rich Results Test

### Priority "AI vs Code" Blog Articles

These should be woven into the publishing schedule from RESEARCH-STEP3. They target a gap no UK competitor is filling — practical, honest content about when AI tools are enough and when you need real code.

**Article: "ChatGPT vs Custom Code: When AI Tools Aren't Enough for Your Business"**
- Category: automation
- Cluster: "chatgpt for business automation", "ai tools vs custom software"
- Word count: 1,500-2,000
- Angle: Honest breakdown with real examples. ChatGPT is brilliant for X, but falls apart for Y. Use the eBay-to-Shopify case study as the centrepiece — one-at-a-time prompting vs a Python script that processes the lot in seconds. No AI-bashing; position it as knowing which tool fits which job.
- Internal links: /services/business-process-automation, /pricing, /work
- CTA: "Not sure whether you need AI or code? I'll tell you honestly."

**Article: "How I Migrated 500+ eBay Listings to Shopify (Without Copy-Pasting Into ChatGPT)"**
- Category: case-studies
- Cluster: "ebay to shopify migration", "ecommerce automation"
- Word count: 1,200-1,500
- Angle: Walk through the actual problem (messy eBay data, inconsistent formats, manual process taking days) and the solution (Python script that splits, cleans, and reformats in seconds). Show the before/after. This doubles as a case study and a demonstration of the code-vs-AI principle.
- Internal links: /services/business-process-automation, /services/custom-app-development, /industries/retail-ecommerce
- CTA: "Got a messy migration or data problem? Let's sort it out."

**Article: "5 Things ChatGPT Can't Do for Your Business (That Custom Automation Can)"**
- Category: automation
- Cluster: "business automation vs ai", "limitations of chatgpt for business"
- Word count: 1,500
- Angle: Listicle format. Cover: scheduled/recurring tasks, multi-system integrations, data transformations at scale, error handling and retries, audit trails and logging. Each point contrasts the ChatGPT approach with the proper solution. Practical, not preachy.
- Internal links: /services/business-process-automation, /pricing, /blog/chatgpt-vs-custom-code

### Priority "AI Training" Blog Articles

**Article: "How to Actually Use ChatGPT for Your Business (Not Just Ask It Quiz Questions)"**
- Category: guides
- Cluster: "how to use chatgpt for business", "chatgpt for small business UK"
- Word count: 2,000
- Angle: Practical guide aimed at business owners who've tried ChatGPT but aren't getting real value. Cover: writing better prompts, using it for emails/content/data, common mistakes, when to stop and use a proper tool instead. Link to training service throughout.
- Internal links: /services/ai-training, /services/business-process-automation, /blog/chatgpt-vs-custom-code
- CTA: "Want hands-on help? I run AI training sessions tailored to your business."

**Article: "ChatGPT vs Claude vs Gemini: Which AI Tool Should Your Business Use?"**
- Category: guides
- Cluster: "best ai tool for business", "chatgpt vs claude for business"
- Word count: 1,500-2,000
- Angle: Honest, no-hype comparison. What each is best at, what each is worst at, pricing, data privacy considerations for UK businesses. Sam uses all of them daily — that experience makes this credible. Not a rehash of feature tables; actual practical advice.
- Internal links: /services/ai-training, /services/business-process-automation
- CTA: "Not sure which to use? I cover this in my training sessions."

---

## Hydration Reference

Every React component must use the correct Astro client directive:

| Component | Directive | Why |
|---|---|---|
| DarkModeToggle | `client:load` | Must apply theme before paint |
| MobileMenu | `client:load` | Must respond to hamburger immediately |
| ReadingProgress | `client:load` | Must track scroll from page load |
| WhatsAppWidget | `client:idle` | Not critical, can wait |
| AnimatedCounter | `client:visible` | Only needs JS when in viewport |
| PricingCalculator | `client:visible` | Below fold |
| ServiceQuiz | `client:visible` | Below fold |
| ProjectGallery | `client:visible` | Below fold |
| ContactForm | `client:visible` | Usually below fold |
| Accordion | `client:visible` | FAQ sections always below fold |
| TableOfContents | `client:visible` | Sidebar |
| ReviewsSection | `client:visible` | Below fold |

---

## SEO Metadata Quick Reference

| Page | Title | Meta Description |
|---|---|---|
| / | FWD Thinking Solutions \| Web Developer for UK Businesses | Web development, business automation, and custom apps for UK small businesses. One developer, no middlemen, transparent pricing. Based in Norwich, working UK-wide. |
| /about | About Sam Fowler \| FWD Thinking Solutions | Meet Sam Fowler, the developer behind FWD. Dozens of projects across diverse sectors. Based in Norwich, working with businesses across the UK. |
| /services | Web Development & Automation Services \| FWD | Websites from £299, automation from £799, custom apps from £1,299. Fixed pricing, honest advice, direct communication. See all FWD services. |
| /services/professional-websites | Professional Websites for Small Business \| From £299 \| FWD | Fast, mobile-friendly websites for UK businesses. Fixed pricing from £299, built in 2 to 3 weeks. No templates, no subscriptions, you own everything. |
| /services/business-process-automation | Business Process Automation \| From £799 \| FWD | Automate invoicing, emails, data entry, and scheduling for your UK business. Custom automation from £799. |
| /services/custom-app-development | Custom App Development \| From £1,299 \| FWD | Bespoke web and mobile apps for UK businesses. Booking systems, dashboards, internal tools. Fixed quotes from £1,299. |
| /services/hosting-maintenance | Website Hosting & Maintenance \| From £99/month \| FWD | Reliable hosting with daily backups, security updates, and support for UK businesses. From £99/month. |
| /services/ai-training | AI Training for Business \| ChatGPT & Claude Workshops \| FWD | Hands-on AI training for UK businesses. Learn to use ChatGPT, Claude, and AI tools properly. Tailored to your workflows, not generic tips. From £299. |
| /pricing | How Much Does a Website Cost? \| Transparent Pricing \| FWD | Honest pricing for websites, automation, and custom apps. See exactly what you get at each price point. No hidden fees, no surprises. |
| /industries | Industries We Work With \| FWD Thinking Solutions | Web development and automation for equestrian, manufacturing, pet services, trades, fitness, and more. |
| /work | Our Work \| Web Development & Automation Projects \| FWD | Real projects, real results. See websites, apps, and automation built for UK businesses across diverse sectors. |
| /blog | Blog \| Web Development & Automation Insights \| FWD | Practical guides, case studies, and insights about web development and automation for UK businesses. |
| /contact | Get in Touch \| FWD Thinking Solutions | Contact FWD for web development, automation, or custom apps. Based in Norwich, working UK-wide. WhatsApp, email, or contact form. |

---

## Schema Quick Reference

| Page | Schema Types |
|---|---|
| / | WebSite, Organization/LocalBusiness |
| /about | Person, Organization |
| /services | ItemList |
| /services/* | Service, FAQPage, BreadcrumbList |
| /industries | ItemList |
| /industries/* | Service, BreadcrumbList |
| /work | ItemList |
| /work/* | Article, BreadcrumbList |
| /pricing | FAQPage, BreadcrumbList |
| /blog | Blog |
| /blog/* | BlogPosting, BreadcrumbList |
| /contact | ContactPage |

---

## Internal Linking Rules

When writing page copy, link naturally:
- Mention pricing/costs → link to /pricing
- Mention previous work/results → link to /work
- Mention automation → link to /services/business-process-automation
- Mention website → link to /services/professional-websites
- Mention app/booking/dashboard → link to /services/custom-app-development
- Mention hosting/maintenance → link to /services/hosting-maintenance
- Mention AI training, ChatGPT, Claude, learning AI → link to /services/ai-training
- Mention specific industry → link to /industries/[slug]
- Mention "get in touch" → link to /contact

Every page should link to at least 2 other internal pages within its body copy.

---

## WhatsApp Pre-fill Messages Per Page

| Page Type | Pre-fill |
|---|---|
| Homepage | "Hi Sam, I found your website and I'm interested in discussing a project." |
| Service page | "Hi Sam, I'm interested in [service] for my business." |
| Pricing page | "Hi Sam, I've been looking at your pricing. Here's what I need:" |
| Industry page | "Hi Sam, I run a [industry] business and I'm looking for help with..." |
| Case study | "Hi Sam, I saw your [project name] case study and I need something similar." |
| AI training page | "Hi Sam, I'm interested in AI training for my business." |
| Blog post | "Hi Sam, I was reading your article about [topic] and had some questions." |
| Contact | Not applicable (form is primary CTA) |
