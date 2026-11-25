import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { pounds, ukDateTime } from './core';

export interface SignatureRecord {
  projectName: string;
  clientName: string;
  company: string;
  sowFilename: string;
  sowHash: string;
  termsLabel: string;
  termsHash: string;
  sentBy: string;
  sentAt: string;
  signerName: string;
  signerPosition: string;
  signerEmail: string;
  signerIp: string;
  signerUa: string;
  signedAt: string;
}

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 56;
const WIDTH = A4.width - MARGIN * 2;

// The built-in PDF fonts only cover Windows-1252. Swap anything else for "?"
// rather than failing to produce the document.
const safe = (text: string) =>
  text.replace(/[^\x20-\x7E\xA0-\xFF‘’“”–—•…€]/g, '?');

function wrap(text: string, font: PDFFont, size: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) <= WIDTH) {
      line = attempt;
      continue;
    }
    if (line) lines.push(line);
    // A single word wider than the page (a fingerprint, a long URL): break it by character.
    let rest = word;
    while (font.widthOfTextAtSize(rest, size) > WIDTH) {
      let cut = rest.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > WIDTH) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  }
  lines.push(line);
  return lines;
}

// The signed copy: the Statement of Work, then the Terms of Business, then a
// page recording who signed, when and from where.
export async function signedPack(sow: ArrayBuffer, terms: ArrayBuffer, r: SignatureRecord): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Signed agreement: ${r.projectName}`);
  pdf.setAuthor('FWD Thinking Solutions Limited');

  for (const bytes of [sow, terms]) {
    const source = await PDFDocument.load(bytes);
    for (const page of await pdf.copyPages(source, source.getPageIndices())) pdf.addPage(page);
  }

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.09, 0.16);
  const grey = rgb(0.39, 0.45, 0.55);
  const page: PDFPage = pdf.addPage([A4.width, A4.height]);
  let y = A4.height - MARGIN;

  const write = (text: string, font: PDFFont, size: number, colour = ink, gap = 0) => {
    for (const line of wrap(safe(text), font, size)) {
      y -= size * 1.45;
      if (line) page.drawText(line, { x: MARGIN, y, size, font, color: colour });
    }
    y -= gap;
  };

  write('Signature record', bold, 18, ink, 4);
  write(`${r.projectName}  |  ${[r.clientName, r.company].filter(Boolean).join(', ')}`, regular, 10, grey, 16);

  write('Documents signed', bold, 12, ink, 2);
  write(`1. Statement of Work (${r.sowFilename})`, regular, 10.5);
  write(`SHA-256 fingerprint: ${r.sowHash}`, regular, 8.5, grey, 4);
  write(`2. FWD Terms of Business, ${r.termsLabel}`, regular, 10.5);
  write(`SHA-256 fingerprint: ${r.termsHash}`, regular, 8.5, grey, 16);

  write('Signed for and on behalf of the client', bold, 12, ink, 2);
  write(`Name: ${r.signerName}`, regular, 10.5);
  write(`Position: ${r.signerPosition}`, regular, 10.5);
  write(`Email: ${r.signerEmail}`, regular, 10.5);
  write(`Date: ${ukDateTime(r.signedAt)} (UK time)  |  ${r.signedAt} UTC`, regular, 10.5);
  write(`IP address: ${r.signerIp || 'not recorded'}`, regular, 10.5);
  write(`Browser: ${r.signerUa || 'not recorded'}`, regular, 8.5, grey, 16);

  write('Signed for and on behalf of FWD Thinking Solutions Limited', bold, 12, ink, 2);
  write('Name: Sam Fowler', regular, 10.5);
  write('Position: Director', regular, 10.5);
  write(`Email: ${r.sentBy}`, regular, 10.5);
  write(`Date: ${ukDateTime(r.sentAt)} (UK time)  |  ${r.sentAt} UTC`, regular, 10.5, ink, 16);

  write(
    'Both parties signed electronically through the FWD client area at f-w-d.co.uk. FWD signed by issuing these ' +
      'documents for signature. The client signed in using a one-time link sent to the email address above, typed their ' +
      'name and position, and confirmed that they had read and agreed to both documents and were authorised to sign. ' +
      'The fingerprints identify the exact files that were signed: any change to a file changes its fingerprint. ' +
      'This record takes the place of the handwritten signature block in the Statement of Work.',
    regular,
    9,
    grey,
  );

  return pdf.save();
}

export interface InvoiceDetails {
  number: string;
  issued: string;
  projectName: string;
  clientName: string;
  company: string;
  description: string;
  amount: number; // pence
  paidAt: string | null;
  paidHow: string | null;
}

const ukDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' });

// A one-page invoice for a single payment. FWD is not VAT registered, so
// there is no VAT line; change this if that changes (Terms clause 10.2).
export async function invoicePdf(inv: InvoiceDetails): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${inv.number}`);
  pdf.setAuthor('FWD Thinking Solutions Limited');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.09, 0.16);
  const grey = rgb(0.39, 0.45, 0.55);
  const page = pdf.addPage([A4.width, A4.height]);
  const right = A4.width - MARGIN;
  let y = A4.height - MARGIN;

  const write = (text: string, font: PDFFont, size: number, colour = ink, gap = 0) => {
    for (const line of wrap(safe(text), font, size)) {
      y -= size * 1.45;
      if (line) page.drawText(line, { x: MARGIN, y, size, font, color: colour });
    }
    y -= gap;
  };
  const rightText = (text: string, atY: number, font: PDFFont, size: number, colour = ink) =>
    page.drawText(safe(text), { x: right - font.widthOfTextAtSize(safe(text), size), y: atY, size, font, color: colour });
  const rule = () => {
    y -= 10;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.75, color: grey });
    y -= 4;
  };

  write('Invoice', bold, 24, ink, 2);
  rightText(inv.paidAt ? 'PAID' : 'DUE', y + 4, bold, 14, inv.paidAt ? rgb(0.09, 0.5, 0.24) : rgb(0.71, 0.33, 0.04));
  write(`Invoice number: ${inv.number}`, regular, 10.5);
  write(`Date: ${ukDate(inv.issued)}`, regular, 10.5, ink, 18);

  write('From', bold, 10.5, grey);
  write('FWD Thinking Solutions Limited', bold, 10.5);
  write('The Orchard, Common Road, East Tuddenham, Dereham, Norfolk, NR20 3AH', regular, 10.5);
  write('Company number 17584500', regular, 10.5, ink, 14);

  write('To', bold, 10.5, grey);
  write(inv.company || inv.clientName, bold, 10.5);
  if (inv.company && inv.clientName) write(inv.clientName, regular, 10.5);
  y -= 18;

  write('Description', bold, 10.5, grey);
  rightText('Amount', y, bold, 10.5, grey);
  rule();
  write(`${inv.description}: ${inv.projectName}`, regular, 11);
  rightText(pounds(inv.amount), y, regular, 11);
  rule();
  write('Total', bold, 12);
  rightText(pounds(inv.amount), y, bold, 12);
  y -= 6;
  write('No VAT is charged. FWD Thinking Solutions Limited is not VAT registered.', regular, 9, grey, 18);

  if (inv.paidAt) {
    write(`Paid on ${ukDate(inv.paidAt)}${inv.paidHow ? ` by ${inv.paidHow === 'Revolut' ? 'card through Revolut' : inv.paidHow}` : ''}. Thank you.`, regular, 10.5);
  } else {
    write('How to pay', bold, 10.5, grey);
    write('Sign in to the client area at f-w-d.co.uk/portal and press Pay. Payment is taken securely by card through Revolut.', regular, 10.5);
  }

  page.drawText('FWD Thinking Solutions Limited  |  Registered in England and Wales, company number 17584500  |  f-w-d.co.uk', {
    x: MARGIN, y: 30, size: 8, font: regular, color: grey,
  });
  return pdf.save();
}
