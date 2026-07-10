import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { buildVars } from '@/lib/templates/variables'

// GET /api/templates/context?client_id=...&project_id=...&quote_id=...&invoice_id=...
// Geeft gerenderde variabelen-set voor template preview.
export async function GET(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { searchParams } = new URL(request.url)

  const clientId = searchParams.get('client_id')
  const projectId = searchParams.get('project_id')
  const quoteId = searchParams.get('quote_id')
  const invoiceId = searchParams.get('invoice_id')
  const origin = new URL(request.url).origin

  const [client, project, quote, invoice, tenant] = await Promise.all([
    clientId
      ? supabase.from('clients').select('id, name, company_name, email, phone, address, city').eq('id', clientId).eq('tenant_id', tenantId).maybeSingle()
      : Promise.resolve({ data: null }),
    projectId
      ? supabase.from('projects').select('id, name, project_address, start_date, end_date').eq('id', projectId).eq('tenant_id', tenantId).maybeSingle()
      : Promise.resolve({ data: null }),
    quoteId
      ? supabase.from('quotes').select('id, quote_number, amount_incl_vat, valid_until, sign_token').eq('id', quoteId).eq('tenant_id', tenantId).maybeSingle()
      : Promise.resolve({ data: null }),
    invoiceId
      ? supabase.from('invoices').select('id, invoice_number, amount_incl_vat, due_date').eq('id', invoiceId).eq('tenant_id', tenantId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('tenants').select('name, email, owner_phone, website').eq('id', tenantId).maybeSingle(),
  ])

  const vars = buildVars({
    client: client.data,
    project: project.data,
    quote: quote.data,
    invoice: invoice.data,
    tenant: tenant.data,
    origin,
  })

  return NextResponse.json({ vars })
}

// Lookup lists for ContextPicker
export async function POST(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const body = await request.json().catch(() => ({}))
  const want: string[] = body.want || ['clients', 'projects', 'quotes', 'invoices']

  const result: Record<string, unknown[]> = {}

  await Promise.all([
    want.includes('clients')
      ? supabase.from('clients').select('id, name, company_name').eq('tenant_id', tenantId).order('name').limit(100).then((r: any) => { result.clients = r.data ?? [] })
      : Promise.resolve(),
    want.includes('projects')
      ? supabase.from('projects').select('id, name, client_id').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(100).then((r: any) => { result.projects = r.data ?? [] })
      : Promise.resolve(),
    want.includes('quotes')
      ? supabase.from('quotes').select('id, quote_number, title, client_id').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(50).then((r: any) => { result.quotes = r.data ?? [] })
      : Promise.resolve(),
    want.includes('invoices')
      ? supabase.from('invoices').select('id, invoice_number, client_id').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(50).then((r: any) => { result.invoices = r.data ?? [] })
      : Promise.resolve(),
  ])

  return NextResponse.json(result)
}
