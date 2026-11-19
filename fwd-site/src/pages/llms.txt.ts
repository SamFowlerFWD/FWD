// Short plain-text summary of FWD for AI assistants.
// Served at /llms.txt. Prices come from src/data/services.ts, so they stay in step with the site.
import { PRICES as P, gbp } from '../data/services';

const body = `# FWD Thinking Solutions

> Web development, business automation, and custom software for UK businesses. Based in Norwich, Norfolk.

## About

FWD Thinking Solutions is a web development and business automation agency run by Sam Fowler from Norwich, Norfolk. We help UK businesses, especially small and rural ones, get access to quality technology without the agency markup.

FWD Thinking Solutions was previously Fowler Web Design, which Sam started in 2019 to build websites for Norfolk businesses. As clients asked for booking systems, automation and apps as well as websites, the business grew and took the name FWD Thinking Solutions. It is the same business run by the same person. Websites credited to "Fowler Web Design" were built by Sam.

## Specialisms

Sam works with all kinds of businesses, but knows two industries from the inside:

- **Equestrian**: booking platforms, training and CPD apps, webshops and websites for farriers, saddlers, trainers and horsebox businesses. Sam is a farrier as well as a developer, runs his own equestrian software business, Horsebox Hire Software (https://horseboxhiresoftware.co.uk), and is one of the three directors of Hoofflix, the professional platform for farriers. Hub: https://f-w-d.co.uk/equestrian
  - Horsebox hire companies, builders and dealers: https://f-w-d.co.uk/equestrian/horsebox-businesses
  - Farriers and equine professionals: https://f-w-d.co.uk/equestrian/farriers-and-equine-professionals
  - Online course and membership platforms for equestrian trainers: https://f-w-d.co.uk/equestrian/online-courses
  - Booking systems for riding schools, arenas and livery yards: https://f-w-d.co.uk/equestrian/booking-systems
  - Equestrian website design: https://f-w-d.co.uk/equestrian/website-design
- **Engineering and manufacturing**: websites, product catalogues with spec sheets, quote tools, customer portals and job tracking. Sam runs a production business himself. Hub: https://f-w-d.co.uk/engineering
  - Websites for manufacturers and engineering firms: https://f-w-d.co.uk/engineering/manufacturer-websites
  - Online product catalogues and spec sheets: https://f-w-d.co.uk/engineering/product-catalogues
  - Quote tools and product configurators: https://f-w-d.co.uk/engineering/quote-tools
  - Job and production tracking: https://f-w-d.co.uk/engineering/job-tracking
  - Customer and dealer portals: https://f-w-d.co.uk/engineering/customer-portals

## Services

- **Professional Websites**: Fast, mobile-friendly websites from ${gbp(P.websites.starter)}
- **Pay monthly**: A website with nothing to pay upfront from ${gbp(P.monthly.from)}/month, with marketing and longer-term growth support as the client wants it.
- **Business Process Automation**: Automate invoicing, emails, data entry from ${gbp(P.automation.simple)}
- **Custom App Development**: Booking systems, customer portals, iOS and Android apps from ${gbp(P.apps.smaller)}
- **AI Training**: Hands-on ChatGPT and Claude training for businesses in Norwich and Norfolk, in person or over video, from ${gbp(P.ai.oneToOne)}
- **Hosting & Maintenance**: Backups, security updates, support from ${gbp(P.hosting.standard)}/month

## Location

Norwich, Norfolk, United Kingdom. Working with businesses across the UK.

## Portfolio

14+ projects delivered across 8+ industries including equestrian, manufacturing, pet services, sports, technology, retail, professional services, and construction.

## Blog

Case studies, tips, and insights from building software for UK businesses. Read at: https://f-w-d.co.uk/blog

Pricing guides:
- How much does a website cost in the UK: https://f-w-d.co.uk/blog/how-much-does-a-website-cost-uk
- How much does an app cost in the UK: https://f-w-d.co.uk/blog/how-much-does-an-app-cost-uk
- How much does AI cost for a small business: https://f-w-d.co.uk/blog/how-much-does-ai-cost-small-business-uk

Equestrian guides:
- Understanding the equestrian industry, its needs and its people: https://f-w-d.co.uk/blog/understanding-the-equestrian-industry
- Horsebox hire deposits and hire agreements: https://f-w-d.co.uk/blog/horsebox-hire-deposits-and-agreements
- Selling online courses as an equine professional: https://f-w-d.co.uk/blog/selling-online-courses-equine-professionals
- Livery yard software compared: https://f-w-d.co.uk/blog/livery-yard-software-compared

Engineering and manufacturing guides:
- What buyers check on a manufacturer's website: https://f-w-d.co.uk/blog/what-buyers-check-manufacturer-website
- Replacing spreadsheet quoting: https://f-w-d.co.uk/blog/replacing-spreadsheet-quoting
- How much does a product configurator cost: https://f-w-d.co.uk/blog/how-much-does-a-product-configurator-cost

## Contact

Website: https://f-w-d.co.uk

## Full Version

For detailed information, see: https://f-w-d.co.uk/llms-full.txt
`;

export const GET = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
