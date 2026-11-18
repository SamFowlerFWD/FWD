// Child pages under the two flagship hubs (/equestrian/... and /engineering/...).
// Each one is rendered by src/pages/[hub]/[slug].astro using HubChildPage.astro.
// Paragraphs in `problem`, `proof` and `costNote` may contain simple <a> links.
import type { ServiceKey } from './taxonomy';

export type HubKey = 'equestrian' | 'engineering';

export interface HubPage {
  hub: HubKey;
  slug: string;
  /** Short label for breadcrumbs and sibling links. */
  nav: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  whatsappMessage: string;
  problemHeading: string;
  problem: string[];
  build: { title: string; text: string }[];
  proofHeading: string;
  proof: string[];
  /** Project ids from projects.ts. */
  projects: string[];
  cost: { label: string; price: string; text: string }[];
  costNote: string;
  faqs: { question: string; answer: string }[];
  /** Used to pick related posts. */
  services: ServiceKey[];
  serviceName: string;
  audience: string;
}

export const hubPages: HubPage[] = [
  // ---------------------------------------------------------------- Equestrian
  {
    hub: 'equestrian',
    slug: 'horsebox-businesses',
    nav: 'Horsebox Businesses',
    title: 'Software for Horsebox Hire Companies and Builders',
    description: "Online booking, held deposits and hire agreements for horsebox hire firms, plus websites for builders and dealers, from the developer behind Horsebox Hire Software.",
    h1: 'Software for Horsebox Businesses',
    intro: "A horsebox is a big, expensive vehicle with a lot of paperwork around it, whether you hire it out, build it or sell it. I built Horsebox Hire Software to take that paperwork off hire companies, and I build websites for horsebox manufacturers too.",
    whatsappMessage: "Hi Sam, I run a horsebox business and I'd like to talk about a project.",
    problemHeading: 'Where Horsebox Businesses Lose Time',
    problem: [
      "Most hire companies run on a booking plugin built for appointments, a separate app for signatures and a lot of emails asking for a photo of a licence. Deposits get charged and refunded later, which customers hate, and most card processors keep their fee on the refund.",
      "Builders and dealers have a different problem. Every box is a big decision, so buyers want layouts, payloads, specs and previous builds before they'll pick up the phone. Most horsebox websites make them hunt for it.",
      "And everyone in the trade gets the same question: am I allowed to drive this? Get that wrong with a hire customer and it's an insurance problem, not just an awkward conversation.",
    ],
    build: [
      { title: 'Online booking for hire fleets', text: "Real-time availability, weekday, weekend and weekly rates, and paid extras, so customers can book a box at 11pm without ringing you." },
      { title: 'Deposits held, not refunded', text: "The security deposit is held on the customer's card 12 hours before collection and released automatically when the box comes back. Damage? Take some or all of it." },
      { title: 'Hire agreements signed at checkout', text: "Signing the agreement is a step in the booking, and the signed PDF is created the moment payment goes through. No separate app, no chasing." },
      { title: 'Document checks', text: "Licence and proof of address uploaded while booking, checked by AI for tampering, with DVLA checks for vehicles over 3.5 tonnes." },
      { title: 'Builder and dealer websites', text: "Model pages with layouts, specs and photos, stock listings, and enquiry forms that ask the questions you'd ask on the phone." },
      { title: 'Your own branded booking site', text: "Every hire company on Horsebox Hire Software gets its own site with its own branding, vehicles and prices." },
    ],
    proofHeading: 'Built for Real Horsebox Businesses',
    proof: [
      "Horsebox Hire Software started as a booking system for one company, Wee Horsebox Hire in East Lothian, which had four horseboxes and a plugin that couldn't cope. Every hire company I spoke to had the same problems, so I turned it into a platform any hire business can use. <a href=\"/blog/building-horsebox-hire-software\">Read how it was built</a>.",
      "On the building side, I built the website for J Taylor Horseboxes, a horsebox manufacturer, and look after its SEO and hosting.",
    ],
    projects: ['horsebox-hire-software', 'wee-horsebox-hire', 'jth-horseboxes'],
    cost: [
      { label: 'Horsebox hire', price: 'Monthly plan', text: "Horsebox Hire Software is a flat monthly fee plus a small percentage on bookings. No setup fee and no per-vehicle charges." },
      { label: 'Builder or dealer website', price: '£799 to £2,500', text: "A fast site with model pages, specs, galleries and a proper enquiry form." },
      { label: 'Stock, spec or quote tools', price: 'From £1,299', text: "Stock listings, spec comparisons or a build-your-box enquiry tool on top of your site." },
    ],
    costNote: "Hire companies can see plans and book a demo at <a href=\"https://horseboxhiresoftware.co.uk\">horseboxhiresoftware.co.uk</a>. For deposits and agreements in more depth, read <a href=\"/blog/horsebox-hire-deposits-and-agreements\">how to handle horsebox hire deposits and agreements</a>.",
    faqs: [
      { question: 'Should I use Horsebox Hire Software or have something built?', answer: "For most hire companies, use Horsebox Hire Software. It's ready now, it costs far less than a custom build, and you get your own branded booking site. If you need something it doesn't do yet, tell me. A lot of its features came from hire companies asking." },
      { question: 'Why hold the deposit instead of charging it?', answer: "Because most deposits come back. A hold means the money never leaves the customer's account unless there's damage, so there's no refund to process and no waiting. Card holds only last a few days, which is why the system takes the hold 12 hours before collection rather than at booking." },
      { question: 'Do you build websites for horsebox manufacturers?', answer: "Yes. I built the website for J Taylor Horseboxes, and I know the detail buyers want: layouts, payloads, chassis and finishes. Manufacturing is the other half of what I focus on, so have a look at my engineering work too." },
      { question: 'Do you work with hire companies outside Norfolk?', answer: "Yes, anywhere in the UK. The first hire company on the platform is in East Lothian, at the other end of the country from me. Setup happens over video calls." },
    ],
    services: ['apps', 'automation', 'websites'],
    serviceName: 'Booking software and websites for horsebox hire companies, builders and dealers',
    audience: 'Horsebox hire companies, builders and dealers',
  },
  {
    hub: 'equestrian',
    slug: 'farriers-and-equine-professionals',
    nav: 'Farriers & Equine Professionals',
    title: 'Websites & Software for Farriers and Equine Professionals',
    description: "Websites, rebooking, horse records and CPD platforms for farriers, saddle fitters, physios and other equine professionals, built by a developer who's a farrier.",
    h1: 'Software for Farriers and Equine Professionals',
    intro: "I'm a farrier as well as a developer, so I know what the week looks like: early starts, a van full of kit, owners who've read something online, and admin at the kitchen table at nine at night. I build websites and systems that take some of that off you.",
    whatsappMessage: "Hi Sam, I'm an equine professional and I'd like to talk about a website or system.",
    problemHeading: 'The Job Around the Job',
    problem: [
      "Farriers, saddle fitters, physios, dentists and vets are mobile, booked solid and working with their hands. The admin still has to happen: rebooking the next visit, chasing invoices, keeping notes on each horse, logging CPD, and explaining a plan to an owner who wasn't there when you did the work.",
      "Most of that lives in a diary, a phone full of photos and a shoebox of certificates. It works, until it doesn't.",
      "Generic software doesn't help much. It doesn't know what a shoeing cycle is, that the customer is the owner but the patient is the horse, or that half your clients keep their horses on a yard with no signal.",
    ],
    build: [
      { title: 'Websites that bring the right work', text: "A fast site that shows your area, your qualifications and what you do, so you turn up in local searches and the enquiries are ones you want." },
      { title: 'Rebooking and reminders', text: "Visit cycles that rebook themselves, and reminders that go out without you thinking about it." },
      { title: 'Horse and client records', text: "Notes, photos and history kept against the horse, not just the owner, and on your phone at the stable door." },
      { title: 'Owner handouts', text: "Clear, evidence-backed explanations to send after a visit, with your name on them. Hoofflix already does this for farriers." },
      { title: 'CPD and training', text: "Courses, assessments and CPD records that keep themselves up to date and produce the report your governing body asks for." },
      { title: 'Webshops for suppliers', text: "Catalogues and shops for farriery and saddlery suppliers, built so trade customers find the exact part fast." },
    ],
    proofHeading: 'Built From the Inside',
    proof: [
      "I rebuilt Hoofflix, the professional platform for farriers, and I'm now one of its three directors. It records CPD as members learn, holds more than 8,600 research papers, and turns a farrier's notes into a handout for the owner. <a href=\"/blog/building-hoofflix\">Read the story</a>.",
      "I've also built websites for Britten Farriery, Farriers Choice and Mill Saddlery, a mobile saddlery whose site takes booking requests for fittings.",
    ],
    projects: ['hoofflix', 'britten-farriery', 'farriers-choice', 'mill-saddlery'],
    cost: [
      { label: 'Website', price: '£799 to £2,500', text: "Most equine professional sites land here. A single-page site starts at £299." },
      { label: 'Rebooking, records or booking', price: 'From £1,299', text: "A system built around how you work, from simple reminders to full client and horse records." },
      { label: 'CPD and handouts for farriers', price: 'Hoofflix', text: "If you're a farrier, Hoofflix already does CPD, research and owner handouts for a monthly subscription." },
    ],
    costNote: "Every project gets a fixed quote before any work starts. See <a href=\"/pricing\">pricing</a> or the <a href=\"/blog/how-much-does-a-website-cost-uk\">website cost guide</a>.",
    faqs: [
      { question: 'Do you really understand farriery?', answer: "Yes. I'm a farrier as well as a developer, and I've been building sites for farriers and farriery suppliers since 2019. You won't need to explain what a shoeing cycle is." },
      { question: "I'm a one-person business. Do I need more than a website?", answer: "Often not. A good website and a simple rebooking reminder will do more for most sole traders than a big system. If that's all you need, I'll say so." },
      { question: 'Can it work on a yard with no signal?', answer: "It can be built to. An app can save notes and photos on your phone and sync them when you're back in signal. I'll ask where you work before I suggest anything." },
      { question: 'What is Hoofflix, and do I need it?', answer: "Hoofflix is the professional platform for farriers: video, courses, CPD records, research and client handouts. If that's what you're after, it already exists and costs far less than building your own. I'm one of its directors, so I'm biased, but I'd still tell you that." },
      { question: 'Do you work with vets, physios and saddle fitters?', answer: "Yes. The problems are much the same: mobile work, records against the horse, rebooking, and owners who need things explained. Mill Saddlery, a mobile saddlery, is one of my clients." },
    ],
    services: ['websites', 'apps', 'ai'],
    serviceName: 'Websites and software for farriers and equine professionals',
    audience: 'Farriers, saddle fitters, physiotherapists, equine dentists and vets',
  },
  {
    hub: 'equestrian',
    slug: 'online-courses',
    nav: 'Online Courses & Memberships',
    title: 'Online Course Platforms for Equestrian Trainers',
    description: "Your own video course and membership platform for riding, training and equine CPD, with subscriptions, drip-fed lessons and your own app, and no revenue share.",
    h1: 'Online Course Platforms for Equestrian Trainers',
    intro: "If you teach riders, owners or professionals, your knowledge is the product. I build platforms where you sell it on your own terms: subscriptions, one-off courses, video that plays on yard signal, and an app with your name on it.",
    whatsappMessage: "Hi Sam, I teach in the equestrian world and I'd like to talk about an online course platform.",
    problemHeading: 'Where Generic Course Platforms Fall Short',
    problem: [
      "Off-the-shelf course platforms are a good way to test an idea. But once you have students, the monthly fees and transaction cuts grow with you, and the platform owns the experience, not you.",
      "Equestrian students learn in their own way. They watch on a phone, at the yard, between horses, on one bar of 4G. The video has to cope with that, and lessons need to be short enough to finish before the next job.",
      "And if you teach professionals, videos aren't enough. Farriers, vets and physios have to evidence their learning. A platform that doesn't record CPD is only doing half the job.",
    ],
    build: [
      { title: 'Courses, modules and lessons', text: "Structured the way you teach, with video, written notes and downloads in each lesson." },
      { title: 'Subscriptions and one-off sales', text: "Monthly memberships and single courses side by side, with discount codes for launches." },
      { title: 'Lessons released over time', text: "Lessons unlock week by week, so students keep coming back instead of binge-watching and cancelling." },
      { title: 'Video for yard signal', text: "Adaptive streaming drops the quality on a weak connection instead of buffering." },
      { title: 'CPD and assessment', text: "For professional audiences: CPD that records itself, quizzes and practical assessments, and a report at the end." },
      { title: 'Your own app', text: "Native apps on iOS and Android, with payments set up so the app stores don't take 30% of every sale." },
    ],
    proofHeading: 'Platforms Already Running',
    proof: [
      "The Balanced Horse is Rebecca Duke's training business, built around video courses for horse owners. She runs it herself from an admin dashboard: uploads, pricing, students and completion rates. It's on both app stores and costs her a fraction of a Teachable or Thinkific subscription, with no revenue share. <a href=\"/blog/building-the-balanced-horse\">Read the case study</a>.",
      "Hoofflix is the same idea for professionals. Farriers get video, courses and assessments, and their CPD is recorded as they learn.",
    ],
    projects: ['the-balanced-horse', 'hoofflix'],
    cost: [
      { label: 'First course, no audience yet', price: 'Off the shelf', text: "Test the idea on an existing platform first. I'll tell you which one I'd use." },
      { label: 'Your own platform', price: '£2,000 to £5,000', text: "Courses, subscriptions, one-off sales, drip release and your own admin." },
      { label: 'Platform plus apps', price: '£5,000+', text: "The same platform with native apps on the App Store and Google Play." },
    ],
    costNote: "Weigh it against what you'd pay in platform fees and transaction cuts over two or three years. For the full picture, read <a href=\"/blog/selling-online-courses-equine-professionals\">selling online courses as an equine professional</a>.",
    faqs: [
      { question: 'Should I start on Teachable or Kajabi instead?', answer: "If you haven't sold a course yet, quite possibly. Test the idea cheaply first. Once you have paying students and the fees start to sting, that's the time to own your platform." },
      { question: 'Can I move my students across from another platform?', answer: "Usually, yes. Most platforms let you export students and content. Moving live subscriptions needs more care, and I'd plan it so nobody is charged twice or loses access." },
      { question: 'Do I need an app?', answer: "Not always. A well-built web platform works brilliantly on a phone. An app helps with visibility and notifications, and some audiences expect one. It can be added later." },
      { question: 'Who owns the content and the students?', answer: "You do. The code, the videos, the student list and the payment account are all yours." },
    ],
    services: ['apps'],
    serviceName: 'Online course and membership platforms for equestrian trainers and educators',
    audience: 'Equestrian trainers, coaches and educators',
  },
  {
    hub: 'equestrian',
    slug: 'booking-systems',
    nav: 'Booking Systems',
    title: 'Booking Systems for Riding Schools, Arenas and Yards',
    description: "Online booking and payment for lessons, clinics, arena hire and yard services, with reminders and automatic gate codes, built around how your yard runs.",
    h1: 'Booking Systems for Riding Schools, Arenas and Yards',
    intro: "Lessons, clinics, arena hire, livery extras, fittings. If you're still taking bookings by text and chasing payments across the yard, a booking system built around how you actually work will give you your evenings back.",
    whatsappMessage: "Hi Sam, I'd like to talk about a booking system for my yard.",
    problemHeading: 'Why Yard Bookings Are Awkward',
    problem: [
      "Yard bookings aren't like haircut appointments. A lesson needs a horse, an instructor and an arena at the same time. A clinic has places, levels and a waiting list. Arena hire needs someone to let people in. Generic booking apps handle one of those, and not very well.",
      "So most yards end up with a diary, a WhatsApp group and a list of who still owes what. It works, but you're the system, and you never get to switch off.",
    ],
    build: [
      { title: 'Lessons and clinics', text: "Book a slot, pick a level, pay up front. Instructor, horse and arena are booked together, so nothing is double-booked." },
      { title: 'Arena and facility hire', text: "Customers book and pay online and get a gate code that only works for their slot, so nobody needs to be there to let them in." },
      { title: 'Payments and deposits', text: "Full payment, deposits or held card payments, with refunds that follow your cancellation rules." },
      { title: 'Reminders', text: "Confirmations and reminders sent automatically, which cuts no-shows." },
      { title: 'Livery extras', text: "Turnout, rugging, holiday cover and other extras logged as they happen and added to each owner's bill." },
      { title: 'Your day at a glance', text: "Today's bookings, who has paid and what's coming up, on your phone." },
    ],
    proofHeading: "The Closest Things I've Built",
    proof: [
      "I'll be straight: I haven't built a system for a riding school or livery yard yet. But I've built the hard parts.",
      "<a href=\"/blog/building-fakenham-dog-field\">Fakenham Dog Field</a> is private field hire. Customers book and pay online and get a gate code that only works during their slot, and the field runs with nobody on site. Swap the dogs for horses and it's arena hire.",
      "Horsebox Hire Software handles availability, pricing rules, held deposits and documents for hire companies, and Mill Saddlery's website takes booking requests for fittings.",
    ],
    projects: ['fakenham-dog-field', 'horsebox-hire-software', 'mill-saddlery'],
    cost: [
      { label: 'Booking requests on your website', price: '£799 to £2,500', text: "Part of a website build. Customers request a slot and you confirm it." },
      { label: 'Online booking with payments', price: 'From £1,299', text: "Customers see what's free, book and pay. Reminders included." },
      { label: 'Lessons, arenas and livery together', price: '£2,000 to £5,000+', text: "One system for everything the yard sells, with gate codes if you need them." },
    ],
    costNote: "If an off-the-shelf app already does what you need, I'll tell you. Start with my <a href=\"/blog/livery-yard-software-compared\">honest comparison of livery yard software</a>.",
    faqs: [
      { question: 'Is there off-the-shelf software that would do this?', answer: "For some yards, yes, and I've compared the main options honestly on my blog. A custom system makes sense when you run a mix that no single app covers, like lessons, arena hire and livery extras together." },
      { question: 'Can people use the arena without me being there?', answer: "Yes. The booking can create a code for a keypad gate that only works during the booked time. Fakenham Dog Field works exactly like this." },
      { question: 'Can it handle cancellations and refunds?', answer: "Yes, following whatever rules you set: a full refund up to a deadline, a credit after it, or no refund at all." },
      { question: "What about clients who won't book online?", answer: "You can still take bookings by phone and add them yourself, so everything lives in one diary." },
    ],
    services: ['apps', 'automation'],
    serviceName: 'Booking systems for riding schools, arenas and livery yards',
    audience: 'Riding schools, livery yards, arena owners and equestrian centres',
  },
  {
    hub: 'equestrian',
    slug: 'website-design',
    nav: 'Equestrian Website Design',
    title: 'Equestrian Website Design for Horse Businesses',
    description: "Fast, findable websites for farriers, saddlers, yards, trainers and equine suppliers, from £299, built by a Norfolk developer who is a farrier himself.",
    h1: 'Equestrian Website Design',
    intro: "Most equestrian websites are made to look lovely and left there. I build sites that load fast on a phone at the yard, turn up when people search locally, and turn visitors into bookings and enquiries. And I know the industry, because I work in it.",
    whatsappMessage: "Hi Sam, I'd like to talk about a website for my equestrian business.",
    problemHeading: 'What Most Horse Business Websites Get Wrong',
    problem: [
      "They're slow. Horse people browse on their phones, often outdoors on a poor connection, and a site full of huge photos and plugins takes forever to load.",
      "They're vague. A visitor wants to know in seconds whether you cover their area, roughly what you charge and how to book, and most sites make them hunt for it.",
      "And they stop at the brochure. The site could be taking bookings, selling products or answering the five questions you get every day, and it isn't.",
    ],
    build: [
      { title: 'Fast on a phone', text: "Hand-built sites, not page builders, so pages load quickly even on one bar of signal." },
      { title: 'Found locally', text: "Built for local search, so you turn up when someone looks for a farrier, saddler or yard near them." },
      { title: 'Clear next steps', text: "Area covered, prices or starting prices, and a booking or enquiry form, all easy to find." },
      { title: 'Webshops', text: "Product catalogues and shops for equine suppliers, with the detail trade buyers need." },
      { title: 'Booking built in', text: "Booking requests or full online booking, so the site takes work while you're working." },
      { title: 'Hosting and care', text: "I host and look after the site from £20 a month, so you're not on your own when something needs changing." },
    ],
    proofHeading: 'Equestrian Sites I Look After',
    proof: [
      "I've been building websites for equestrian businesses since 2019, when I started out as Fowler Web Design. Farriers, saddlers, suppliers and a horsebox manufacturer, and I still host and look after all four of the sites below.",
    ],
    projects: ['britten-farriery', 'mill-saddlery', 'farriers-choice', 'jth-horseboxes'],
    cost: [
      { label: 'Single page', price: '£299', text: "One well-built page with everything a customer needs to get in touch." },
      { label: 'Typical business site', price: '£799 to £2,500', text: "Where most equestrian business sites land. Usually live in 2 to 4 weeks." },
      { label: 'Webshop or booking', price: '£2,500+', text: "A catalogue, shop or booking system built into the site." },
    ],
    costNote: "Every project gets a fixed quote before work starts, and you own the site. See the <a href=\"/blog/how-much-does-a-website-cost-uk\">website cost guide</a> for how prices compare.",
    faqs: [
      { question: 'How much does an equestrian website cost?', answer: "A single-page site starts at £299, and most equestrian business sites land between £799 and £2,500. Webshops and booking systems cost more. Every project gets a fixed quote before any work starts." },
      { question: 'Do you use WordPress?', answer: "No. I build sites by hand, so they're fast and there are no plugins to keep updating. If you'd like to edit pages yourself, tell me at the start and I'll build that in." },
      { question: 'Will my site show up on Google?', answer: "Every site is built for search from day one: fast pages, proper titles, local signals and structured data. Nobody can honestly promise first place, but the basics will be right." },
      { question: 'I already have a website. Can you improve it?', answer: "Yes. Sometimes a rebuild is the right answer and sometimes a few fixes will do. I'll tell you which." },
    ],
    services: ['websites', 'hosting'],
    serviceName: 'Website design for equestrian businesses',
    audience: 'Equestrian businesses',
  },

  // --------------------------------------------------------------- Engineering
  {
    hub: 'engineering',
    slug: 'manufacturer-websites',
    nav: 'Manufacturer Websites',
    title: 'Websites for Manufacturers and Engineering Firms',
    description: "Websites for UK manufacturers and engineering firms that show what you make, prove what you can do and turn specs into quote requests. Fixed quotes from £799.",
    h1: 'Websites for Manufacturers and Engineering Firms',
    intro: "A buyer lands on your site with a job in mind. In the first thirty seconds they want to know what you make, whether you can do their job and how to get a price. I build manufacturer websites that answer all three, and I run a production business myself.",
    whatsappMessage: "Hi Sam, I run a manufacturing or engineering business and I'd like to talk about our website.",
    problemHeading: 'Why Manufacturing Websites Underperform',
    problem: [
      "A lot of engineering firms have a website that was right ten years ago: a home page about quality and service, a list of machines and a contact form. Buyers have to ring to find out the things they wanted to read.",
      "Meanwhile the material that would win work, like case studies, sectors served, accreditations and spec sheets, sits in someone's inbox or a folder on the server.",
      "Specialist B2B agencies will fix that, often for £15,000 or more. Most small firms don't need that. They need a fast, clear site that does the selling before the phone rings.",
    ],
    build: [
      { title: 'Clear capability pages', text: "What you make, which processes and materials, and which industries you serve, in plain English." },
      { title: 'Products with proper specs', text: "Dimensions, compatibility and downloadable data sheets, not a PDF brochure from 2015." },
      { title: 'Proof that sells', text: "Case studies, sectors, accreditations and photos of real work." },
      { title: 'Quote forms that ask the right questions', text: "Quantities, materials, drawings and dates, so you get a usable enquiry instead of 'please call me'." },
      { title: 'Built for search', text: "A page for each product and process, so buyers searching for exactly what you make can find you." },
      { title: 'Hosting and support', text: "I keep it fast, secure and up to date from £20 a month." },
    ],
    proofHeading: 'Manufacturers I Work With',
    proof: [
      "I built the website for Harford Attachments, an excavator attachments manufacturer, around a product catalogue, and I look after its hosting, SEO and support. I also built the site for J Taylor Horseboxes, a horsebox manufacturer.",
      "For what buyers actually look for, read <a href=\"/blog/what-buyers-check-manufacturer-website\">what buyers check on a manufacturer's website</a>.",
    ],
    projects: ['harford-attachments', 'jth-horseboxes'],
    cost: [
      { label: 'Capability website', price: 'From £799', text: "A clear, fast site that explains what you do and makes it easy to ask for a quote." },
      { label: 'Typical manufacturer site', price: '£799 to £2,500', text: "Capability, sector and product pages, case studies and a proper quote form." },
      { label: 'With catalogue or quote tools', price: '£2,500 to £5,000+', text: "A searchable product catalogue, data sheets or a quote tool built in." },
    ],
    costNote: "Every project gets a fixed quote before work starts, and you own the site, the content and the accounts. See <a href=\"/pricing\">pricing</a>.",
    faqs: [
      { question: 'How long does a manufacturer website take?', answer: "Most sites go live 2 to 4 weeks after our first conversation. Larger sites with catalogues can take longer, and I'll give you a date with the quote." },
      { question: 'Can you write the content?', answer: "Yes, with your help. I'll talk to you or your team about what you make and who buys it, then write it up for you to check. Nobody knows your processes better than you do." },
      { question: 'We sell through dealers. Does that change anything?', answer: "It changes the site's job. Dealers need a login for prices and stock, and end customers need to find their nearest dealer. Have a look at customer and dealer portals." },
      { question: 'Do you work outside Norfolk?', answer: "Yes, across the UK. I'm happy to visit workshops around Norfolk, and further afield we work over video calls." },
    ],
    services: ['websites', 'hosting'],
    serviceName: 'Websites for manufacturers and engineering firms',
    audience: 'Manufacturers and engineering firms',
  },
  {
    hub: 'engineering',
    slug: 'product-catalogues',
    nav: 'Product Catalogues',
    title: 'Online Product Catalogues and Spec Sheets for Manufacturers',
    description: "Searchable online product catalogues with specs, compatibility and downloadable data sheets, so trade buyers find the right part without phoning you.",
    h1: 'Online Product Catalogues and Spec Sheets',
    intro: "If your catalogue is a PDF, buyers have to download it, scroll it and still ring you to check it fits. An online catalogue lets them search by machine, size or part number, compare specs and download the data sheet, and Google can read every page of it.",
    whatsappMessage: "Hi Sam, I'd like to talk about putting our product catalogue online.",
    problemHeading: 'The Trouble With PDF Catalogues',
    problem: [
      "A PDF catalogue is out of date the day it's finished. Prices change, products are added, and nobody's sure which version a customer is looking at.",
      "Search engines can't do much with it either. Every product buried in a PDF is invisible to someone searching for exactly that product.",
      "And the questions keep coming: will this fit my machine, what does it weigh, have you got it in stock? Each one is a phone call someone has to take.",
    ],
    build: [
      { title: 'Search and filters', text: "By product type, size, machine, material or part number." },
      { title: 'Spec tables', text: "Dimensions, weights, tolerances and compatibility, laid out the same way for every product." },
      { title: 'Data sheet downloads', text: "Generated from the same data as the page, so the PDF is never out of date." },
      { title: 'Compatibility', text: "Pick your machine and see only the products that fit it." },
      { title: 'Trade prices behind a login', text: "Specs for everyone, prices and stock for approved trade customers." },
      { title: 'One place to update', text: "Change a product once and the page, the data sheet and the search all update." },
    ],
    proofHeading: 'Catalogues I Have Built',
    proof: [
      "Harford Attachments makes excavator attachments, where fit and spec decide the sale, and its website is built around a product catalogue. Farriers Choice is a farriery supplies webshop with a full catalogue. Different trades, same job: help a buyer find the right part quickly.",
    ],
    projects: ['harford-attachments', 'farriers-choice'],
    cost: [
      { label: 'Small range on your website', price: '£799 to £2,500', text: "A few dozen products with proper spec pages, as part of a website build." },
      { label: 'Searchable catalogue', price: '£2,500 to £5,000', text: "Filters, spec tables and data sheets generated from your product data." },
      { label: 'Compatibility, trade login or stock', price: '£5,000+', text: "Machine fit-finders, trade pricing or live stock from your systems." },
    ],
    costNote: "If your product data lives in a spreadsheet, that's a fine place to start. See the <a href=\"/blog/how-much-does-an-app-cost-uk\">app cost guide</a> for how bigger builds are priced.",
    faqs: [
      { question: 'Can it use the spreadsheet or system we already have?', answer: "Usually. A well-kept spreadsheet is a good starting point, and many stock and accounts systems can feed a catalogue directly. I'll check before I quote." },
      { question: 'Do we still get a printable catalogue?', answer: "Yes. Data sheets, and even a full catalogue PDF, can be generated from the same data, so print and online always match." },
      { question: 'Will each product show up on Google?', answer: "Each product gets its own page with proper titles and structured data, which gives it a fair chance of being found by someone searching for it." },
      { question: 'How many products can it handle?', answer: "Dozens or thousands. The bigger question is how well the data is organised, and I'll help you sort that out first." },
    ],
    services: ['websites', 'apps'],
    serviceName: 'Online product catalogues for manufacturers',
    audience: 'Manufacturers and trade suppliers',
  },
  {
    hub: 'engineering',
    slug: 'quote-tools',
    nav: 'Quote Tools & Configurators',
    title: 'Quote Tools and Product Configurators for Manufacturers',
    description: "Online quote calculators, product configurators and internal quoting tools for UK manufacturers and fabricators, built around your own price rules.",
    h1: 'Quote Tools and Product Configurators',
    intro: "If quoting means one person, one spreadsheet and a backlog of enquiries, a quote tool will save you hours a week. Customers pick their options and get a price or send a properly structured request, and your team quotes from the same rules every time.",
    whatsappMessage: "Hi Sam, I'd like to talk about a quote tool or configurator.",
    problemHeading: 'Where Quoting Goes Wrong',
    problem: [
      "In a lot of small firms, quoting lives in one person's head and one spreadsheet. When they're busy or off, quotes stop.",
      "Prices drift. Materials go up, the spreadsheet doesn't, and the margin quietly disappears on jobs that looked fine.",
      "And enquiries arrive with half the information, so every quote starts with an email asking for quantities, materials or a drawing.",
    ],
    build: [
      { title: 'Structured enquiry forms', text: "Ask for exactly what you need to quote: quantities, materials, finishes, drawings and dates." },
      { title: 'Internal quote tools', text: "Your price rules in one place, so anyone on the team can produce a consistent quote in minutes." },
      { title: 'Customer price calculators', text: "Instant prices for standard products and options, so buyers can budget before they ring." },
      { title: 'Configurators with rules', text: "Only valid combinations can be picked, and the price updates as they go." },
      { title: 'Quote follow-ups', text: "Automatic reminders on quotes nobody has replied to." },
      { title: 'Links to your accounts', text: "Accepted quotes go into your accounts package or job list without being retyped." },
    ],
    proofHeading: "Price Logic I've Already Built",
    proof: [
      "Horsebox Hire Software runs on a pricing engine: weekday, weekend and weekly rates, paid extras and two-stage payments, worked out live as the customer chooses. It isn't a manufacturing configurator, but the logic underneath is the same.",
      "You can also try the <a href=\"/playground#quote-builder\">Instant Quote Builder</a> in my playground. Pick a trade, click the jobs and get a quote in seconds.",
    ],
    projects: ['horsebox-hire-software'],
    cost: [
      { label: 'Smart enquiry form', price: 'From £799', text: "Asks the right questions and sends you a complete, structured request." },
      { label: 'Quote tool or price calculator', price: 'From £1,299', text: "Your price rules in one tool, internal or customer-facing. Most land between £2,500 and £5,000." },
      { label: 'Configurator with rules', price: '£2,500 to £5,000+', text: "Options that depend on each other, compatibility checks, live pricing and PDF quotes." },
    ],
    costNote: "More detail in <a href=\"/blog/how-much-does-a-product-configurator-cost\">what a product configurator costs</a> and <a href=\"/blog/replacing-spreadsheet-quoting\">replacing spreadsheet quoting</a>.",
    faqs: [
      { question: 'Our pricing is complicated. Can a tool really handle it?', answer: "If you can explain how you price a job, it can be built. Most complicated pricing turns out to be a handful of rules and a few exceptions, and the exceptions can always go to a person." },
      { question: 'Will customers see our prices?', answer: "Only if you want them to. Some firms show prices for standard items and keep bespoke work as a structured request. Others keep the tool internal." },
      { question: 'Do we have to replace our spreadsheet?', answer: "Not straight away. We can start by moving the price rules into a tool and leave everything else as it is." },
      { question: 'What about 3D configurators?', answer: "3D product configurators are a different budget. For most small manufacturers, clear options, photos and a live price do the job, and I'll tell you honestly if you need more." },
    ],
    services: ['apps', 'automation'],
    serviceName: 'Quote tools and product configurators for manufacturers',
    audience: 'Manufacturers and fabricators',
  },
  {
    hub: 'engineering',
    slug: 'job-tracking',
    nav: 'Job & Production Tracking',
    title: 'Job Tracking and Production Software for Small Manufacturers',
    description: "Replace the whiteboard and the spreadsheet with simple job tracking: what's in, what's on the bench, what's due out and who's on it, on any screen.",
    h1: 'Job and Production Tracking for Small Manufacturers',
    intro: "Every workshop has a system for tracking jobs. Usually it's a whiteboard, a spreadsheet and the one person who knows where everything is. I build simple job tracking that shows what's in, what's on the bench and what's due out, and I run a production business myself, so I know which bits actually get used.",
    whatsappMessage: "Hi Sam, I'd like to talk about job or production tracking for our workshop.",
    problemHeading: 'When the Whiteboard Stops Working',
    problem: [
      "A whiteboard is great until there are more jobs than space, or someone wipes it, or a customer rings and the person who knows is out on a delivery.",
      "Spreadsheets fill the gap, but they live on one computer, they're awkward on the shop floor, and nobody trusts which version is current.",
      "The big ERP and MRP systems solve all of that, at a cost and complexity most small firms can't justify. There's a big gap between a whiteboard and an ERP, and that's where most small manufacturers are.",
    ],
    build: [
      { title: 'Job board', text: "Every job, its stage and its due date on one screen, in the office or on a tablet in the workshop." },
      { title: 'Job sheets', text: "Drawings, materials, notes and photos attached to the job, not buried in someone's email." },
      { title: 'Updates from the floor', text: "Tap to move a job on, and everyone sees it straight away." },
      { title: 'Customer updates', text: "Automatic messages when a job is ready or running late, so the phone rings less." },
      { title: 'Who did what', text: "A full history on every job, useful for quality records and for working out what jobs really cost." },
      { title: 'Links to quotes and invoices', text: "Accepted quotes become jobs, and finished jobs go through to invoicing." },
    ],
    proofHeading: 'Systems That Run Every Day',
    proof: [
      "Underneath, Horsebox Hire Software is a job system. Every booking moves through stages, from documents checked to collected to returned, with an admin dashboard and every action logged. Hire companies run their day from it.",
      "And because I run a production business myself, I build for the person on the shop floor with a tablet and no time, not just for the office.",
    ],
    projects: ['horsebox-hire-software'],
    cost: [
      { label: 'Simple job board', price: 'From £1,299', text: "Jobs, stages and due dates on any screen. Often the biggest win on its own." },
      { label: 'Job sheets and updates', price: '£2,000 to £5,000', text: "Job sheets, photos, stage updates from the floor and customer messages." },
      { label: 'Connected to quotes and accounts', price: '£5,000+', text: "Quotes become jobs, jobs become invoices, without retyping anything." },
    ],
    costNote: "Start small and add to it. See <a href=\"/blog/business-tasks-you-should-automate\">business tasks worth automating</a> for where the quick wins usually are.",
    faqs: [
      { question: "Isn't there off-the-shelf software for this?", answer: "Plenty, and for some firms one of them will fit. Most are built either for trades on the road or for large factories. If you're neither, a simple custom system is often cheaper than bending an off-the-shelf one to fit." },
      { question: 'Will my team actually use it?', answer: "Only if it's quicker than what they do now. That's why I keep it simple, test it with the people on the floor and change it based on what they say." },
      { question: 'Does it work on tablets and phones?', answer: "Yes. It runs in a browser on any device and can be installed like an app on a workshop tablet." },
      { question: 'Can we start small?', answer: "Yes, and I'd recommend it. A job board on its own often makes the biggest difference. Job sheets, customer updates and links to your accounts can come later." },
    ],
    services: ['apps', 'automation'],
    serviceName: 'Job and production tracking software for small manufacturers',
    audience: 'Small manufacturers and engineering workshops',
  },
  {
    hub: 'engineering',
    slug: 'customer-portals',
    nav: 'Customer & Dealer Portals',
    title: 'Customer and Dealer Portals for Manufacturers',
    description: "Secure portals where trade customers and dealers check orders, lead times, invoices, prices and stock themselves, without ringing your office. Built for UK manufacturers.",
    h1: 'Customer and Dealer Portals',
    intro: "Where's my order? Have you got it in stock? Can you resend that invoice? If your office spends its day answering the same questions from repeat customers and dealers, a portal lets them answer themselves.",
    whatsappMessage: "Hi Sam, I'd like to talk about a customer or dealer portal.",
    problemHeading: 'The Calls a Portal Stops',
    problem: [
      "Repeat customers and dealers are your best business, and they create the most admin. Order updates, stock checks, price lists, copy invoices and reorders all arrive by phone and email.",
      "None of it is difficult, but every call interrupts someone, and the answer is usually already in your systems. The customer just can't see it.",
    ],
    build: [
      { title: 'Secure logins', text: "Each customer or dealer sees only their own orders, prices and documents." },
      { title: 'Orders and lead times', text: "Where each order is, and when it's due out." },
      { title: 'Invoices and documents', text: "Copy invoices, delivery notes, certificates and manuals, ready to download." },
      { title: 'Dealer prices and stock', text: "Trade price lists and stock levels for approved dealers." },
      { title: 'Reorders', text: "Repeat an order in a couple of clicks." },
      { title: 'Team accounts', text: "Several people at the same customer, each with their own login and permissions." },
    ],
    proofHeading: 'Logins, Permissions and Data Kept Apart',
    proof: [
      "Horsebox Hire Software gives every hire company its own branded site, with its data kept separate at the database level, so one business can never see another's bookings or customers. That's the hard part of any portal.",
      "Hoofflix has individual and team accounts, so practices and colleges can manage their people under one plan.",
    ],
    projects: ['horsebox-hire-software', 'hoofflix'],
    cost: [
      { label: 'Orders and documents portal', price: '£2,000 to £5,000', text: "Secure logins, order status, lead times and downloadable documents." },
      { label: 'Dealer pricing, stock and integrations', price: '£5,000+', text: "Per-dealer prices, live stock and links to your accounts or stock system." },
    ],
    costNote: "Every project gets a fixed quote, with payment plans available on projects over £2,000. See <a href=\"/pricing\">pricing</a>.",
    faqs: [
      { question: 'Does it connect to our accounts or stock system?', answer: "Usually. Most modern accounts and stock systems can share data with a portal. If yours can't, a regular export can keep it up to date. I'll check before I quote." },
      { question: 'Is it secure?', answer: "Each customer sees only their own data, enforced in the database rather than just hidden on the page. That's how Horsebox Hire Software keeps every hire company's data apart." },
      { question: 'Will our customers actually use it?', answer: "Repeat buyers usually do, because it's quicker than ringing. It helps to launch it with your best customers first and ask what else they'd want in there." },
      { question: 'Can dealers have different prices?', answer: "Yes. Prices can be set per dealer or per price band, and each dealer only sees their own." },
    ],
    services: ['apps', 'automation'],
    serviceName: 'Customer and dealer portals for manufacturers',
    audience: 'Manufacturers with repeat trade customers and dealers',
  },
];

export const hubPagePath = (hub: string, slug: string) => `/${hub}/${slug}`;
export const pagesFor = (hub: string) => hubPages.filter(p => p.hub === hub);
