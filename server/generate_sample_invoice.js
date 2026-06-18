import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `
<svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Fonts definitions for local rendering -->
  <style>
    .title { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 800; fill: #1e293b; }
    .company-name { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; fill: #5A2D72; }
    .company-sub { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; fill: #64748b; font-weight: 500; }
    .section-title { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; fill: #64748b; letter-spacing: 1px; }
    .body-text { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; fill: #334155; font-weight: 500; }
    .body-bold { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; fill: #1e293b; font-weight: 700; }
    .meta-label { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; fill: #64748b; text-transform: uppercase; }
    .meta-value { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; fill: #1e293b; }
    .table-hdr { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; fill: #475569; text-transform: uppercase; }
    .total-title { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; fill: #1e293b; }
    .total-value { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; fill: #5A2D72; }
    .footer-text { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; fill: #94a3b8; font-weight: 500; text-anchor: middle; }
  </style>

  <!-- Background Card -->
  <rect width="800" height="1000" rx="16" fill="#FFFFFF"/>
  <rect x="0" y="0" width="800" height="15" fill="#5A2D72"/>

  <!-- Top Header Row -->
  <text x="50" y="80" class="company-name">Apex Tech Solutions</text>
  <text x="50" y="102" class="company-sub">Premium IT Consulting &amp; Professional Services</text>
  
  <text x="750" y="80" text-anchor="end" class="title">INVOICE</text>

  <!-- Divider -->
  <line x1="50" y1="130" x2="750" y2="130" stroke="#f1f5f9" stroke-width="2"/>

  <!-- Info Grid -->
  <!-- Supplier/From Column -->
  <text x="50" y="170" class="section-title">SUPPLIER</text>
  <text x="50" y="195" class="body-bold">Apex Tech Solutions</text>
  <text x="50" y="215" class="body-text">123 Innovation Way, Tech District</text>
  <text x="50" y="235" class="body-text">Manila, Philippines 1000</text>
  <text x="50" y="255" class="body-text">billing@apextechsolutions.com</text>

  <!-- Invoice Meta Column -->
  <text x="450" y="170" class="section-title">INVOICE DETAILS</text>
  
  <text x="450" y="195" class="meta-label">Invoice Number</text>
  <text x="450" y="215" class="meta-value">INV-2026-089</text>

  <text x="620" y="195" class="meta-label">Invoice Date</text>
  <text x="620" y="215" class="meta-value">05/20/2026</text>

  <text x="450" y="260" class="meta-label">Due Date</text>
  <text x="450" y="280" class="meta-value">06/20/2026</text>

  <text x="620" y="260" class="meta-label">Category</text>
  <text x="620" y="280" class="meta-value">Services</text>

  <!-- Table Header -->
  <rect x="50" y="330" width="700" height="40" rx="8" fill="#f8fafc"/>
  <text x="70" y="354" class="table-hdr">Description</text>
  <text x="450" y="354" text-anchor="end" class="table-hdr">Qty / Hours</text>
  <text x="580" y="354" text-anchor="end" class="table-hdr">Rate</text>
  <text x="730" y="354" text-anchor="end" class="table-hdr">Amount</text>

  <!-- Table Row 1 -->
  <text x="70" y="410" class="body-bold">Senior IT Consulting Services</text>
  <text x="70" y="430" class="company-sub">System architecture and cloud migration consulting</text>
  <text x="450" y="410" text-anchor="end" class="body-text">5.00</text>
  <text x="580" y="410" text-anchor="end" class="body-text">₱1,500.00</text>
  <text x="730" y="410" text-anchor="end" class="body-bold">₱7,500.00</text>
  <line x1="50" y1="450" x2="750" y2="450" stroke="#f1f5f9" stroke-width="1"/>

  <!-- Table Row 2 -->
  <text x="70" y="490" class="body-bold">Web Development &amp; Professional Support</text>
  <text x="70" y="510" class="company-sub">Custom API development and front-end integration</text>
  <text x="450" y="490" text-anchor="end" class="body-text">1.00</text>
  <text x="580" y="490" text-anchor="end" class="body-text">₱5,000.00</text>
  <text x="730" y="490" text-anchor="end" class="body-bold">₱5,000.00</text>
  <line x1="50" y1="530" x2="750" y2="530" stroke="#f1f5f9" stroke-width="1"/>

  <!-- Subtotal and Total Block -->
  <text x="500" y="580" class="body-text">Subtotal</text>
  <text x="730" y="580" text-anchor="end" class="body-text">₱12,500.00</text>

  <text x="500" y="610" class="body-text">Tax (0%)</text>
  <text x="730" y="610" text-anchor="end" class="body-text">₱0.00</text>

  <line x1="500" y1="635" x2="750" y2="635" stroke="#e2e8f0" stroke-width="1"/>

  <text x="500" y="665" class="total-title">Total Amount</text>
  <text x="730" y="665" text-anchor="end" class="total-value">₱12,500.00</text>

  <!-- Payment / Notes Box -->
  <rect x="50" y="720" width="700" height="120" rx="8" fill="#fafafa" stroke="#f1f5f9" stroke-width="1.5"/>
  <text x="70" y="750" class="section-title">PAYMENT INSTRUCTIONS &amp; NOTES</text>
  <text x="70" y="775" class="body-bold">Account Name: Apex Tech Solutions</text>
  <text x="70" y="795" class="body-text">Bank Transfer to Bank of the Philippine Islands (BPI)</text>
  <text x="70" y="815" class="company-sub">Note: Please quote invoice number INV-2026-089 when making bank transfer payments.</text>

  <!-- Footer -->
  <text x="400" y="940" class="footer-text">Apex Tech Solutions • 123 Innovation Way, Manila, PH • +63 2 8123 4567</text>
  <text x="400" y="960" class="footer-text">Thank you for your business!</text>
</svg>
`;

async function main() {
  const clientPublicDir = path.join('..', 'client', 'public');
  if (!fs.existsSync(clientPublicDir)) {
    fs.mkdirSync(clientPublicDir, { recursive: true });
  }

  const outputPath = path.join(clientPublicDir, 'invoice_sample.png');
  console.log(`Rendering SVG to PNG: ${outputPath}...`);

  try {
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(outputPath);
    console.log('Success! Sample invoice generated at client/public/invoice_sample.png');
  } catch (err) {
    console.error('Error generating image:', err);
  }
}

main();
