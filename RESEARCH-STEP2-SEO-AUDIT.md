# FWD Thinking Solutions: SEO Audit & Technical Foundation

**Mode:** Rebuild (existing site audit + new architecture plan)
**Date:** March 2026

---

## Part 1: Current Site Audit

### What's Already Good

The current site has a surprisingly strong technical foundation for a solo developer's site:

- **Schema markup is excellent.** ProfessionalService + LocalBusiness combo in the Layout, Service schema on service pages, FAQPage schema on the automation page, Review schema with actual client reviews. This is better than most competitors.
- **HTML structure is solid.** Proper heading hierarchy (single H1 per page, logical H2/H3 nesting), semantic sections, skip-link for accessibility.
- **Astro is a great choice.** Static output, compressed HTML, Sharp image processing, sitemap integration, prefetching. The framework itself is an SEO advantage.
- **Security headers are comprehensive.** CSP, HSTS, X-Frame-Options. Better than 95% of small business sites.
- **Canonical URLs are implemented.** Correct, dynamic canonical tags on every page.
- **Open Graph and Twitter meta tags are present.** Every page has shareable metadata.
- **lang="en-GB" is set.** Correct for UK targeting.
- **Sitemap is configured with priorities.** Homepage at 1.0, services at 0.9, individual services at 0.8.

### Issues to Fix in the Rebuild

**Title Tags: Too Long and Inconsistent**
- Current format: `{title} | FWD Thinking Solutions` appends the brand to every page title
- Homepage becomes: "FWD Thinking Solutions - Web Development & Automation | FWD Thinking Solutions" (redundant)
- Service pages become: "Business Process Automation - FWD Thinking Solutions | FWD Thinking Solutions" (double brand)
- Fix: Use conditional logic. Homepage gets the brand as the title. Inner pages get `{title} | FWD` (shorter brand suffix)

**Meta Descriptions: Too Local**
- Homepage: "Professional web development and business automation in Norwich, Norfolk." (This limits national reach)
- Service pages lean heavily on Norfolk/Norwich. For UK-wide targeting, descriptions should lead with value and add location as secondary
- Fix: Rewrite all meta descriptions to target UK-wide intent first, with Norfolk as a trust signal rather than the primary positioning

**Keywords Meta Tag: Remove It**
- Google has officially ignored the keywords meta tag since 2009. It adds no SEO value and shows competitors what you are targeting
- Fix: Remove the keywords prop from Layout entirely

**Missing Pages for Key Keyword Clusters**
- No dedicated pricing/cost guide page (biggest informational keyword opportunity)
- No industry pages (empty /industries directory)
- No results/testimonials page (trust signals hidden on homepage only)
- No FAQ hub page (FAQs exist on automation page but not others)
- Fix: Add these pages to the new architecture

**Blog is Underweight**
- Only 4 case study posts. No informational content targeting top-of-funnel keywords
- Blog index and post template exist but the content volume is too low to build topical authority
- Fix: Content engine plan in Step 3

**Internal Linking is Weak**
- Service pages link to related services (good) but there is no cross-linking to relevant blog posts or industry pages
- Homepage links to portfolio and WhatsApp but not to individual service pages in the hero
- No contextual internal links within body copy
- Fix: Build an internal linking map into the new architecture

**Portfolio Page: Missed Opportunity**
- Single portfolio page rather than individual case study pages
- No schema markup on portfolio items
- Each portfolio project should be its own page, targeting industry-specific keywords
- Fix: Restructure portfolio into individual case study pages

**Google Business Profile and Local Citations**
- sameAs array in schema is empty (no social profiles or directory links)
- No Google Business Profile link visible
- Fix: Add all relevant profile URLs to sameAs

**Image Alt Text**
- Footer logo: `alt="FWD Thinking Solutions"` (good)
- Cannot verify other images from codebase alone, but the structure supports alt text

**Missing robots.txt**
- No robots.txt file found in the public directory
- Fix: Add a robots.txt pointing to the sitemap

---

## Part 2: New Site Architecture

### URL Structure

```
/                                           Homepage
/about                                      About Sam & FWD
/services                                   Services overview
/services/professional-websites             Website development service
/services/business-process-automation       Automation service
/services/custom-app-development            Custom apps service
/services/hosting-maintenance               Hosting & support (simplified URL)
/industries                                 Industries overview
/industries/equestrian                      Equestrian businesses
/industries/manufacturing                   Manufacturing & engineering
/industries/pet-services                    Pet services & grooming
/industries/trades-construction             Trades & construction
/industries/health-fitness                  Health & fitness
/industries/professional-services           Professional services
/industries/retail-ecommerce                Retail & ecommerce
/industries/technology-saas                 Technology & SaaS
/work                                       Portfolio / case studies hub
/work/[slug]                                Individual case studies
/blog                                       Blog index
/blog/[slug]                                Individual blog posts
/pricing                                    Transparent pricing guide
/contact                                    Contact page
/privacy-policy                             Privacy policy
```

**Changes from current:**
- `/portfolio` becomes `/work` (shorter, industry-standard)
- Individual case studies get their own pages under `/work/`
- `/industries` gets populated with lightweight landing pages
- `/pricing` is new (targets "how much does a website cost" keywords)
- `/services/reliable-hosting-maintenance` becomes `/services/hosting-maintenance` (cleaner URL)

### Page-Level SEO Specifications

---

#### Homepage `/`

**Target cluster:** Core brand + "web developer for small business UK"
**Title:** FWD Thinking Solutions | Web Developer for UK Businesses
**Meta description:** Web development, business automation, and custom apps for UK small businesses. One developer, no middlemen, transparent pricing. Based in Norwich, working UK-wide.
**H1:** One Developer. No Middlemen. (keep current; it's strong)
**Schema:** WebSite + Organization (already exists, enhance with sameAs)
**Internal links to:** All 4 service pages, /work, /pricing, /blog, /industries
**Content brief:** Hero with value prop, social proof bar (keep), services overview (keep), process section, testimonials (expand), blog preview, CTA

---

#### About `/about`

**Target cluster:** Trust + "Sam Fowler developer" + "web developer Norfolk"
**Title:** About Sam Fowler | FWD Thinking Solutions
**Meta description:** Meet Sam Fowler, the developer behind FWD Thinking Solutions. 14+ projects across 8+ industries. Based in Norwich, working with businesses across the UK.
**H1:** About FWD (keep current)
**Schema:** Person + Organization (enhance existing)
**Internal links to:** /services, /work, /contact, /pricing
**Content brief:** Personal story (more depth than current), why FWD exists (keep), values/approach, tech stack (keep), track record stats, CTA

---

#### Services Overview `/services`

**Target cluster:** "web development services UK" + "business automation services"
**Title:** Web Development & Automation Services | FWD
**Meta description:** Websites from £299, automation from £799, custom apps from £1,299. Fixed pricing, honest advice, and direct communication. See all services from FWD.
**H1:** Web Development & Automation Services (refine current)
**Schema:** ItemList (keep, enhance with more detail)
**Internal links to:** All 4 service pages, /pricing, /work
**Content brief:** Overview cards for each service (keep format), comparison to help visitors choose, pricing summary, CTA

---

#### Professional Websites `/services/professional-websites`

**Target cluster:** "affordable web developer UK" + "professional website small business"
**Title:** Professional Websites for Small Business | From £299 | FWD
**Meta description:** Fast, mobile-friendly websites for UK businesses. Fixed pricing from £299, built in 2 to 3 weeks. No templates, no subscriptions, you own everything.
**H1:** Professional Websites
**Schema:** Service + FAQPage + BreadcrumbList
**Internal links to:** /pricing, /work (relevant case studies), /services/hosting-maintenance, /blog (relevant posts)
**Content brief:** What's included, process, pricing tiers, FAQ, who this is for, case study snippets, CTA

---

#### Business Process Automation `/services/business-process-automation`

**Target cluster:** "business process automation UK small business" + "workflow automation"
**Title:** Business Process Automation | From £799 | FWD
**Meta description:** Automate invoicing, emails, data entry, and scheduling for your UK business. Custom automation from £799. See what can be automated and how much it costs.
**H1:** Business Process Automation
**Schema:** Service + FAQPage + BreadcrumbList (already strong, keep)
**Internal links to:** /pricing, /work (automation case studies), /blog (automation guides), /services/custom-app-development
**Content brief:** Current page is well-structured. Enhance with more specific automation examples, ROI figures, tool logos (n8n, Zapier, Make), case study snippets

---

#### Custom App Development `/services/custom-app-development`

**Target cluster:** "custom app development UK affordable" + "booking system developer"
**Title:** Custom App Development | From £1,299 | FWD
**Meta description:** Bespoke web and mobile apps for UK businesses. Booking systems, dashboards, internal tools. Fixed quotes from £1,299. Built by one developer who cares.
**H1:** Custom App Development
**Schema:** Service + FAQPage + BreadcrumbList
**Internal links to:** /pricing, /work (app case studies), /services/business-process-automation, /blog (app-related posts)
**Content brief:** Types of apps built, technology stack, process, pricing, FAQ, case study snippets, CTA

---

#### Hosting & Maintenance `/services/hosting-maintenance`

**Target cluster:** "website hosting and maintenance UK" + "managed website hosting small business"
**Title:** Website Hosting & Maintenance | From £99/month | FWD
**Meta description:** Reliable hosting with daily backups, security updates, and support for UK businesses. From £99/month. One point of contact for everything.
**H1:** Hosting & Maintenance
**Schema:** Service + FAQPage + BreadcrumbList
**Internal links to:** /pricing, /services/professional-websites, /contact
**Content brief:** What's included, why it matters, pricing tiers, FAQ, CTA

---

#### Industries Overview `/industries`

**Target cluster:** "web developer for [industry] UK"
**Title:** Industries We Work With | FWD Thinking Solutions
**Meta description:** Web development and automation for equestrian, manufacturing, pet services, trades, fitness, and more. See how FWD helps businesses in your industry.
**H1:** Industries We Work With
**Schema:** ItemList
**Internal links to:** All industry subpages, /services, /work
**Content brief:** Brief overview of each industry served, with links to dedicated pages. Light proof points for each.

---

#### Industry Pages `/industries/[slug]` (template)

**Target cluster:** "web developer for [industry] UK" + "[industry] business automation"
**Title:** Web Development for [Industry] | FWD Thinking Solutions
**Meta description:** Websites, apps, and automation built specifically for [industry] businesses in the UK. See how FWD helps [industry] companies work smarter.
**H1:** Web Development for [Industry] Businesses
**Schema:** Service (with industry-specific details)
**Internal links to:** Relevant service pages, relevant case studies in /work, /contact
**Content brief:** Industry-specific pain points (300 to 500 words), relevant services, specific examples of what FWD can build for this industry, relevant case study if available, CTA. Keep these lightweight but targeted.

---

#### Work / Case Studies Hub `/work`

**Target cluster:** "web developer portfolio UK" + brand terms
**Title:** Our Work | Web Development & Automation Projects | FWD
**Meta description:** Real projects, real results. See websites, apps, and automation FWD has built for UK businesses across 8+ industries.
**H1:** Our Work
**Schema:** ItemList (linking to individual case studies)
**Internal links to:** Individual case study pages, /services, /industries
**Content brief:** Filterable grid of project cards with industry tags, brief descriptions, and links to full case studies

---

#### Individual Case Studies `/work/[slug]`

**Target cluster:** Industry-specific long-tail + "[client industry] website case study"
**Title:** [Project Name] | [Industry] Case Study | FWD
**Meta description:** How FWD built [brief description] for [client]. See the process, the solution, and the results.
**H1:** [Project Name]
**Schema:** Article + BreadcrumbList
**Internal links to:** Relevant service page, relevant industry page, /work, /contact
**Content brief:** The brief, the solution, tech used, results/outcomes, client testimonial if available. Each case study is a content asset targeting industry keywords.

---

#### Pricing Guide `/pricing`

**Target cluster:** "how much does a website cost UK" + "web developer pricing"
**Title:** How Much Does a Website Cost? | Transparent Pricing | FWD
**Meta description:** Honest pricing for websites, automation, and custom apps in the UK. See exactly what you get at each price point. No hidden fees, no surprises.
**H1:** Transparent Pricing
**Schema:** FAQPage + BreadcrumbList
**Internal links to:** All service pages, /contact, /work
**Content brief:** This is a high-traffic target page. Pricing for each service with what's included, comparison table, FAQ about costs, "what affects the price" section, CTA. Updated regularly (add last-updated date for freshness signal).

---

#### Blog Index `/blog`

**Target cluster:** Broad informational intent across all clusters
**Title:** Blog | Web Development & Automation Insights | FWD
**Meta description:** Practical guides, case studies, and insights about web development, automation, and technology for UK businesses. Written by a developer, not a marketer.
**H1:** Blog
**Schema:** Blog
**Internal links to:** Individual posts (auto), /services, /work
**Content brief:** Filterable by category (case studies, guides, automation, web development). Pagination. Featured post at top.

---

#### Blog Posts `/blog/[slug]`

**Target cluster:** Varies per post (see Content Strategy)
**Title:** [Post Title] | FWD Blog
**Meta description:** [Custom per post, 150 to 160 characters]
**H1:** [Post Title]
**Schema:** BlogPosting + BreadcrumbList
**Internal links to:** Relevant service pages, relevant case studies, related blog posts
**Content brief:** See Content Strategy document for the full editorial plan

---

#### Contact `/contact`

**Target cluster:** "contact web developer UK" + "web developer Norfolk"
**Title:** Get in Touch | FWD Thinking Solutions
**Meta description:** Contact FWD Thinking Solutions for web development, automation, or custom apps. Based in Norwich, working UK-wide. WhatsApp, email, or contact form.
**H1:** Get in Touch
**Schema:** ContactPage
**Internal links to:** /services, /pricing, /work
**Content brief:** Contact form, WhatsApp link, email, expected response time, brief reassurance copy ("no sales pitch, just a conversation about what you need")

---

### Schema Markup Plan

#### Site-Wide (in Layout)

**Organization + LocalBusiness** (already exists, enhance):
- Add sameAs with Google Business Profile, any social profiles, directory listings
- Ensure telephone property is added
- Add contactPoint with WhatsApp and email

**WebSite** (add to homepage only):
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "FWD Thinking Solutions",
  "url": "https://f-w-d.co.uk",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://f-w-d.co.uk/blog?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**BreadcrumbList** (all inner pages):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://f-w-d.co.uk" },
    { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://f-w-d.co.uk/services" },
    { "@type": "ListItem", "position": 3, "name": "Business Process Automation" }
  ]
}
```

#### Per-Page Schema

| Page | Schema Types |
|------|-------------|
| Homepage | WebSite, Organization/LocalBusiness |
| About | Person, Organization |
| Services overview | ItemList |
| Each service page | Service, FAQPage, BreadcrumbList |
| Industries overview | ItemList |
| Each industry page | Service, BreadcrumbList |
| Work hub | ItemList |
| Each case study | Article, BreadcrumbList |
| Pricing | FAQPage, BreadcrumbList |
| Blog index | Blog |
| Each blog post | BlogPosting, BreadcrumbList |
| Contact | ContactPage |

---

### Internal Linking Strategy

**Pillar pages** (highest authority, most important):
1. Homepage
2. /services (hub)
3. /work (hub)
4. /pricing
5. /blog (hub)

**Linking rules:**
- Every service page links to its relevant industry pages and case studies
- Every industry page links to relevant services and case studies
- Every case study links back to the relevant service and industry
- Every blog post contains at least 2 contextual internal links to service or pricing pages
- The pricing page links to every service page
- Footer contains links to all pillar pages and all service pages (already does)

**Click depth targets:**
- Homepage to any page: maximum 3 clicks
- Service page to relevant case study: 1 click
- Blog post to relevant service: 1 click (via contextual link)
- Industry page to contact: 1 click

---

### Technical Specification for the Build

**Performance Targets:**
- LCP: under 2.5 seconds
- INP: under 200 milliseconds
- CLS: under 0.1
- Lighthouse performance score: 90+
- Lighthouse accessibility score: 95+
- Lighthouse SEO score: 100

**Image Handling:**
- WebP format with JPEG/PNG fallbacks via Astro's Image component
- Lazy loading on all images below the fold
- Explicit width/height attributes to prevent CLS
- Responsive srcset for key breakpoints (640, 768, 1024, 1280)
- Hero images: preloaded
- Max file size target: 100KB for content images, 200KB for hero images

**Font Loading:**
- Use font-display: swap to prevent invisible text
- Preload the primary font weight (400 and 700)
- Consider system font stack as primary with web fonts as progressive enhancement
- Subset fonts if using Google Fonts (Latin only)

**Caching Strategy:**
- Static assets (JS, CSS, images): Cache-Control max-age=31536000 (1 year) with content hashing
- HTML pages: Cache-Control max-age=3600, must-revalidate
- Service worker for offline capability (optional, PWA enhancement)

**Accessibility Baseline:**
- WCAG 2.1 AA compliance minimum
- Skip link (already exists)
- Proper heading hierarchy (already enforced)
- Focus indicators on all interactive elements
- Colour contrast ratio minimum 4.5:1 for text
- All images have meaningful alt text
- Form labels properly associated
- Keyboard navigable throughout

**Analytics Setup:**
- Google Analytics 4 (or privacy-friendly alternative like Plausible/Fathom)
- Track: page views, WhatsApp clicks, contact form submissions, CTA clicks, blog reading depth
- Conversion goals: WhatsApp message initiated, contact form submitted, pricing page visited

**robots.txt:**
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://f-w-d.co.uk/sitemap-index.xml
```

**Sitemap:**
- Auto-generated by Astro sitemap integration (already configured)
- Include all public pages
- Exclude /privacy-policy from priority (already set to 0.3)
- Add industry pages and case study pages to sitemap config with appropriate priorities:
  - Industry pages: 0.7
  - Case study pages: 0.6
  - Pricing page: 0.9

---

### Implementation Notes for the Build

1. **Remove the keywords meta tag.** Delete the keywords prop from Layout.astro entirely. It provides no SEO value.

2. **Fix the title tag duplication.** The current template appends "| FWD Thinking Solutions" to everything, creating redundancy on the homepage. Use conditional logic: if homepage, just use the title prop; if inner page, append "| FWD" (shorter suffix).

3. **Add a robots.txt** to the public directory.

4. **The sameAs array is empty** in the Organization schema. Populate this with Google Business Profile URL and any social profiles.

5. **Add telephone to schema.** The phone number is used throughout the site but not in the structured data contact properties.

6. **FAQPage schema should be on every service page,** not just automation. The other service pages need FAQ sections added.

7. **BreadcrumbList schema needs to be dynamic.** The current Breadcrumbs component renders visually but does not include the corresponding JSON-LD. Add BreadcrumbList schema that mirrors the visual breadcrumbs.

8. **Blog post schema should use BlogPosting,** not just Article. Include author, datePublished, dateModified, and image properties.

9. **The industries directory exists but is empty.** This needs to be populated with the lightweight landing pages as specified above.

10. **Portfolio restructure** from a single page to a hub (/work) with individual case study pages is the biggest structural change. The existing MDX blog posts for case studies could be moved or cross-linked.

11. **Pricing page is entirely new** and should be treated as a pillar page given its keyword potential.
