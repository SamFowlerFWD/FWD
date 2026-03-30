# FWD Thinking Solutions: Complete Build Brief

**Project:** Full site rebuild for f-w-d.co.uk
**Framework:** Astro 5 + React + Tailwind CSS 4 (keep current stack)
**Output:** Static site (keep current config)
**Date:** March 2026

This document compiles everything from the research chain into a single brief for building in Cursor. Reference the individual step documents for deeper detail on any section.

---

## Site Architecture

### URL Map

```
/                                           Homepage
/about                                      About Sam & FWD
/services                                   Services hub
/services/professional-websites             Websites service page
/services/business-process-automation       Automation service page
/services/custom-app-development            Apps service page
/services/hosting-maintenance               Hosting service page
/industries                                 Industries hub
/industries/equestrian                      Equestrian landing page
/industries/manufacturing                   Manufacturing landing page
/industries/pet-services                    Pet services landing page
/industries/trades-construction             Trades landing page
/industries/health-fitness                  Health & fitness landing page
/industries/professional-services           Professional services landing page
/industries/retail-ecommerce                Retail landing page
/industries/technology-saas                 Tech/SaaS landing page
/work                                       Case studies hub (replaces /portfolio)
/work/[slug]                                Individual case studies
/blog                                       Blog index
/blog/[slug]                                Blog posts
/pricing                                    Pricing guide (NEW)
/contact                                    Contact page
/privacy-policy                             Privacy policy
```

### Redirects Required

```
/portfolio -> /work (301)
/services/reliable-hosting-maintenance -> /services/hosting-maintenance (301)
```

---

## Technical Fixes (from SEO Audit)

These should be done first as they affect every page:

### 1. Fix Title Tag Template

**Current:** `{title} | FWD Thinking Solutions` (causes duplication)
**New logic:**
```
if (isHomepage) -> title prop only (no suffix)
else -> `{title} | FWD`
```

### 2. Remove Keywords Meta Tag

Delete the `keywords` prop from Layout.astro entirely. Remove from all pages that pass it.

### 3. Add robots.txt

Create `/public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://f-w-d.co.uk/sitemap-index.xml
```

### 4. Add BreadcrumbList Schema

The visual Breadcrumbs component exists but has no corresponding JSON-LD. Add BreadcrumbList schema that mirrors the visual breadcrumbs on every inner page.

### 5. Populate sameAs in Organization Schema

Add Google Business Profile URL and any social profile URLs to the sameAs array in the Layout schema.

### 6. Add telephone to Schema

Add `"telephone": "+447584417830"` and a contactPoint to the Organization schema.

### 7. Add FAQ Sections to All Service Pages

Currently only the automation page has FAQs. Add FAQ sections (with FAQPage schema) to: professional-websites, custom-app-development, hosting-maintenance, and pricing.

### 8. Update Sitemap Config

Add new page types to the sitemap serializer:
- Industry pages: priority 0.7
- Case study pages (/work/*): priority 0.6
- Pricing page: priority 0.9

---

## New Components to Build

### Foundation Components (build first)

#### DarkModeToggle
- React component in navigation
- CSS custom properties for all colours (light and dark values)
- Respects prefers-color-scheme by default
- Stores user preference in cookie
- Smooth 200ms transition on all colour changes
- Small icon toggle (sun/moon)

#### SmartCTA
- Astro component accepting: text, whatsappMessage, secondaryText, secondaryHref
- Renders primary CTA (WhatsApp with pre-filled message) and secondary CTA
- Used on every page with context-specific copy
- WhatsApp link format: `https://wa.me/447584417830?text={encodedMessage}`

#### MicroInteractionSystem
- Refine existing data-animate and card-hover classes
- Add: button press scale (0.98 on :active), link underline reveals, form focus animations
- Staggered reveals for card grids (refine data-stagger)
- All animations use transform and opacity only (GPU-accelerated)
- Respect prefers-reduced-motion: disable all animations if set
- Define shared timing variables: --duration-fast (150ms), --duration-normal (300ms), --duration-slow (500ms)

#### WhatsAppWidget
- React component, floating bottom-right
- Shows WhatsApp icon with subtle pulse on first visit
- Expands on hover/tap to show pre-filled message and send button
- Different pre-fill per page (passed as prop)
- Dismissible for session (cookie-based)
- Hidden on /contact page
- Mobile: ensure no conflict with native WhatsApp

### Homepage Components

#### AnimatedCounter
- React component: props target (number), duration (ms), prefix (string), suffix (string)
- Triggered by intersection observer (animate when scrolled into view)
- Uses requestAnimationFrame with ease-out curve
- Counts from 0 to target over ~1.5 seconds
- Respects prefers-reduced-motion (shows final number immediately)

#### ServiceQuiz
- React multi-step component
- 3 to 4 questions with multiple choice
- Q1: "What's your biggest challenge?" (need a website / drowning in admin / need a custom tool / not sure)
- Q2: Based on Q1, refine (e.g., for websites: "What kind of site?" brochure / ecommerce / booking / portal)
- Q3: "What's your rough budget?" (under £500 / £500 to £2k / £2k to £5k / £5k+)
- Result: personalised recommendation with link to relevant service page and WhatsApp CTA
- Smooth transitions between steps (Framer Motion or CSS)

#### ReviewsSection
- Display client reviews (start with hardcoded data, upgrade to Google Places API later)
- Horizontal scroll on mobile, grid on desktop
- Show aggregate rating with star icons
- Each review: stars, quote text, name, company, date
- Link to Google Business Profile for verification

### Pricing Page Components

#### PricingCalculator
- React multi-step form
- Step 1: Select service type (website / automation / app / hosting)
- Step 2: Answer 3 to 4 questions specific to that service type
  - Websites: how many pages? need ecommerce? need booking? need CMS?
  - Automation: how many processes? which tools? need custom integrations?
  - Apps: web app, mobile, or both? need user accounts? need payments?
  - Hosting: existing site or new build? expected traffic level?
- Step 3: Display estimated range with breakdown
- CTA: "Want an exact quote? Let's talk" with pre-filled WhatsApp message including their selections
- Pure client-side, no backend

### Blog Components

#### ReadingProgress
- Thin bar (3px) fixed at viewport top
- Width = scroll position / article length * 100%
- Brand colour (amber)
- Only on blog post pages
- Pure JS with requestAnimationFrame

#### TableOfContents
- Auto-generated from H2 headings in MDX
- Desktop: sticky sidebar
- Mobile: collapsible toggle at top of article
- Smooth scroll to sections
- Highlight current section (intersection observer)
- Only shows on posts with 3+ H2 headings

#### FreshnessBadge
- Simple Astro component
- Displays "Last updated: [Month Year]"
- Subtle styling, positioned below page title
- Used on: /pricing, all service pages, evergreen blog posts

### Work Page Components

#### ProjectGallery
- React component with filter UI
- Filter categories: All, Websites, Apps, Automation (service type) + industry tags
- CSS grid layout, 3 columns desktop, 2 tablet, 1 mobile
- Cards animate in/out on filter (opacity + transform, 300ms)
- Each card: thumbnail, project name, industry tag, services used, one-line result
- Click through to full case study page

---

## Page-by-Page Content Specifications

### SEO Metadata

| Page | Title | Meta Description |
|---|---|---|
| / | FWD Thinking Solutions \| Web Developer for UK Businesses | Web development, business automation, and custom apps for UK small businesses. One developer, no middlemen, transparent pricing. Based in Norwich, working UK-wide. |
| /about | About Sam Fowler \| FWD Thinking Solutions | Meet Sam Fowler, the developer behind FWD. 14+ projects across 8+ industries. Based in Norwich, working with businesses across the UK. |
| /services | Web Development & Automation Services \| FWD | Websites from £299, automation from £799, custom apps from £1,299. Fixed pricing, honest advice, direct communication. See all FWD services. |
| /services/professional-websites | Professional Websites for Small Business \| From £299 \| FWD | Fast, mobile-friendly websites for UK businesses. Fixed pricing from £299, built in 2 to 3 weeks. No templates, no subscriptions, you own everything. |
| /services/business-process-automation | Business Process Automation \| From £799 \| FWD | Automate invoicing, emails, data entry, and scheduling for your UK business. Custom automation from £799. See what can be automated and how much it costs. |
| /services/custom-app-development | Custom App Development \| From £1,299 \| FWD | Bespoke web and mobile apps for UK businesses. Booking systems, dashboards, internal tools. Fixed quotes from £1,299. |
| /services/hosting-maintenance | Website Hosting & Maintenance \| From £99/month \| FWD | Reliable hosting with daily backups, security updates, and support for UK businesses. From £99/month. One point of contact for everything. |
| /pricing | How Much Does a Website Cost? \| Transparent Pricing \| FWD | Honest pricing for websites, automation, and custom apps. See exactly what you get at each price point. No hidden fees, no surprises. |
| /industries | Industries We Work With \| FWD Thinking Solutions | Web development and automation for equestrian, manufacturing, pet services, trades, fitness, and more. See how FWD helps businesses in your industry. |
| /work | Our Work \| Web Development & Automation Projects \| FWD | Real projects, real results. See websites, apps, and automation built for UK businesses across 8+ industries. |
| /blog | Blog \| Web Development & Automation Insights \| FWD | Practical guides, case studies, and insights about web development and automation for UK businesses. Written by a developer, not a marketer. |
| /contact | Get in Touch \| FWD Thinking Solutions | Contact FWD for web development, automation, or custom apps. Based in Norwich, working UK-wide. WhatsApp, email, or contact form. |

### Schema per Page

| Page | Schema Types |
|---|---|
| / | WebSite, Organization/LocalBusiness (enhanced) |
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

## Content Data Structures

### Case Studies (Astro Content Collection)

```typescript
// src/content/config.ts - add work collection
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
```

### Industry Pages (can be content collection or static)

```typescript
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
```

### Blog Posts (enhance existing)

Add to existing blog schema:
```typescript
lastUpdated: z.date().optional(),
category: z.enum(['guides', 'case-studies', 'automation', 'web-development', 'business']),
```

---

## Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | 95+ |
| Lighthouse Accessibility | 98+ |
| Lighthouse SEO | 100 |
| Lighthouse Best Practices | 100 |
| LCP | Under 2.0s |
| INP | Under 150ms |
| CLS | Under 0.05 |
| Total page weight (homepage) | Under 500KB |
| Time to Interactive | Under 3s on 3G |

---

## Build Phases

### Phase 1: Foundation (do first)
- Technical fixes (title tags, robots.txt, schema fixes)
- CSS custom properties for dark mode
- Micro-interaction system
- SmartCTA component
- WhatsApp widget
- Layout and navigation updates

### Phase 2: Core Pages
- Homepage rebuild with all new sections and components
- About page rewrite
- Services hub and all 4 service pages (with FAQs)
- Contact page
- Pricing page with calculator

### Phase 3: Content Pages
- Industry pages (all 8)
- Work hub with filterable gallery
- Case study template and initial case studies
- Blog template enhancements (progress bar, ToC, freshness badge)

### Phase 4: Polish
- Dark mode full implementation and testing
- Animated counters
- Service quiz
- Reviews integration
- Lighthouse badge
- Cross-browser testing
- Accessibility audit
- Performance optimisation pass

### Phase 5: Content Engine Launch
- Publish first 5 blog articles
- Set up analytics tracking
- Submit updated sitemap to Google Search Console
- Set up GBP and link to site

---

## Key Files to Modify

| File | Changes |
|---|---|
| src/layouts/Layout.astro | Fix title logic, remove keywords, add BreadcrumbList schema, enhance Organization schema, add WhatsApp widget |
| src/components/ui/Nav.astro | Add dark mode toggle |
| src/components/ui/Footer.astro | Add industry links, add reviews badge, update service links |
| src/components/ui/Breadcrumbs.astro | Add JSON-LD BreadcrumbList |
| astro.config.mjs | Add redirects, update sitemap priorities, add work and industries collections |
| src/pages/index.astro | Full rebuild with new sections and components |
| src/pages/about.astro | Rewrite copy, add enhanced schema |
| src/pages/services/*.astro | Add FAQs, FAQ schema, smart CTAs, internal links |
| src/pages/contact.astro | Rebuild with form, multiple contact methods |
| public/robots.txt | Create new |

### New Files to Create

```
src/components/PricingCalculator.tsx
src/components/AnimatedCounter.tsx
src/components/ServiceQuiz.tsx
src/components/ReviewsSection.tsx
src/components/ProjectGallery.tsx
src/components/DarkModeToggle.tsx
src/components/ReadingProgress.tsx  (or inline in blog template)
src/components/TableOfContents.tsx
src/components/SmartCTA.astro
src/components/WhatsAppWidget.tsx
src/components/FreshnessBadge.astro
src/pages/pricing.astro
src/pages/industries/index.astro
src/pages/industries/[slug].astro  (or individual files)
src/pages/work/index.astro
src/pages/work/[slug].astro
src/content/work/  (case study MDX files)
src/content/industries/  (industry data)
public/robots.txt
```

---

## Reference Documents

For deeper detail on any section, see:
- `RESEARCH-STEP1-MARKET-KEYWORDS.md` - competitor analysis, keyword clusters, audience insights
- `RESEARCH-STEP2-SEO-AUDIT.md` - full technical audit, schema examples, linking strategy
- `RESEARCH-STEP3-CONTENT-STRATEGY.md` - voice profile, full page copy, blog plan, FAQ pairs
- `RESEARCH-STEP4-ENHANCEMENTS.md` - enhancement briefs, implementation details, phase two ideas
- `RESEARCH-STEP5-DESIGN-SYSTEM.md` - design tokens, component specs, conversion architecture, accessibility
- `RESEARCH-STEP6-PERFORMANCE-TESTING-GROWTH.md` - performance budgets, test plans, post-launch growth strategy
