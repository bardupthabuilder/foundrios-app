// Variabelen-context resolver: bouwt een vars-object op basis van geselecteerde klant/project/offerte.
// UI gebruikt dit om dropdowns te tonen en automatisch in te vullen.

export type ClientCtx = {
  id: string
  name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
}

export type ProjectCtx = {
  id: string
  name?: string | null
  project_address?: string | null
  start_date?: string | null
  end_date?: string | null
}

export type QuoteCtx = {
  id: string
  quote_number?: string | null
  amount_incl_vat?: number | null
  valid_until?: string | null
  sign_token?: string | null
}

export type InvoiceCtx = {
  id: string
  invoice_number?: string | null
  amount_incl_vat?: number | null
  due_date?: string | null
}

export type TenantCtx = {
  name?: string | null
  email?: string | null
  owner_phone?: string | null
  website?: string | null
}

function formatEuro(cents: number | null | undefined): string {
  if (cents == null) return ''
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function buildVars(opts: {
  client?: ClientCtx | null
  project?: ProjectCtx | null
  quote?: QuoteCtx | null
  invoice?: InvoiceCtx | null
  tenant?: TenantCtx | null
  origin?: string
}): Record<string, string> {
  const { client, project, quote, invoice, tenant, origin } = opts
  const vars: Record<string, string> = {}

  if (client) {
    vars.client_name = client.name || client.company_name || ''
    vars.client_company = client.company_name || ''
    vars.client_email = client.email || ''
    vars.client_phone = client.phone || ''
    vars.client_address = client.address || ''
    vars.client_city = client.city || ''
  }

  if (project) {
    vars.project_name = project.name || ''
    vars.project_address = project.project_address || ''
    vars.project_city = client?.city || ''
  }

  if (quote) {
    vars.quote_number = quote.quote_number || ''
    vars.quote_amount = formatEuro(quote.amount_incl_vat)
    vars.valid_until = formatDate(quote.valid_until)
    if (quote.sign_token && origin) {
      vars.quote_url = `${origin}/q/${quote.sign_token}`
    }
  }

  if (invoice) {
    vars.invoice_number = invoice.invoice_number || ''
    vars.invoice_amount = formatEuro(invoice.amount_incl_vat)
    vars.due_date = formatDate(invoice.due_date)
  }

  if (tenant) {
    vars.tenant_name = tenant.name || ''
    vars.tenant_email = tenant.email || ''
    vars.tenant_phone = tenant.owner_phone || ''
    vars.tenant_website = tenant.website || ''
  }

  return vars
}

export const TYPE_LABELS: Record<string, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  content: 'Content (LinkedIn / FB)',
  reel: 'Reel scripts',
  offerte: 'Offerte tekst',
  werkbon: 'Werkbon',
  campagne: 'Campagne',
  sop: 'SOP',
}

export const TYPE_ORDER: string[] = ['email', 'whatsapp', 'content', 'reel', 'offerte', 'werkbon', 'sop', 'campagne']
