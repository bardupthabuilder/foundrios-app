import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

/**
 * POST /api/quotes/[id]/to-project
 *
 * Zet een geaccepteerde offerte om in een project ("klus"). Dit is de schakel
 * tussen verkoop en uitvoering: offerte gewonnen → klus die je kunt plannen,
 * met werkbonnen, uren en uiteindelijk een factuur.
 *
 * De offerte krijgt het project_id terug, zodat facturatie later weet bij welke
 * klus deze hoort. Een offerte die al een project heeft wordt niet gedupliceerd.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try {
    tenantId = (await requireTenant()).tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*, clients(id, name, company_name, address, city)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 })
  }

  if (quote.status !== 'akkoord') {
    return NextResponse.json(
      { error: 'Zet de offerte eerst op akkoord voordat je er een klus van maakt' },
      { status: 400 }
    )
  }

  // Al omgezet — geef het bestaande project terug in plaats van een duplicaat.
  if (quote.project_id) {
    const { data: existing } = await supabase
      .from('projects')
      .select('*')
      .eq('id', quote.project_id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (existing) return NextResponse.json(existing, { status: 200 })
  }

  const client = (quote as any).clients

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      tenant_id: tenantId,
      client_id: quote.client_id,
      name: quote.title,
      description: quote.description,
      address: client?.address ?? null,
      city: client?.city ?? null,
      status: 'gepland',
      // De offertewaarde excl. btw is het budget waartegen we de marge meten.
      budget_cents: quote.amount_excl_vat,
      notes: quote.notes,
    } as any)
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  const { error: linkError } = await supabase
    .from('quotes')
    .update({ project_id: project.id } as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (linkError) {
    // Het project bestaat al; de koppeling terugdraaien zou de klus weggooien.
    // Beter: project behouden en de gebruiker laten weten dat de link ontbreekt.
    return NextResponse.json(
      { ...project, warning: 'Klus aangemaakt, maar koppeling met offerte is mislukt.' },
      { status: 201 }
    )
  }

  return NextResponse.json(project, { status: 201 })
}
