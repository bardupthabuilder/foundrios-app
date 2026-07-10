import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'

interface QuoteItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  subtotal: number
}

interface QuoteData {
  prospect_name: string
  company_name: string
  quote_items: QuoteItem[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  validity_days: number
  payment_terms: string
  notes: string
}

interface TenantBranding {
  companyName: string
  niche: string | null
  region: string | null
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

function buildQuoteHtml(quote: QuoteData, branding: TenantBranding): string {
  const today = new Date()
  const validUntil = new Date(today)
  validUntil.setDate(today.getDate() + quote.validity_days)

  const formatDate = (d: Date) =>
    d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const itemRows = quote.quote_items
    .map(
      (item) => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="num">${item.quantity}</td>
      <td class="unit">${item.unit}</td>
      <td class="num">${formatEuro(item.unit_price)}</td>
      <td class="num">${formatEuro(item.subtotal)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 40px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .company-name { font-size: 22px; font-weight: 700; color: #1a1a1a; }
  .company-meta { font-size: 11px; color: #666; margin-top: 4px; }
  .badge { background: #16a34a; color: white; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

  .divider { border: none; border-top: 2px solid #e5e7eb; margin: 24px 0; }

  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .meta-block label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; display: block; margin-bottom: 4px; }
  .meta-block .value { font-size: 13px; color: #1a1a1a; }
  .meta-block .value.large { font-size: 15px; font-weight: 600; }

  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin-bottom: 12px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead tr { background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
  thead th.num { text-align: right; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:last-child { border-bottom: none; }
  tbody td { padding: 10px 12px; vertical-align: top; }
  td.desc { color: #1a1a1a; }
  td.num { text-align: right; color: #374151; }
  td.unit { color: #6b7280; font-size: 12px; }

  .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
  .totals-table { width: 280px; }
  .totals-table td { padding: 5px 0; font-size: 13px; }
  .totals-table td:last-child { text-align: right; }
  .totals-table .total-row td { font-size: 15px; font-weight: 700; border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 4px; }
  .totals-table .muted { color: #6b7280; }

  .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px; }
  .terms-block label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; display: block; margin-bottom: 6px; }
  .terms-block p { font-size: 12px; color: #374151; line-height: 1.5; }

  .signature { margin-top: 48px; }
  .signature label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; display: block; margin-bottom: 8px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-box { border-top: 1px solid #d1d5db; padding-top: 8px; }
  .sig-box p { font-size: 11px; color: #9ca3af; }

  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 10px; color: #9ca3af; text-align: center; }

  @media print { body { padding: 0; } }
</style>
</head>
<body>

  <div class="header">
    <div>
      <div class="company-name">${branding.companyName}</div>
      <div class="company-meta">${[branding.niche, branding.region].filter(Boolean).join(' · ')}</div>
    </div>
    <div class="badge">Offerte</div>
  </div>

  <hr class="divider">

  <div class="meta-grid">
    <div class="meta-block">
      <label>Opgesteld voor</label>
      <div class="value large">${quote.prospect_name}</div>
      <div class="value" style="color:#6b7280; font-size:12px;">${quote.company_name}</div>
    </div>
    <div class="meta-block">
      <label>Offertedatum</label>
      <div class="value">${formatDate(today)}</div>
      <div style="margin-top:12px;">
        <label>Geldig tot</label>
        <div class="value">${formatDate(validUntil)} (${quote.validity_days} dagen)</div>
      </div>
    </div>
  </div>

  <h2>Offerteregels</h2>

  <table>
    <thead>
      <tr>
        <th>Omschrijving</th>
        <th class="num">Aantal</th>
        <th>Eenheid</th>
        <th class="num">Eenheidsprijs</th>
        <th class="num">Subtotaal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td class="muted">Subtotaal (excl. BTW)</td>
        <td>${formatEuro(quote.subtotal)}</td>
      </tr>
      <tr>
        <td class="muted">BTW ${quote.vat_rate}%</td>
        <td>${formatEuro(quote.vat_amount)}</td>
      </tr>
      <tr class="total-row">
        <td>Totaal</td>
        <td>${formatEuro(quote.total)}</td>
      </tr>
    </table>
  </div>

  <div class="terms-grid">
    <div class="terms-block">
      <label>Betaalvoorwaarden</label>
      <p>${quote.payment_terms}</p>
    </div>
    ${
      quote.notes
        ? `<div class="terms-block">
      <label>Opmerkingen</label>
      <p>${quote.notes}</p>
    </div>`
        : ''
    }
  </div>

  <div class="signature">
    <label>Akkoord &amp; Handtekening</label>
    <div class="sig-grid">
      <div class="sig-box">
        <p>Naam opdrachtgever</p>
      </div>
      <div class="sig-box">
        <p>Datum &amp; handtekening</p>
      </div>
    </div>
  </div>

  <div class="footer">
    Deze offerte is opgesteld door ${branding.companyName} en is geldig tot ${formatDate(validUntil)}.
    Bij akkoord ontvangt u een bevestiging en factuur.
  </div>

</body>
</html>`
}

async function renderPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless as boolean,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

async function uploadToStorage(
  pdfBuffer: Buffer,
  tenantId: string,
  quoteId: string
): Promise<string> {
  const supabase = createWorkforceServiceClient()
  const filePath = `${tenantId}/${quoteId}.pdf`

  const { error } = await supabase.storage.from('quotes').upload(filePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: false,
  })

  if (error) throw new Error(`PDF upload mislukt: ${error.message}`)

  // Generate signed URL valid for 1 year (tenant downloads on demand)
  const { data: signedData, error: signError } = await supabase.storage
    .from('quotes')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365)

  if (signError || !signedData) {
    throw new Error(`Signed URL generatie mislukt: ${signError?.message}`)
  }

  return signedData.signedUrl
}

async function persistQuoteRecord(
  tenantId: string,
  prospectId: string,
  quoteData: QuoteData,
  pdfUrl: string,
  quoteId: string,
  validityDays: number
): Promise<void> {
  const supabase = createWorkforceServiceClient()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + validityDays)

  await supabase.from('fw_quotes').insert({
    id: quoteId,
    tenant_id: tenantId,
    prospect_id: prospectId || null,
    quote_data: quoteData as unknown as Record<string, unknown>,
    pdf_url: pdfUrl,
    status: 'draft',
    valid_until: validUntil.toISOString(),
  })
}

export async function generateQuotePdf(
  quoteData: QuoteData,
  tenantId: string,
  prospectId: string
): Promise<{ pdfUrl: string; quoteId: string }> {
  const supabase = createWorkforceServiceClient()

  // 1. Fetch tenant branding
  const { data: tenant } = await supabase
    .from('fw_tenants')
    .select('name, niche, region')
    .eq('id', tenantId)
    .single()

  const branding: TenantBranding = {
    companyName: tenant?.name ?? 'Uw bedrijf',
    niche: tenant?.niche ?? null,
    region: tenant?.region ?? null,
  }

  // 2. Build HTML
  const html = buildQuoteHtml(quoteData, branding)

  // 3. Render PDF via Puppeteer
  const pdfBuffer = await renderPdf(html)

  // 4. Upload to Supabase Storage
  const quoteId = crypto.randomUUID()
  const pdfUrl = await uploadToStorage(pdfBuffer, tenantId, quoteId)

  // 5. Persist quote record
  await persistQuoteRecord(tenantId, prospectId, quoteData, pdfUrl, quoteId, quoteData.validity_days)

  return { pdfUrl, quoteId }
}
