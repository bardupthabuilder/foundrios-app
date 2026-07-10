import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

// GET /api/dashboard/today — aggregated "wat moet je vandaag doen"
export async function GET() {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const now = new Date()
  const todayIso = now.toISOString()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()

  const [dueActions, quotesToFollowUp, hotLeads, expiringQuotes, overdueInvoices, signedNotConverted] = await Promise.all([
    // Beloofde acties waarvan de datum verstreken is. Dit is de kern van "Vandaag":
    // niet wat er mis is, maar wat jíj hebt toegezegd te doen.
    supabase
      .from('leads')
      .select('id, name, next_action, next_action_at, ai_label')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("won","lost")')
      .not('next_action_at', 'is', null)
      .lte('next_action_at', todayIso)
      .order('next_action_at', { ascending: true })
      .limit(10),

    // Offertes waarvan de opvolgdatum verstreken is. Dit is het grootste lek:
    // een verstuurde offerte die niemand nabelt.
    supabase
      .from('quotes')
      .select('id, quote_number, title, follow_up_at, amount_incl_vat, clients(name, company_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'verstuurd')
      .not('follow_up_at', 'is', null)
      .lte('follow_up_at', todayIso)
      .order('follow_up_at', { ascending: true })
      .limit(10),

    // Hot leads die al 72u stilliggen. De kolom heet ai_score, niet score —
    // met 'score' gaf PostgREST een fout en bleef deze lijst altijd leeg.
    supabase
      .from('leads')
      .select('id, name, email, phone, created_at, ai_score, source')
      .eq('tenant_id', tenantId)
      .in('status', ['new', 'hot'])
      .lt('created_at', seventyTwoHoursAgo)
      .order('ai_score', { ascending: false, nullsFirst: false })
      .limit(10),

    // Offertes die binnen 3 dagen verlopen
    supabase
      .from('quotes')
      .select('id, quote_number, title, valid_until, amount_incl_vat, client_id, clients(name, company_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'verstuurd')
      .gte('valid_until', todayIso)
      .lte('valid_until', threeDaysFromNow)
      .order('valid_until', { ascending: true })
      .limit(10),

    // Facturen overdue. Alleen 'sent' bestaat in de enum; de rest was dode conditie.
    supabase
      .from('invoices')
      .select('id, invoice_number, amount_incl_vat, amount_excl_vat, due_date, client_id, clients(name, company_name)')
      .eq('tenant_id', tenantId)
      .in('status', ['sent', 'overdue'])
      .lt('due_date', todayIso)
      .order('due_date', { ascending: true })
      .limit(10),

    // Geaccepteerde offertes zonder gekoppelde klus
    supabase
      .from('quotes')
      .select('id, quote_number, title, signed_at, signature_name, client_id, project_id, clients(name, company_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'akkoord')
      .is('project_id', null)
      .order('signed_at', { ascending: false, nullsFirst: false })
      .limit(10),
  ])

  // Een query die faalt levert data=null. Stil terugvallen op [] verbergt de fout,
  // precies wat de score-bug een jaar lang onzichtbaar hield.
  for (const [name, res] of Object.entries({ dueActions, quotesToFollowUp, hotLeads, expiringQuotes, overdueInvoices, signedNotConverted })) {
    if (res.error) console.error(`dashboard/today: ${name} mislukt:`, res.error.message)
  }

  return NextResponse.json({
    due_actions: dueActions.data || [],
    quotes_to_follow_up: quotesToFollowUp.data || [],
    hot_leads: hotLeads.data || [],
    expiring_quotes: expiringQuotes.data || [],
    overdue_invoices: overdueInvoices.data || [],
    signed_not_converted: signedNotConverted.data || [],
    counts: {
      due_actions: dueActions.data?.length || 0,
      quotes_to_follow_up: quotesToFollowUp.data?.length || 0,
      hot_leads: hotLeads.data?.length || 0,
      expiring_quotes: expiringQuotes.data?.length || 0,
      overdue_invoices: overdueInvoices.data?.length || 0,
      signed_not_converted: signedNotConverted.data?.length || 0,
    },
  })
}
