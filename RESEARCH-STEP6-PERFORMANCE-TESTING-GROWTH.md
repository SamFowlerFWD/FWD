# FWD Thinking Solutions: Performance, Testing & Post-Launch Growth Plan

**Date:** March 2026
**Purpose:** Complete the build brief with performance implementation specs, test plans for every interactive component, and the post-launch growth strategy.

---

## Part 1: Web Performance Specification

### Performance Budget

| Metric | Target | Stretch Goal |
|---|---|---|
| LCP | Under 2.0s | Under 1.5s |
| INP | Under 150ms | Under 100ms |
| CLS | Under 0.05 | Under 0.02 |
| FCP | Under 1.2s | Under 0.8s |
| TTFB | Under 400ms | Under 200ms |
| Total Blocking Time | Under 150ms | Under 100ms |
| Total page weight (homepage) | Under 400KB | Under 300KB |
| JavaScript budget (initial load) | Under 150KB | Under 100KB |
| CSS budget | Under 40KB | Under 25KB |

Test on: Slow 4G throttle, mid-range mobile device (Moto G Power equivalent). Not just a MacBook on fibre.

### Image Pipeline

FWD is an Astro project with Sharp already configured. Use Astro's built-in Image component for automatic optimisation.

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- LCP image: eager load, high fetch priority -->
<Image
  src={heroImage}
  alt="Descriptive alt text for the hero"
  width={1200}
  height={600}
  format="webp"
  quality={80}
  loading="eager"
  fetchpriority="high"
/>

<!-- Below-fold images: lazy load -->
<Image
  src={projectImage}
  alt="Screenshot of the Millers Fitness website"
  width={800}
  height={450}
  format="webp"
  quality={75}
  loading="lazy"
  decoding="async"
/>
```

**Rules for the build:**
- Hero images: `loading="eager"`, `fetchpriority="high"`, max 200KB
- All other images: `loading="lazy"`, `decoding="async"`, max 100KB
- Always set explicit width and height (CLS prevention)
- Use Astro's Image component everywhere (handles WebP conversion, srcset, and sizing)
- SVG for icons and logos (inline where possible to avoid extra requests)
- No unoptimised images in /public; everything goes through the asset pipeline

### Font Strategy

System font stack. No external font loading at all.

```css
:root {
  --font-heading: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
}
```

**Why:** Zero font loading time. Zero FOUT. Zero CLS from font swap. Zero additional requests. System fonts look clean and professional on every platform. This is the single biggest performance win for a site this size; it eliminates an entire category of performance problems.

If a custom font is desired later, add it as a progressive enhancement:
```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
  font-weight: 400 700;
}
```

### CSS/JS Loading Strategy

**CSS:** Astro handles critical CSS extraction automatically with `inlineStylesheets: 'auto'` (already configured in astro.config.mjs). Tailwind CSS is purged at build time via the Vite plugin. No additional CSS optimisation needed.

**JavaScript:** Astro's island architecture is the key advantage here. Only interactive components ship JS to the browser.

```astro
<!-- Static: zero JS shipped -->
<SmartCTA heading="Ready to start?" />

<!-- Interactive: JS loaded only for this component -->
<PricingCalculator client:visible />

<!-- Deferred: JS loaded when scrolled into view -->
<ServiceQuiz client:visible />

<!-- Immediate: JS loaded on page load (use sparingly) -->
<DarkModeToggle client:load />
<MobileMenu client:load />
```

**Hydration strategy by component:**

| Component | Directive | Reason |
|---|---|---|
| DarkModeToggle | client:load | Needs to apply theme before paint |
| MobileMenu | client:load | Needs to respond to hamburger click immediately |
| WhatsAppWidget | client:idle | Not critical; can wait until browser is idle |
| AnimatedCounter | client:visible | Only needs JS when scrolled into view |
| PricingCalculator | client:visible | Below fold on pricing page |
| ServiceQuiz | client:visible | Below fold on homepage |
| ProjectGallery | client:visible | Below fold on /work page |
| ContactForm | client:visible | Usually below fold on contact page |
| Accordion | client:visible | FAQ sections are always below fold |
| ReadingProgress | client:load | Needs to track scroll from page load |
| TableOfContents | client:visible | Sidebar; visible quickly but not top priority |
| ReviewsSection | client:visible | Below fold on homepage |

### Caching Configuration

For Hostinger VPS with Nginx:

```nginx
# Static assets with content hashes (immutable)
location ~* \.(?:js|css|woff2|avif|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

# Images (long cache)
location ~* \.(?:jpg|jpeg|png|gif|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000";
}

# HTML pages (always revalidate)
location ~* \.html$ {
    add_header Cache-Control "public, max-age=3600, must-revalidate";
}

# Enable Brotli compression
brotli on;
brotli_types text/html text/css application/javascript application/json image/svg+xml;
brotli_comp_level 6;

# Fallback to gzip
gzip on;
gzip_types text/html text/css application/javascript application/json image/svg+xml;
gzip_min_length 256;
```

### Resource Hints

Add to Layout.astro `<head>`:

```html
<!-- Preconnect to WhatsApp API (primary CTA destination) -->
<link rel="preconnect" href="https://wa.me">

<!-- Prefetch likely next pages based on user flow -->
{isHomepage && (
  <>
    <link rel="prefetch" href="/services" />
    <link rel="prefetch" href="/pricing" />
  </>
)}
```

Astro's `prefetch` config is already set to `hover` strategy with `prefetchAll: true`. This handles most navigation prefetching automatically.

### Performance Monitoring Plan

**During development:**
- Run Lighthouse on every page after building it
- Check bundle size with `npm run build` output
- Test on throttled connection in Chrome DevTools

**At launch:**
- Full Lighthouse audit on all page types (homepage, service, pricing, blog, contact)
- WebPageTest run on homepage and top 3 service pages
- Document baseline scores

**Post-launch:**
- Google Search Console Core Web Vitals (monthly check)
- Lighthouse CI in GitHub Actions on every deployment (optional, phase 2)
- Performance regression alert if LCP exceeds 3s

---

## Part 2: Feature Testing Plan

### Test Stack

The project already has Playwright configured (package.json includes @playwright/test and @axe-core/playwright). Use this for integration and E2E tests. Add Vitest for unit tests.

```bash
npm install -D vitest
```

### Test Map: Every Interactive Component

---

#### ContactForm

**Risk level:** High (primary conversion mechanism)

**Happy path tests:**
```
- Fill in name, email, message; submit
  Expected: success confirmation, form clears, aria-live region announces success
- Fill in name and email only (message optional); submit
  Expected: success (message field is not required)
```

**Error path tests:**
```
- Submit with empty name
  Expected: inline error below name field, focus moves to name field, aria-invalid="true"
- Submit with invalid email ("not-an-email")
  Expected: inline error below email field with helpful message
- Submit when server returns 500
  Expected: friendly error message with alternative contact methods (WhatsApp, email)
- Submit when offline
  Expected: "You appear to be offline" message, form data preserved
- Double-click submit button
  Expected: form submits once only, button disabled during submission
```

**Edge case tests:**
```
- Very long name (500+ characters)
  Expected: accepted or truncated gracefully
- Unicode/emoji in name field
  Expected: accepted (real names contain accents, etc.)
- XSS attempt: <script>alert('xss')</script> in any field
  Expected: sanitised, no script execution
- Paste formatted HTML into message field
  Expected: plain text only, HTML stripped
- Browser autofill triggers submission
  Expected: honeypot field (if implemented) catches bots
```

**Accessibility tests (Playwright + axe):**
```javascript
test('contact form passes accessibility audit', async ({ page }) => {
  await page.goto('/contact');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('form errors are announced to screen readers', async ({ page }) => {
  await page.goto('/contact');
  await page.click('button[type="submit"]');
  const errorRegion = page.locator('[role="alert"]');
  await expect(errorRegion).toBeVisible();
});
```

---

#### PricingCalculator

**Risk level:** Medium (conversion aid, not direct conversion)

**Happy path tests:**
```
- Select "Website", answer all questions, see estimate
  Expected: range displayed (e.g., "£800 to £1,500"), CTA visible
- Select "Automation", answer all questions, see estimate
  Expected: range displayed, relevant WhatsApp pre-fill
- Navigate back and change answers
  Expected: estimate updates correctly
- Complete all 4 service types sequentially
  Expected: each produces different, sensible range
```

**Edge case tests:**
```
- Select minimum options for every question
  Expected: shows the "from" price for that service
- Select maximum options for every question
  Expected: shows a reasonable upper range (not absurdly high)
- Rapidly click through steps without selecting options
  Expected: validation prevents advancing without a selection
- Browser back button during multi-step flow
  Expected: returns to previous step with selections preserved
```

**Accessibility tests:**
```
- Tab through entire flow using keyboard only
  Expected: every option focusable, Enter/Space selects, Next/Back buttons work
- Step changes announced
  Expected: "Step 2 of 3" announced via aria-live region
- Result announced
  Expected: estimate read by screen reader when result appears
```

---

#### ServiceQuiz

**Happy path tests:**
```
- Select "I need a website" path through to result
  Expected: recommends Professional Websites service with link
- Select "I'm drowning in admin" path
  Expected: recommends Business Process Automation
- Select "I need a custom tool"
  Expected: recommends Custom App Development
- Select "Not sure"
  Expected: helpful result suggesting a conversation, not a dead end
```

**Edge case tests:**
```
- Start quiz, navigate away, return
  Expected: quiz resets to step 1 (no stale state)
- Complete quiz, click "Start over"
  Expected: quiz resets cleanly
```

---

#### DarkModeToggle

**Happy path tests:**
```
- Click toggle in light mode
  Expected: switches to dark mode, all pages affected, preference persisted in cookie
- Reload page after switching
  Expected: dark mode persists (no flash of light mode)
- Visit new page after switching
  Expected: dark mode applies immediately
```

**Edge case tests:**
```
- System preference is dark mode, no cookie set
  Expected: site loads in dark mode by default
- System preference changes while site is open
  Expected: site follows system preference (if no user override)
- User has explicitly chosen light mode, system is dark
  Expected: user choice takes precedence
- Cookie is deleted
  Expected: falls back to system preference
- All text/background combinations pass WCAG AA contrast in dark mode
  Expected: all pass 4.5:1 for body text, 3:1 for large text
```

---

#### ProjectGallery (Filters)

**Happy path tests:**
```
- Click "Websites" filter
  Expected: only website projects shown, count updates, smooth animation
- Click "All" filter
  Expected: all projects shown
- Click industry tag on a card
  Expected: filters to that industry
```

**Edge case tests:**
```
- Filter that returns zero results
  Expected: "No projects in this category yet" message, not empty grid
- Rapidly click between filters
  Expected: no visual glitches, final state is correct
- Filter state in URL (if implemented as query param)
  Expected: /work?filter=automation loads with correct filter applied
```

**Accessibility tests:**
```
- Filter change announced
  Expected: "Showing 5 projects" via aria-live region
- Keyboard navigation through filtered results
  Expected: tab order follows visible cards only (hidden cards are not focusable)
```

---

#### WhatsAppWidget

**Happy path tests:**
```
- Widget visible on homepage
  Expected: floating button, bottom-right
- Click/tap widget
  Expected: expands to show pre-filled message preview
- Click "Send" in expanded widget
  Expected: opens WhatsApp with correct pre-filled message
- Dismiss widget
  Expected: widget disappears for rest of session
```

**Edge case tests:**
```
- Visit /contact page
  Expected: widget is NOT shown (form is primary CTA there)
- On mobile, widget does not overlap other interactive elements
  Expected: no z-index conflicts, no accidental taps
- Pre-fill message matches current page context
  Expected: automation page shows automation message, not generic
- WhatsApp not installed on mobile device
  Expected: opens WhatsApp web in browser (wa.me handles this)
```

---

#### Accordion/FAQ

**Happy path tests:**
```
- Click a question
  Expected: answer reveals with smooth animation, aria-expanded="true"
- Click same question again
  Expected: answer collapses, aria-expanded="false"
- Click a different question
  Expected: new answer opens (previous can stay open or close; define behaviour)
```

**Accessibility tests:**
```
- Navigate with keyboard (Tab to each question, Enter/Space to toggle)
  Expected: all questions reachable and toggleable via keyboard
- Screen reader announces state
  Expected: "expanded" or "collapsed" announced for each item
```

---

### Automated Test Suite Structure

```
tests/
  unit/
    pricing-logic.test.ts        # Calculator range calculations
    validation.test.ts            # Form validation rules
    quiz-logic.test.ts            # Quiz recommendation mapping
    schema-generation.test.ts     # JSON-LD output correctness
  e2e/
    homepage.test.ts              # Full homepage render and interactions
    contact-form.test.ts          # Form submission flow
    pricing-calculator.test.ts    # Calculator happy + error paths
    dark-mode.test.ts             # Toggle persistence and contrast
    navigation.test.ts            # Mobile menu, breadcrumbs, links
    blog-post.test.ts             # Reading progress, ToC, content
    project-gallery.test.ts       # Filter interactions
  accessibility/
    axe-audit.test.ts             # Run axe on every page type
    keyboard-nav.test.ts          # Tab through every page
    colour-contrast.test.ts       # Verify all dark mode combinations
```

### Security Tests

Since this is a static Astro site, the attack surface is small. But test these:

```
- All external links have rel="noopener noreferrer"
  Expected: no window.opener leaks
- Contact form (if using an API route) sanitises all input
  Expected: HTML/script tags stripped before processing
- No sensitive data in client-side JavaScript (API keys, etc.)
  Expected: OPENAI_API_KEY only used server-side
- Security headers served correctly (already configured in astro.config.mjs)
  Expected: CSP, HSTS, X-Frame-Options all present
- robots.txt does not expose sensitive paths
  Expected: only /api/ disallowed
```

---

## Part 3: Post-Launch Growth Plan

### Launch Checklist (Week 0)

**Technical:**
- [ ] Submit sitemap to Google Search Console
- [ ] Verify site ownership in Google Search Console
- [ ] Set up Google Analytics 4 (or Plausible/Fathom for privacy-friendly alternative)
- [ ] Configure conversion events: WhatsApp clicks, form submissions, pricing page visits
- [ ] Verify all redirects work (/portfolio -> /work, old hosting URL -> new)
- [ ] Test contact form end-to-end in production
- [ ] Verify schema markup in Google Rich Results Test (every page type)
- [ ] Run Lighthouse on all page types; document baseline scores
- [ ] Set up uptime monitoring (UptimeRobot or similar; free tier is fine)

**Local SEO:**
- [ ] Create or update Google Business Profile
- [ ] Add website URL to GBP
- [ ] Add all services to GBP
- [ ] Request reviews from existing clients (minimum 5 to start)
- [ ] Add GBP URL to sameAs schema array
- [ ] Submit to key UK directories: Yell, Thomson Local, FreeIndex, Clutch

**Content:**
- [ ] Publish first 2 blog articles (pricing guide + automation guide)
- [ ] Verify all case studies have correct content and images
- [ ] Check all industry pages have relevant, non-placeholder content

### Month 1: Foundation

**Content publishing:** 2 articles per week (8 total)
Priority articles from the content strategy:
1. "How Much Does a Website Cost in the UK? (2026 Guide)"
2. "5 Business Tasks You Should Automate Right Now"
3. "Freelancer vs Agency: Which Is Right for Your Website Project?"
4. Expanded Fakenham Dog Field case study
5. "What Questions Should You Ask a Web Developer Before Hiring Them?"
6. "Do You Need a Custom Website or Will a Template Work?"
7. Manufacturing automation case study
8. Millers Fitness case study

**SEO monitoring:**
- Check Google Search Console for indexing status (are all pages indexed?)
- Note initial keyword impressions and positions
- Fix any crawl errors that appear

**Conversion tracking:**
- Establish baseline: WhatsApp clicks per week, form submissions per week
- Note which pages drive the most conversions
- Identify any pages with high traffic but zero conversions (fix these first)

### Months 2 to 3: Growth Phase

**Content publishing:** 1 article per week (8 total over 2 months)
Articles 9 to 16 from the content strategy, focusing on:
- Automation comparison content (n8n vs Zapier)
- More case studies across different industries
- Decision-help content ("How to tell if your website is working")

**SEO actions:**
- Review Search Console data: which keywords are showing impressions but low clicks? (Optimise title tags and meta descriptions for these)
- Identify pages ranking positions 5 to 15 and strengthen them (add content depth, internal links, update freshness dates)
- Build initial backlinks: submit to web development directories, respond to HARO/Connectively queries, guest post on UK business blogs if opportunities arise

**Conversion optimisation:**
- Review WhatsApp pre-fill messages: are they generating conversations? Adjust wording if not.
- Check pricing calculator usage: are people completing it? Where do they drop off?
- A/B test the homepage hero CTA copy (if traffic justifies it)

### Months 4 to 6: Authority Building

**Content publishing:** 1 article per week minimum, with focus on:
- Remaining articles from the content strategy (articles 17 to 20)
- New articles based on Search Console data (topics generating impressions)
- Seasonal content if applicable

**SEO actions:**
- Quarterly refresh of pricing page (update date, review pricing, add new FAQ)
- Refresh service pages with any new capabilities or case studies
- Review and update all "last updated" dates on evergreen content
- Internal linking audit: ensure new content is properly linked to pillar pages

**Content engine performance review:**
- Which articles drive the most traffic?
- Which articles convert best (lead to WhatsApp or form)?
- Which articles should be expanded or updated?
- Are there clear topic clusters forming that deserve dedicated hub pages?

### Monthly Reporting (Self-Monitoring)

Since this is Sam's own site, the report is for self-assessment. Track monthly:

```
Visitors: [number] ([+/- %] vs last month)
Organic search visitors: [number] ([+/- %])
Top 5 pages by traffic: [list]
WhatsApp clicks: [number]
Contact form submissions: [number]
Pricing page visits: [number]
New keywords ranking (top 50): [count]
Best-performing blog post this month: [title] ([visits])
```

**Red flags to watch for:**
- Organic traffic declining for 2+ consecutive months (investigate: algorithm update? technical issue? competitor movement?)
- High-traffic page with zero conversions (CTA problem or wrong audience)
- Core Web Vitals regression (check after any deployment)
- Indexing issues in Search Console (pages dropped from index)

### Phase Two Opportunities (Months 6+)

Based on data gathered in the first 6 months, evaluate:

1. **Client portal** (from enhancement doc). If enquiry volume justifies it, build a simple dashboard for active clients to track project status. This becomes a case study in itself.

2. **AI chat widget.** If the blog is generating enough traffic, an AI-powered FAQ that answers common questions could reduce repetitive enquiries and demonstrate AI capability.

3. **Expanded industry pages.** If certain industry pages drive disproportionate traffic, expand them from lightweight (300 to 500 words) to full-depth pages with more case studies, FAQs, and specific examples.

4. **Video content.** Short project walkthroughs or "how I built this" videos. Embed on case study pages and share on YouTube for additional organic reach.

5. **Email newsletter.** If the blog audience grows, a monthly digest of new articles and automation tips could build a subscriber base. Low effort (automated from blog RSS), high long-term value.

### Retainer Structure for Future Clients

This rebuild also positions FWD to offer retainer services. Based on what Sam builds for his own site, package these as offerings:

**Maintenance Plan (from £99/month):** Hosting, backups, security, uptime monitoring, monthly health check.

**Growth Plan (from £299/month):** Everything above plus 2 blog posts/month, monthly SEO review, quarterly content refresh, conversion tracking.

**Full Service (from £499/month):** Everything above plus new feature development (X hours/month), A/B testing, strategic quarterly review.

These tiers can be demonstrated on the pricing page with FWD's own site as proof that the approach works.
