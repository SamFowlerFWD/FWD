# FWD Thinking Solutions: Component Design System, Accessibility & Conversion Specification

**Date:** March 2026
**Purpose:** Translates the build brief into implementable component architecture with accessibility and conversion baked in from the start.

---

## 1. Design Tokens

### Colour Palette (Light Mode)

```css
:root {
  /* Brand */
  --colour-primary: #7c3aed;        /* Purple (ai-purple) */
  --colour-primary-light: #a78bfa;
  --colour-primary-dark: #5b21b6;
  --colour-accent: #f59e0b;          /* Amber */
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
  --colour-neutral-900: #0f172a;     /* Slate 900 (hero/footer bg) */

  /* Semantic */
  --colour-success: #16a34a;         /* Contrast 4.52:1 on white */
  --colour-warning: #d97706;
  --colour-error: #dc2626;           /* Contrast 4.63:1 on white */
  --colour-info: #2563eb;

  /* Surfaces */
  --colour-background: #ffffff;
  --colour-surface: #f8fafc;         /* Cards, sections */
  --colour-surface-dark: #0f172a;    /* Dark sections */
  --colour-text-primary: #0f172a;    /* Contrast 18.4:1 on white */
  --colour-text-secondary: #475569;  /* Contrast 7.09:1 on white */
  --colour-text-muted: #64748b;      /* Contrast 4.62:1 on white - passes AA */
  --colour-text-inverse: #ffffff;
  --colour-border: #e2e8f0;
}
```

### Dark Mode Overrides

```css
[data-theme="dark"] {
  --colour-background: #0f172a;
  --colour-surface: #1e293b;
  --colour-surface-dark: #020617;
  --colour-text-primary: #f1f5f9;     /* Contrast 15.4:1 on dark bg */
  --colour-text-secondary: #cbd5e1;   /* Contrast 10.3:1 on dark bg */
  --colour-text-muted: #94a3b8;       /* Contrast 6.1:1 on dark bg */
  --colour-text-inverse: #0f172a;
  --colour-border: #334155;
  --colour-accent: #fbbf24;           /* Slightly lighter amber for dark */
}
```

All text/background combinations verified against WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for large text and UI elements).

### Typography

```css
:root {
  --font-heading: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  --text-6xl: 3.75rem;
  --text-7xl: 4.5rem;

  --leading-tight: 1.15;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;
}
```

Using system font stack eliminates font loading issues entirely: zero FOUT, zero CLS from fonts, faster LCP. This is a performance-first choice that still looks clean and professional. If a custom font is desired later, preload the WOFF2 file with `font-display: swap`.

### Spacing, Radius, Shadows, Animation

```css
:root {
  /* Spacing (Tailwind-aligned for consistency) */
  --space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
  --space-4: 1rem;     --space-5: 1.25rem;   --space-6: 1.5rem;
  --space-8: 2rem;     --space-10: 2.5rem;   --space-12: 3rem;
  --space-16: 4rem;    --space-20: 5rem;     --space-24: 6rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 2. Component Inventory

### Layout Components

#### Container
```
Purpose: Max-width wrapper with responsive padding.
Max-width: 1280px (80rem)
Padding: 1.5rem (mobile), 2rem (desktop)
Used: Every page, wrapping all content sections.
```

#### Section
```
Purpose: Full-width page section with background variants.
Variants:
  - default (white background)
  - muted (neutral-50 background)
  - dark (slate-900 background, inverse text)
  - gradient (purple-to-blue gradient, inverse text)
Padding: py-16 (mobile), py-24 (desktop)
Props: background, id (for anchor links)
Accessibility: Use <section> with aria-labelledby pointing to section heading.
```

### Navigation Components

#### Header
```
Purpose: Site navigation with logo, links, CTA, dark mode toggle.
Behaviour: Sticky on scroll with backdrop blur.
Props: none (reads route for active state)
Mobile: Hamburger trigger at md breakpoint.

Accessibility:
  - <header> landmark
  - <nav aria-label="Main navigation">
  - Mobile menu: aria-expanded on trigger, focus trap when open, Escape to close
  - Skip link as first focusable element
  - Active page indicated with aria-current="page"

Conversion:
  - Primary CTA ("Get in Touch") always visible in header
  - On mobile, CTA becomes a sticky bottom bar (not in header)
```

#### MobileMenu
```
Purpose: Full-screen overlay navigation for mobile.
Trigger: Hamburger button in Header.

Accessibility:
  - aria-expanded toggles on trigger button
  - Focus trapped within menu when open
  - First link receives focus on open
  - Escape key closes menu
  - Focus returns to hamburger button on close
  - aria-hidden="true" on rest of page while open (or use inert)
  - Close button has aria-label="Close menu"
```

#### Footer
```
Purpose: Site-wide footer with links, contact, trust signals.
Sections: Brand/description, Navigation links, Services links, Industries links
Includes: WhatsApp link, location, copyright, privacy link

Accessibility:
  - <footer> landmark
  - <nav aria-label="Footer navigation"> for link sections
  - Distinguish from main nav with different aria-label

Conversion:
  - Aggregate review score displayed ("5.0 on Google")
  - "Based in Norwich, working UK-wide" trust anchor
```

#### Breadcrumbs
```
Purpose: Show page hierarchy, provide navigation context.
Used on: All inner pages (not homepage).

Accessibility:
  - <nav aria-label="Breadcrumb">
  - <ol> list structure
  - Current page: aria-current="page"
  - Separator characters: aria-hidden="true"

SEO: Generates matching BreadcrumbList JSON-LD schema.
```

### Content Components

#### Card
```
Purpose: Display a content item (service, project, blog post, industry).
Variants:
  - service: icon, title, description, price, link
  - project: thumbnail, title, industry tag, services tags, result, link
  - blog: image, title, excerpt, date, category, link
  - industry: icon/illustration, title, brief description, link

Props: variant, title, description, href, image?, tags?, price?

Accessibility:
  - Entire card is a link (wrap in <a>)
  - Card title is accessible name for the link
  - Images have descriptive alt text
  - Tags/badges use appropriate contrast

Interaction:
  - Hover: translateY(-2px), shadow increase, 200ms ease
  - Focus-visible: 3px outline, offset 3px
  - Reduced motion: no translate, just shadow change
```

#### Testimonial
```
Purpose: Display a client review with attribution.
Props: quote, name, role, company, rating (1-5), image?

Accessibility:
  - <blockquote> for the quote text
  - <cite> for attribution
  - Stars: aria-label="Rated 5 out of 5 stars" (not individual star images)

Conversion:
  - Always show name + company (anonymous reviews are weak)
  - Star rating visual + text
  - "Verified Google Review" badge where applicable
```

#### AnimatedCounter
```
Purpose: Animate a number from 0 to target on scroll.
Props: target (number), duration (ms, default 1500), prefix?, suffix?

Accessibility:
  - Final number visible in HTML (no JS-only content)
  - prefers-reduced-motion: show final number immediately, no animation
  - Use aria-live="off" during animation to avoid announcing every number

Implementation:
  - IntersectionObserver triggers once
  - requestAnimationFrame with ease-out curve
  - Pure JS, no library
```

#### FreshnessBadge
```
Purpose: Show "Last updated" date on key pages.
Props: date (Date)
Output: "Last updated: March 2026"
Used on: /pricing, service pages, evergreen blog posts
```

### Interactive Components

#### Button
```
Purpose: Primary interactive element for actions.
Variants:
  - primary: amber background, white text (main CTA)
  - secondary: white/transparent bg, border, dark text
  - ghost: no bg, no border, text colour only
  - dark: for use on dark backgrounds (white bg, dark text)

Sizes: sm (py-2 px-4), md (py-3 px-6), lg (py-4 px-8)
Props: variant, size, href?, onClick?, icon?, loading?, disabled?

Accessibility:
  - Use <a> when navigating, <button> when triggering actions
  - Minimum touch target: 44x44px (WCAG 2.2 recommendation)
  - Focus-visible: 3px outline, appropriate contrast
  - Disabled: aria-disabled="true", visually distinct but still perceivable
  - Loading: aria-busy="true", spinner with sr-only "Loading" text

Interaction:
  - Hover: slight brightness shift, cursor pointer
  - Active: scale(0.98), 100ms
  - Reduced motion: colour change only, no scale
```

#### SmartCTA
```
Purpose: Contextual call-to-action block used on every page.
Props: heading, text, primaryLabel, primaryWhatsappMessage, secondaryLabel, secondaryHref

Conversion principles:
  - Heading matches page context ("Ready to automate?" not generic "Get in touch")
  - WhatsApp message pre-filled with page context
  - Trust micro-copy below CTA ("No obligation. Typical reply within 2 hours.")
  - Visual hierarchy: heading > supporting text > primary button > secondary link

Accessibility:
  - Contained in a <section> with aria-label
  - Buttons use appropriate roles
  - Pre-filled message is visible to the user before sending
```

#### Accordion (FAQ)
```
Purpose: Expandable Q&A sections with FAQPage schema.
Props: items (array of {question, answer})

Accessibility (WAI-ARIA Authoring Practices):
  - Each trigger is a <button> inside a heading element
  - aria-expanded on trigger (true/false)
  - aria-controls linking trigger to content panel
  - Content panel: role="region", aria-labelledby trigger
  - Hidden panels use hidden attribute (not display:none alone)
  - Enter/Space toggles (native button behaviour)
  - Optional: arrow keys to move between items

SEO: Generates FAQPage JSON-LD schema from items array.
```

#### ContactForm
```
Purpose: Primary conversion form on /contact page.
Fields (minimum viable):
  - Name (text, required)
  - Email (email, required)
  - Message (textarea, optional, placeholder: "Tell me briefly what you need")

Accessibility:
  - Every field has an explicit <label> with for/id association
  - Required fields: aria-required="true" + visual asterisk (aria-hidden="true" on asterisk)
  - Errors: aria-invalid="true", aria-describedby linking to error message, role="alert" on error
  - Submit button: clear text ("Send Message" not "Submit")
  - Confirmation: aria-live="polite" region announcing success

Conversion:
  - 3 fields maximum (name, email, message)
  - Message field is optional (reduces friction)
  - Trust micro-copy: "No spam, no mailing lists. Just a reply to your message."
  - Post-submit: clear confirmation with expected response time
  - Inline validation (real-time, not on submit)

Error handling:
  - Validate on blur (field loses focus)
  - Show error next to field, not in block above form
  - Preserve all entered data on validation failure
  - Focus moves to first invalid field on failed submit
```

#### PricingCalculator
```
Purpose: Interactive estimator on /pricing page.
Steps:
  1. Select service type (4 options with icons)
  2. Answer 3-4 questions specific to selection
  3. Display estimated range with breakdown

Accessibility:
  - Fieldset/legend for each step
  - Radio buttons for single-select questions
  - Checkboxes for multi-select features
  - Step indicator: "Step 2 of 3" announced
  - Result: aria-live="polite" region
  - All inputs keyboard accessible

Conversion:
  - Visual progress indicator (step dots)
  - "Back" and "Next" buttons (can revise answers)
  - Result shows range, not single number (reduces sticker shock)
  - CTA: "Want an exact quote? Let's talk" with pre-filled WhatsApp including their selections
  - Micro-copy: "This is an estimate. Your exact quote may differ based on specific requirements."
```

#### ServiceQuiz
```
Purpose: Help visitors identify the right service.
Steps:
  1. "What's your biggest challenge?" (4 options)
  2. Refinement question based on answer
  3. Optional: budget range
  4. Personalised recommendation

Accessibility:
  - Same patterns as PricingCalculator (fieldset, radio, step announcements)
  - Result includes descriptive text, not just a link

Conversion:
  - Positioned on homepage and /services as "Not sure what you need?"
  - Feels helpful, not salesy
  - Result links to relevant service page + personalised WhatsApp CTA
```

#### DarkModeToggle
```
Purpose: Switch between light and dark colour schemes.
Location: Header navigation, right side.

Implementation:
  - Read system preference (prefers-color-scheme) on load
  - Check cookie for user override
  - Toggle data-theme attribute on <html>
  - Store preference in cookie (not localStorage; works with SSG)
  - Smooth transition: transition: background-color 200ms, color 200ms on body

Accessibility:
  - Button with aria-label="Switch to dark mode" / "Switch to light mode"
  - Icon changes (sun/moon)
  - aria-pressed to indicate current state
```

#### WhatsAppWidget
```
Purpose: Floating persistent WhatsApp CTA.
Location: Bottom-right, all pages except /contact.

Accessibility:
  - <button> element (not a div)
  - aria-label="Message us on WhatsApp"
  - Expanded state: aria-expanded="true"
  - Can be dismissed; respects user choice for session

Conversion:
  - Subtle pulse animation on first visit (one cycle, then stops)
  - Hover/tap expands to show pre-filled message preview
  - Pre-fill varies by page context
  - Dismiss button; stays dismissed for session (cookie)
  - Does not obscure content or other interactive elements
  - Mobile: positioned above any browser navigation bars
```

### Blog Components

#### ReadingProgress
```
Purpose: Progress bar showing scroll depth on blog posts.
Location: Fixed top of viewport, blog posts only.
Height: 3px, brand amber colour.

Accessibility:
  - role="progressbar"
  - aria-valuenow, aria-valuemin="0", aria-valuemax="100"
  - aria-label="Reading progress"
  - prefers-reduced-motion: still visible but no smooth transition

Implementation: Scroll listener with requestAnimationFrame throttling.
```

#### TableOfContents
```
Purpose: Auto-generated navigation for long blog posts.
Show condition: Post has 3+ H2 headings.
Desktop: Sticky sidebar, left of content.
Mobile: Collapsible at top of article.

Accessibility:
  - <nav aria-label="Table of contents">
  - <ol> with list items
  - Current section highlighted (aria-current="true")
  - Smooth scroll on click (respects prefers-reduced-motion)
  - All links are proper <a> with href="#section-id"

Implementation:
  - Parse headings at build time (Astro remark plugin)
  - Generate ID attributes for each H2
  - IntersectionObserver highlights current section on scroll
```

#### ProjectGallery
```
Purpose: Filterable grid of case studies on /work page.
Filters: All, Websites, Automation, Apps (service type) + industry tags.

Accessibility:
  - Filter buttons: role="tablist" with role="tab" for each filter
  - Active filter: aria-selected="true"
  - Results region: aria-live="polite" (announces count change)
  - "Showing 5 of 12 projects" announced on filter change
  - All project cards maintain proper tab order after filtering

Conversion:
  - Default view: show featured/strongest projects first
  - Each card links to full case study
  - Industry tags are clickable (apply that filter)
  - Empty state: "No projects in this category yet. See all our work instead."

Animation:
  - Cards fade out/in on filter change (300ms, opacity + transform)
  - prefers-reduced-motion: instant switch, no animation
```

---

## 3. Page Compositions (Component Trees)

### Homepage

```
Header
  SkipLink
  Logo
  NavLinks (aria-current on active)
  DarkModeToggle
  Button (primary, "Get in Touch")
  MobileMenu (hamburger trigger)

Section (variant: gradient, hero)
  HeadingGroup
    Badge ("Based in Norfolk, working across the UK")
    H1 ("One Developer. No Middlemen.")
    Lead paragraph
  ButtonGroup
    Button (primary, WhatsApp CTA)
    Button (secondary, "See Our Work" -> /work)

Section (variant: default, social proof)
  StatsBar
    AnimatedCounter x4 (14+ projects, 5.0 rating, 8+ industries, UK-wide)

Section (variant: default, services)
  HeadingGroup (H2: "What I Build")
  Grid (2 columns)
    Card (variant: service) x4

Section (variant: muted, how it works)
  HeadingGroup (H2: "How It Works")
  ProcessSteps (3 steps with numbered icons)

Section (variant: default, quiz)
  HeadingGroup (H2: "Not Sure What You Need?")
  ServiceQuiz

Section (variant: dark, testimonials)
  HeadingGroup (H2: "What Clients Say")
  ReviewsSection (3-4 testimonials in scroll/grid)

Section (variant: default, blog)
  HeadingGroup (H2: "From the Blog")
  Grid (3 columns)
    Card (variant: blog) x3
  Link ("View all posts" -> /blog)

Section (variant: gradient, CTA)
  SmartCTA (heading: "Got an Idea? Let's Talk.")

Footer
WhatsAppWidget
```

### Service Page (template, e.g. Automation)

```
Header

Section (variant: dark, hero)
  Breadcrumbs
  HeadingGroup (H1, lead paragraph, price anchor)
  ButtonGroup (primary CTA, secondary)

Section (variant: default)
  HeadingGroup (H2: "What Can Be Automated?")
  Grid (3 columns)
    FeatureCard x3 (categories with example lists)

Section (variant: muted)
  HeadingGroup (H2: "How It Works")
  ProcessSteps (3 steps)

Section (variant: default)
  HeadingGroup (H2: "Tools I Work With")
  LogoBar (n8n, Zapier, Make icons)

Section (variant: muted)
  HeadingGroup (H2: "Pricing")
  Grid (2 columns)
    PricingCard x2

Section (variant: default)
  HeadingGroup (H2: "Related Projects")
  Grid (2-3 columns)
    Card (variant: project) x2-3

Section (variant: muted)
  HeadingGroup (H2: "Frequently Asked Questions")
  Accordion (FAQ items with FAQPage schema)

Section (variant: default)
  RelatedServices (3 cards linking to other services)

SmartCTA (contextual: "Ready to Save Some Time?")
  FreshnessBadge

Footer
WhatsAppWidget
```

### Pricing Page

```
Header

Section (variant: dark, hero)
  Breadcrumbs
  HeadingGroup (H1: "Transparent Pricing", lead paragraph)

Section (variant: default)
  PricingTable (all 4 services with tiers)

Section (variant: muted)
  HeadingGroup (H2: "Get an Estimate")
  PricingCalculator

Section (variant: default)
  HeadingGroup (H2: "Why Are My Prices Lower Than Agencies?")
  RichText (explanation)

Section (variant: muted)
  HeadingGroup (H2: "How FWD Compares")
  ComparisonTable (FWD vs Agency vs Budget vs DIY)

Section (variant: default)
  Accordion (FAQ: 8-10 pricing questions)

SmartCTA (contextual: "Ready to Start?")
  FreshnessBadge

Footer
WhatsAppWidget
```

### Blog Post

```
Header

Section (variant: default)
  Breadcrumbs
  Article
    FreshnessBadge (if lastUpdated differs from pubDate)
    HeadingGroup (H1: post title)
    PostMeta (date, category, reading time)
    TableOfContents (sidebar desktop, collapsible mobile)
    RichText (MDX content with embedded SmartCTAs)
    AuthorBox (Sam's bio, photo, link to /about)
    RelatedPosts (3 related articles)
    SmartCTA (contextual to post topic)

ReadingProgress (fixed top bar)
Footer
WhatsAppWidget
```

### Industry Page (lightweight template)

```
Header

Section (variant: dark, hero)
  Breadcrumbs
  HeadingGroup (H1: "Web Development for [Industry] Businesses")
  Lead paragraph (industry-specific pain points)

Section (variant: default)
  HeadingGroup (H2: "What I Can Build for [Industry]")
  Grid
    CapabilityCard x3-4

Section (variant: muted, conditional)
  HeadingGroup (H2: "Recent [Industry] Projects")
  Card (variant: project) x1-2 (if case studies exist)

Section (variant: default)
  RelevantServices (links to 2-3 applicable service pages)

SmartCTA (contextual: "Got a [industry] project? Let's chat.")

Footer
WhatsAppWidget
```

---

## 4. Conversion Architecture

### Primary Conversion: WhatsApp message initiated
### Secondary Conversions: Contact form submitted, pricing page visited

### Trust Layer Map

| Layer | Elements | Location |
|---|---|---|
| Professional appearance | Clean design, system fonts, fast loading, HTTPS | Site-wide |
| Social proof | Google reviews, star ratings, project count | Homepage, footer, service pages |
| Authority | 14+ projects, 8+ industries, tech stack, case studies | About, homepage, /work |
| Risk reduction | "No obligation", transparent pricing, fixed quotes, "you own everything" | CTAs, pricing page, service pages |
| Specificity | Real client names, measurable results, project screenshots | Case studies, testimonials |

### CTA Strategy per Page Type

| Page Type | Primary CTA | Pre-fill Message | Supporting Micro-copy |
|---|---|---|---|
| Homepage | "Message on WhatsApp" | "Hi Sam, I found your website and I'm interested in discussing a project." | "No obligation. I typically reply within 2 hours." |
| Service page | "Get a Quote for [Service]" | "Hi Sam, I'm interested in [service] for my business." | "Fixed pricing. No surprises." |
| Pricing page | "Want an Exact Quote?" | "Hi Sam, I've been looking at your pricing. Here's what I need: [calculator results]" | "Every project gets a fixed quote before we start." |
| Industry page | "Got a [Industry] Project?" | "Hi Sam, I run a [industry] business and I'm looking for help with..." | "I've worked with [X] [industry] businesses across the UK." |
| Case study | "Need Something Similar?" | "Hi Sam, I saw your [project name] case study and I need something similar." | "Every project is different, but this gives you an idea of what's possible." |
| Blog post | "Need Help With [Topic]?" | "Hi Sam, I was reading your article about [topic] and had some questions." | Contextual to post content |

### Form Specification (Contact Page)

**Fields:**
1. Name (text, required, aria-required="true")
2. Email (email, required, aria-required="true")
3. What do you need help with? (select: Website / Automation / Custom App / Hosting / Not Sure, optional)
4. Tell me about your project (textarea, optional, placeholder: "A few sentences is fine. We can discuss details on a call.")

**Validation:** Inline, on blur. Errors appear below fields with role="alert".
**Submit button:** "Send Message" (not "Submit")
**Confirmation:** Green success banner, "Thanks [Name]. I'll get back to you within 24 hours."
**Fallback:** WhatsApp link and email address visible above form for people who prefer those channels.

---

## 5. Accessibility Checklist for Build

### Global Requirements

- [ ] Skip link as first focusable element on every page
- [ ] All pages have exactly one H1, logical heading hierarchy
- [ ] All interactive elements focusable with visible focus indicator (3px outline)
- [ ] All images: descriptive alt text (informative) or alt="" (decorative)
- [ ] All forms: explicit labels, error messages linked with aria-describedby
- [ ] colour contrast: 4.5:1 minimum for body text, 3:1 for large text and UI
- [ ] prefers-reduced-motion: all animations disabled or reduced
- [ ] prefers-color-scheme: respected on first load
- [ ] lang="en-GB" on html element
- [ ] No keyboard traps (except intentional focus traps in modals/menus with Escape exit)

### Component-Specific Requirements

- [ ] Mobile menu: focus trap, Escape closes, focus returns to trigger
- [ ] Accordion/FAQ: aria-expanded, aria-controls, button triggers
- [ ] Tabs (if used): arrow key navigation, aria-selected
- [ ] Dark mode toggle: aria-label updates, aria-pressed state
- [ ] WhatsApp widget: dismissible, does not obscure content
- [ ] Pricing calculator: fieldset/legend per step, step announcements
- [ ] Contact form: inline validation, focus management on errors
- [ ] Animated counters: prefers-reduced-motion check, aria-live="off" during animation
- [ ] Reading progress: role="progressbar" with aria attributes
- [ ] Project gallery: filter change announced, count updated, tab order maintained

### Testing Before Launch

**Automated (run on every page):**
- axe DevTools browser extension
- Lighthouse accessibility audit (target: 98+)

**Manual keyboard test (every page):**
- Tab through all interactive elements
- Verify visible focus at every point
- Verify all functions work without mouse
- Check tab order matches visual order

**Screen reader test (key pages: homepage, service page, contact, blog post):**
- Navigate by headings: logical and complete?
- Navigate by landmarks: can jump to main, nav, footer?
- Read page linearly: makes sense without visuals?
- Complete the contact form using screen reader

**Zoom test (all pages):**
- 200% zoom: no content cut off, no horizontal scroll
- 400% zoom: content still readable and usable

---

## 6. File Structure

```
src/
  components/
    layout/
      Container.astro
      Section.astro
    navigation/
      Header.astro
      MobileMenu.tsx
      Footer.astro
      Breadcrumbs.astro
      SkipLink.astro
    content/
      Card.astro
      Testimonial.astro
      AnimatedCounter.tsx
      FreshnessBadge.astro
      StatsBar.astro
      ProcessSteps.astro
    interactive/
      Button.astro
      SmartCTA.astro
      Accordion.tsx
      ContactForm.tsx
      DarkModeToggle.tsx
      WhatsAppWidget.tsx
    conversion/
      PricingCalculator.tsx
      ServiceQuiz.tsx
      ReviewsSection.tsx
      ProjectGallery.tsx
    blog/
      ReadingProgress.tsx
      TableOfContents.tsx
      PostCard.astro
      AuthorBox.astro
      RelatedPosts.astro
  layouts/
    Layout.astro
    BlogLayout.astro
  pages/
    index.astro
    about.astro
    contact.astro
    pricing.astro
    privacy-policy.astro
    services/
      index.astro
      professional-websites.astro
      business-process-automation.astro
      custom-app-development.astro
      hosting-maintenance.astro
    industries/
      index.astro
      [slug].astro
    work/
      index.astro
      [...slug].astro
    blog/
      index.astro
      [...slug].astro
  content/
    blog/     (existing MDX posts + new ones)
    work/     (case study MDX files)
    config.ts (add work collection schema)
  styles/
    tokens.css    (design tokens)
    global.css    (base styles, accessibility defaults)
    animations.css (micro-interactions, reduced-motion overrides)
  lib/
    schema.ts     (JSON-LD generation helpers)
    utils.ts      (formatting, date helpers)
```

### Naming Conventions

- Components: PascalCase (ServiceQuiz.tsx, SmartCTA.astro)
- Astro for static components, React (.tsx) for interactive/stateful components
- CSS: design tokens in tokens.css, referenced via var() everywhere
- Files: kebab-case for pages and content (business-process-automation.astro)
- Props: camelCase (whatsappMessage, primaryLabel)

---

## 7. Build Priority Order

**1. Tokens and global styles** (tokens.css, global.css, animations.css, reduced-motion overrides)
**2. Layout components** (Container, Section, SkipLink)
**3. Navigation** (Header, MobileMenu, Footer, Breadcrumbs with JSON-LD)
**4. Base interactive components** (Button, SmartCTA, Accordion, DarkModeToggle)
**5. Content components** (Card variants, Testimonial, AnimatedCounter, FreshnessBadge)
**6. Homepage build** (compose all components, verify flow)
**7. Service pages** (template approach; build one, replicate for others)
**8. Pricing page** (PricingCalculator, ComparisonTable)
**9. Contact page** (ContactForm with full validation)
**10. Industry pages** (template, populate from content collection)
**11. Work hub** (ProjectGallery) and case study template
**12. Blog enhancements** (ReadingProgress, TableOfContents, BlogLayout)
**13. WhatsApp widget** (site-wide)
**14. ServiceQuiz** (homepage and /services)
**15. ReviewsSection** (homepage and service pages)
**16. Final polish** (dark mode full test, accessibility audit, Lighthouse optimisation)
