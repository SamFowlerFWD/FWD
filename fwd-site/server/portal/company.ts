// FWD's own details, as they appear on invoices, emails and the signed copy.
// Change them here and nowhere else.
export const COMPANY = {
  name: 'FWD Thinking Solutions Limited',
  shortName: 'FWD Thinking Solutions',
  address: 'The Orchard, Common Road, East Tuddenham, Dereham, Norfolk, NR20 3AH',
  number: '17584500',
  registered: 'Registered in England and Wales, company number 17584500',
  email: 'thinking@f-w-d.co.uk',
  website: 'f-w-d.co.uk',
  url: 'https://f-w-d.co.uk',
  logoUrl: 'https://f-w-d.co.uk/fwd-logo-email.png',
  // Brand colours (tailwind.config.mjs and the logo).
  purple: '#6D28D9',
  ink: '#0A0E27',
} as const;
