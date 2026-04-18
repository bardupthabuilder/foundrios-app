import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

function toCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',')
  const rows = data.map(row => columns.map(col => {
    const val = row[col]
    if (val === null || val === undefined) return ''
    const str = String(val)
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }).join(','))
  return [header, ...rows].join('\n')
}

const TYPE_CONFIGS: Record<string, { table: string; columns: string[] }> = {
  leads: {
    table: 'leads',
    columns: ['id', 'name', 'email', 'phone', 'source', 'status', 'score', 'created_at'],
  },
  clients: {
    table: 'clients',
    columns: ['id', 'name', 'company_name', 'email', 'phone', 'city', 'created_at'],
  },
  projects: {
    table: 'projects',
    columns: ['id', 'name', 'status', 'budget_cents', 'hourly_rate_cents', 'start_date', 'end_date', 'created_at'],
  },
  invoices: {
    table: 'invoices',
    columns: ['id', 'title', 'status', 'amount_excl_vat', 'vat_pct', 'issue_date', 'due_date', 'paid_at', 'created_at'],
  },
  quotes: {
    table: 'quotes',
    columns: ['id', 'title', 'status', 'amount_excl_vat', 'vat_pct', 'valid_until', 'created_at'],
  },
}

export async function GET(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format')

  if (!type || !TYPE_CONFIGS[type]) {
    return NextResponse.json(
      { error: 'Ongeldig type. Kies uit: leads, clients, projects, invoices, quotes' },
      { status: 400 }
    )
  }

  if (format !== 'csv') {
    return NextResponse.json(
      { error: 'Ongeldig formaat. Alleen csv wordt ondersteund.' },
      { status: 400 }
    )
  }

  const config = TYPE_CONFIGS[type]
  const supabase = await createClient()

  // Use type assertion for dynamic table name — validated above via TYPE_CONFIGS lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(config.table)
    .select(config.columns.join(', '))
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  const csv = toCSV((data ?? []) as Record<string, unknown>[], config.columns)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-export.csv"`,
    },
  })
}
