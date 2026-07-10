/**
 * Demo-data voor een hoveniersbedrijf.
 *
 * Eén bron voor beide demo-ingangen:
 *  - POST /api/demo-seed        → vult het eigen (lege) account
 *  - POST /api/demo/quick-start → maakt een wegwerp-demoaccount aan
 *
 * De data volgt bewust de volledige geldstroom, zodat een nieuwe gebruiker in
 * één oogopslag ziet hoe FoundriOS werkt:
 *
 *   aanvraag → offerte → klus → planning → werkbon → uren → factuur → onderhoud
 *
 * Alles is aan elkaar gekoppeld (lead_id, client_id, project_id, quote_id).
 * Losse records laten de kern van het systeem juist niet zien.
 *
 * Aantallen blijven binnen de gratis limieten (zie lib/limits.ts), zodat een
 * demo-account niet meteen over zijn grens zit.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const euro = (amount: number) => Math.round(amount * 100)
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0]
const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export async function seedDemoTenant(client: any, tenantId: string): Promise<void> {
  // Elke insert wordt gecontroleerd. De vorige seeders negeerden fouten stil,
  // waardoor een schemafout een half gevuld demo-account opleverde zonder melding.
  async function insert(table: string, row: Record<string, unknown>): Promise<string> {
    const { data, error } = await client
      .from(table)
      .insert({ ...row, tenant_id: tenantId })
      .select('id')
      .single()

    if (error) throw new Error(`${table}: ${error.message}`)
    return (data as { id: string }).id
  }

  async function insertChild(table: string, row: Record<string, unknown>): Promise<void> {
    const { error } = await client.from(table).insert(row)
    if (error) throw new Error(`${table}: ${error.message}`)
  }

  // ── Medewerkers ─────────────────────────────────────────────────────────────
  // Gratis tier: eigenaar + 1 medewerker. `name` is NOT NULL, `full_name` is de
  // nieuwere kolom — beide vullen.
  const eigenaarId = await insert('employees', {
    name: 'Kevin Smit', full_name: 'Kevin Smit', role: 'eigenaar',
    email: 'kevin@demo.nl', phone: '0600000001',
    hourly_cost_cents: euro(45), color: '#22c55e', is_active: true,
  })
  const monteurId = await insert('employees', {
    name: 'Tom de Vries', full_name: 'Tom de Vries', role: 'monteur',
    email: 'tom@demo.nl', phone: '0600000002',
    hourly_cost_cents: euro(42), color: '#3b82f6', is_active: true,
  })

  // ── Aanvragen ───────────────────────────────────────────────────────────────
  // `channel` kent 'form' niet; formulier-/advertentie-aanvragen loggen als 'system'.
  const martensLeadId = await insert('leads', {
    name: 'Familie Martens', email: 'martens@outlook.com', phone: '0611223344',
    source: 'form', status: 'won', pipeline_stage: 'gewonnen',
    ai_score: 92, ai_label: 'hot', urgency: 'high',
    ai_summary: 'Complete achtertuin inclusief overkapping. Budget €18.000. Klus loopt.',
    intent: 'Tuin + overkapping',
  })
  await insertChild('lead_messages', {
    tenant_id: tenantId, lead_id: martensLeadId, direction: 'inbound', channel: 'system',
    content: 'We willen graag onze achtertuin compleet laten doen inclusief een overkapping. Budget circa €18.000.',
  })

  const vanDijkLeadId = await insert('leads', {
    name: 'Peter van Dijk', email: 'peter@vandijk.nl', phone: '0612345678',
    source: 'form', status: 'hot', pipeline_stage: 'offerte',
    ai_score: 85, ai_label: 'hot', urgency: 'high',
    ai_summary: 'Wil complete tuinrenovatie, budget rond €12.000. Dringend — voor de zomer klaar.',
    intent: 'Tuinrenovatie compleet', budget_estimate: '± €12.000',
  })
  await insertChild('lead_messages', {
    tenant_id: tenantId, lead_id: vanDijkLeadId, direction: 'inbound', channel: 'system',
    content: 'Goedemiddag, wij willen onze achtertuin compleet laten renoveren. Nieuw terras, beplanting en verlichting. Budget ca. €12.000.',
  })

  const deGrootLeadId = await insert('leads', {
    name: 'Lisa de Groot', phone: '0687654321',
    source: 'whatsapp', status: 'warm', pipeline_stage: 'gekwalificeerd',
    ai_score: 62, ai_label: 'warm', urgency: 'medium',
    ai_summary: 'Interesse in structureel tuinonderhoud, nog geen concreet budget.',
    intent: 'Structureel tuinonderhoud',
  })
  await insertChild('lead_messages', {
    tenant_id: tenantId, lead_id: deGrootLeadId, direction: 'inbound', channel: 'whatsapp',
    content: 'Hoi, ik zoek iemand voor structureel tuinonderhoud. Hoe werkt dat bij jullie?',
  })

  await insert('leads', {
    name: 'Mark Hendriks', email: 'mark.h@gmail.com',
    source: 'meta_lead_ads', status: 'new', pipeline_stage: 'nieuw',
    ai_score: 45, ai_label: 'warm', urgency: 'low',
    ai_summary: 'Via Meta Ads formulier, weinig details ingevuld.',
    intent: 'Informatie opvragen',
  })

  // ── Klanten (gewonnen aanvraag wordt klant) ─────────────────────────────────
  const martensClientId = await insert('clients', {
    name: 'Familie Martens', company_name: 'Familie Martens', contact_name: 'Erik Martens',
    email: 'martens@outlook.com', phone: '0611223344',
    address: 'Dorpsstraat 12', city: 'Amstelveen', lead_id: martensLeadId,
    notes: 'Tuin op het zuiden. Hond aanwezig — poort altijd sluiten.',
  })
  const waardClientId = await insert('clients', {
    name: 'Woningcorporatie De Waard', company_name: 'Woningcorporatie De Waard',
    contact_name: 'Sandra Bakker', email: 'info@dewaard.nl', phone: '0201234567',
    address: 'Hoofdweg 45', city: 'Amsterdam',
    notes: 'Onderhoudscontract, factuur altijd op inkoopnummer.',
  })

  // ── Klussen ─────────────────────────────────────────────────────────────────
  const martensProjectId = await insert('projects', {
    name: 'Tuinrenovatie Martens', client_id: martensClientId, lead_id: martensLeadId,
    description: 'Complete achtertuin: terras, beplanting, verlichting en overkapping.',
    address: 'Dorpsstraat 12', city: 'Amstelveen',
    status: 'actief', project_type: 'vakwerk',
    start_date: daysAgo(7), end_date: daysAhead(14),
    budget_cents: euro(18000), hourly_rate_cents: euro(65),
  })
  const waardProjectId = await insert('projects', {
    name: 'Groenonderhoud Q2 De Waard', client_id: waardClientId,
    description: 'Kwartaalonderhoud: snoeien, onkruid, hagen.',
    address: 'Hoofdweg 45', city: 'Amsterdam',
    status: 'actief', project_type: 'onderhoud',
    start_date: daysAgo(14),
    budget_cents: euro(8500), hourly_rate_cents: euro(55),
  })

  for (const [i, title] of [
    'Grondwerk en egaliseren',
    'Terras leggen',
    'Overkapping plaatsen',
    'Beplanting en verlichting',
  ].entries()) {
    await insertChild('project_tasks', {
      tenant_id: tenantId, project_id: martensProjectId,
      title, done: i < 2, sort_order: i + 1,
    })
  }

  // ── Offertes ────────────────────────────────────────────────────────────────
  // 1) Geaccepteerde offerte die al een klus is geworden.
  const martensQuoteId = await insert('quotes', {
    quote_number: 'OFF-0001', client_id: martensClientId, project_id: martensProjectId,
    title: 'Complete tuinrenovatie incl. overkapping',
    description: 'Terras, beplanting, verlichting en houten overkapping.',
    status: 'akkoord', vat_pct: 21,
    amount_excl_vat: euro(18000), amount_incl_vat: euro(21780),
    valid_until: daysAhead(7), sent_at: isoDaysAgo(12), accepted_at: isoDaysAgo(9),
  })
  for (const [i, item] of [
    { description: 'Grondwerk en egaliseren', quantity: 1, unit: 'post', price: 2400 },
    { description: 'Terras leggen', quantity: 45, unit: 'm2', price: 120 },
    { description: 'Houten overkapping', quantity: 1, unit: 'stuk', price: 7200 },
    { description: 'Beplanting en verlichting', quantity: 1, unit: 'post', price: 3000 },
  ].entries()) {
    await insertChild('quote_items', {
      quote_id: martensQuoteId, description: item.description,
      quantity: item.quantity, unit: item.unit,
      unit_price_cents: euro(item.price), total_cents: euro(item.price * item.quantity),
      sort_order: i + 1,
    })
  }

  // 2) Verstuurde offerte die nog opgevolgd moet worden — het geld dat blijft liggen.
  const vanDijkQuoteId = await insert('quotes', {
    quote_number: 'OFF-0002',
    title: 'Tuinrenovatie Van Dijk',
    description: 'Nieuw terras, beplanting en tuinverlichting.',
    status: 'verstuurd', vat_pct: 21,
    amount_excl_vat: euro(11500), amount_incl_vat: euro(13915),
    valid_until: daysAhead(3), sent_at: isoDaysAgo(6),
    notes: 'Opvolgen — verstuurd, nog geen reactie. Verloopt binnenkort.',
  })
  for (const [i, item] of [
    { description: 'Terras 30 m2 incl. fundering', quantity: 30, unit: 'm2', price: 135 },
    { description: 'Beplanting borders', quantity: 1, unit: 'post', price: 4450 },
    { description: 'Tuinverlichting incl. aanleg', quantity: 1, unit: 'post', price: 3000 },
  ].entries()) {
    await insertChild('quote_items', {
      quote_id: vanDijkQuoteId, description: item.description,
      quantity: item.quantity, unit: item.unit,
      unit_price_cents: euro(item.price), total_cents: euro(item.price * item.quantity),
      sort_order: i + 1,
    })
  }

  // ── Planning ────────────────────────────────────────────────────────────────
  await insertChild('planning_entries', { tenant_id: tenantId, employee_id: eigenaarId, project_id: martensProjectId, planned_date: daysAgo(0), planned_hours: 8 })
  await insertChild('planning_entries', { tenant_id: tenantId, employee_id: monteurId, project_id: waardProjectId, planned_date: daysAgo(0), planned_hours: 8 })
  await insertChild('planning_entries', { tenant_id: tenantId, employee_id: eigenaarId, project_id: martensProjectId, planned_date: daysAhead(1), planned_hours: 6 })
  await insertChild('planning_entries', { tenant_id: tenantId, employee_id: monteurId, project_id: martensProjectId, planned_date: daysAhead(2), planned_hours: 8 })

  // ── Werkbon (afgerond, met uren en materiaal) ───────────────────────────────
  const werkbonId = await insert('work_orders', {
    work_order_number: 'WB-0001', project_id: martensProjectId, client_id: martensClientId,
    title: 'Terras leggen en grondwerk afronden',
    description: 'Grondwerk geëgaliseerd, terras van 45 m2 gelegd.',
    date: daysAgo(2), status: 'afgerond',
    signed_at: isoDaysAgo(2), signed_by: 'E. Martens',
    notes: 'Klant tevreden. Overkapping volgende week.',
  })
  await insertChild('work_order_hours', { work_order_id: werkbonId, employee_id: eigenaarId, employee_name: 'Kevin Smit', hours: 8, hourly_rate_cents: euro(65), total_cents: euro(520), description: 'Grondwerk + terras', sort_order: 1 })
  await insertChild('work_order_hours', { work_order_id: werkbonId, employee_id: monteurId, employee_name: 'Tom de Vries', hours: 8, hourly_rate_cents: euro(55), total_cents: euro(440), description: 'Assistentie terras', sort_order: 2 })
  await insertChild('work_order_materials', { work_order_id: werkbonId, description: 'Terrastegels 60x60', quantity: 125, unit: 'stuk', unit_price_cents: euro(8.5), total_cents: euro(1062.5), sort_order: 1 })
  await insertChild('work_order_materials', { work_order_id: werkbonId, description: 'Stabilisatiezand', quantity: 3, unit: 'm3', unit_price_cents: euro(45), total_cents: euro(135), sort_order: 2 })

  // ── Uren en materiaal ───────────────────────────────────────────────────────
  await insertChild('time_entries', { tenant_id: tenantId, employee_id: eigenaarId, project_id: martensProjectId, entry_date: daysAgo(1), hours: 8, description: 'Overkapping voorbereiden', is_billable: true, status: 'goedgekeurd' })
  await insertChild('time_entries', { tenant_id: tenantId, employee_id: eigenaarId, project_id: martensProjectId, entry_date: daysAgo(2), hours: 8, description: 'Grondwerk + terras', is_billable: true, status: 'goedgekeurd' })
  await insertChild('time_entries', { tenant_id: tenantId, employee_id: monteurId, project_id: martensProjectId, entry_date: daysAgo(2), hours: 8, description: 'Assistentie terras', is_billable: true, status: 'goedgekeurd' })
  await insertChild('time_entries', { tenant_id: tenantId, employee_id: monteurId, project_id: waardProjectId, entry_date: daysAgo(1), hours: 7.5, description: 'Snoeiwerk hagen', is_billable: true, status: 'ingevoerd' })

  // entry_date is NOT NULL zonder default.
  await insertChild('material_entries', { tenant_id: tenantId, project_id: martensProjectId, employee_id: eigenaarId, entry_date: daysAgo(2), description: 'Terrastegels 60x60', quantity: 125, unit: 'stuk', unit_price_cents: euro(8.5), total_cents: euro(1062.5) })

  // ── Facturen ────────────────────────────────────────────────────────────────
  // Een betaalde aanbetaling, en een openstaande factuur die te laat is.
  const year = new Date().getFullYear()
  await insert('invoices', {
    invoice_number: `FAC-${year}-0001`,
    client_id: martensClientId, project_id: martensProjectId, quote_id: martensQuoteId,
    title: 'Aanbetaling tuinrenovatie (25%)', client_name: 'Familie Martens',
    status: 'paid', vat_pct: 21,
    amount_excl_vat: euro(4500), amount_incl_vat: euro(5445),
    issue_date: daysAgo(9), due_date: daysAhead(21), paid_at: isoDaysAgo(6),
  })
  await insert('invoices', {
    invoice_number: `FAC-${year}-0002`,
    client_id: waardClientId, project_id: waardProjectId,
    title: 'Groenonderhoud Q2 — termijn 1', client_name: 'Woningcorporatie De Waard',
    status: 'overdue', vat_pct: 21,
    amount_excl_vat: euro(2125), amount_incl_vat: euro(2571.25),
    issue_date: daysAgo(45), due_date: daysAgo(15),
  })

  // ── Onderhoudscontract (terugkerende omzet) ─────────────────────────────────
  await insert('maintenance_contracts', {
    client_id: waardClientId, project_id: waardProjectId,
    title: 'Groenonderhoud De Waard', description: 'Kwartaalonderhoud complex Hoofdweg.',
    frequency: 'quarterly', price_cents: euro(2125), mrr_cents: euro(708),
    status: 'active', next_visit: daysAhead(21),
    contract_start: daysAgo(120), visit_count: 2,
  })
}
