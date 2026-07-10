/**
 * FoundriOS — Groeneveld Tuinen testdata seeder
 *
 * Vult de workspace met realistische GT-data (leads, klanten, projecten).
 * Markeert alles met is_demo=true — verwijderbaar via demo-toggle of opnieuw runnen.
 *
 * Run:
 *   SEED_USER_EMAIL=info@bartgroeneveld.com npx tsx scripts/seed-gt-data.ts
 *
 * Of met expliciete tenant:
 *   SEED_TENANT_ID=<uuid> npx tsx scripts/seed-gt-data.ts
 *
 * Vereist env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)
const daysAgoIso = (n: number) => daysAgo(n).toISOString()
const daysAgoDate = (n: number) => daysAgo(n).toISOString().split('T')[0]

async function resolveTenantId(): Promise<string> {
  if (process.env.SEED_TENANT_ID) return process.env.SEED_TENANT_ID

  const email = process.env.SEED_USER_EMAIL
  if (!email) throw new Error('Set SEED_TENANT_ID or SEED_USER_EMAIL')

  const { data: users, error: userErr } = await sb.auth.admin.listUsers()
  if (userErr) throw userErr
  const user = users.users.find(u => u.email === email)
  if (!user) throw new Error(`Gebruiker niet gevonden: ${email}`)

  const { data: tu, error: tuErr } = await sb
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()
  if (tuErr || !tu) throw new Error(`Geen tenant voor ${email}`)
  return tu.tenant_id as string
}

async function clearDemoData(tenantId: string) {
  const tables = ['notifications', 'revenue_snapshots', 'projects', 'clients', 'leads']
  for (const t of tables) {
    const { error } = await sb.from(t).delete().eq('tenant_id', tenantId).eq('is_demo', true)
    if (error) console.warn(`  warn clearing ${t}: ${error.message}`)
  }
}

async function seedLeads(tenantId: string) {
  const leads = [
    // Nieuwe aanvragen (hot)
    { name: 'Familie Koopman', email: 'koopman@gmail.com', phone: '0612345678', source: 'form', status: 'hot', ai_score: 91, ai_label: 'hot', ai_summary: 'Tuinrenovatie achtertuin 80m², budget €9K, wil voor augustus klaar.', urgency: 'high', intent: 'Tuinrenovatie', budget_estimate: '€8.000 – €12.000', created_at: daysAgoIso(1) },
    { name: 'Jan-Willem Verhoeven', email: 'jwverhoeven@outlook.com', phone: '0623456789', source: 'meta_lead_ads', status: 'hot', ai_score: 87, ai_label: 'hot', ai_summary: 'Bestrating voortuin + oprit, beslisser, beslist deze week.', urgency: 'high', intent: 'Bestrating', budget_estimate: '€6.000 – €8.000', created_at: daysAgoIso(2) },
    { name: 'Marianne Linders', email: 'mlinders@kpn.nl', phone: '0634567890', source: 'whatsapp', status: 'hot', ai_score: 83, ai_label: 'hot', ai_summary: 'Schutting vervangen, al eerder klant geweest, wil snel afspraak.', urgency: 'high', intent: 'Schutting', budget_estimate: '€3.000 – €5.000', created_at: daysAgoIso(3) },
    // Te kwalificeren (warm)
    { name: 'Rob Nieuwenhuis', email: 'rob.n@gmail.com', phone: '0645678901', source: 'form', status: 'warm', ai_score: 64, ai_label: 'warm', ai_summary: 'Onderhoud grote tuin, vraagt naar jaarcontract. Budget onduidelijk.', urgency: 'medium', intent: 'Tuinonderhoud', budget_estimate: 'Onbekend', created_at: daysAgoIso(5) },
    { name: 'Eline van der Berg', email: 'eline.berg@ziggo.nl', phone: '0656789012', source: 'form', status: 'warm', ai_score: 58, ai_label: 'warm', ai_summary: 'Beplanting voor nieuwe woning, nog in verbouwingsfase.', urgency: 'low', intent: 'Beplanting', budget_estimate: '€2.000 – €4.000', created_at: daysAgoIso(7) },
    // Verlopen / later
    { name: 'Tijs Hartman', email: 'thartman@hotmail.com', phone: '0667890123', source: 'meta_lead_ads', status: 'cold', ai_score: 28, ai_label: 'cold', ai_summary: 'Kleine reiniging dak, vergelijkt prijzen. Laag budget.', urgency: 'low', intent: 'Reiniging', budget_estimate: '< €500', created_at: daysAgoIso(14) },
  ]

  const rows = leads.map(l => ({ ...l, tenant_id: tenantId, is_demo: true }))
  const { error } = await sb.from('leads').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${leads.length} leads`)
}

async function seedClients(tenantId: string) {
  const clients = [
    { name: 'Familie de Vries', contact_name: 'Henk de Vries', phone: '0612000001', email: 'henk.devries@gmail.com', address: 'Kastanjelaan 4', city: 'Apeldoorn', notes: 'Klant sinds 2024. Jaarcontract onderhoud. Verwijst actief naar vrienden.' },
    { name: 'Ruben Timmermans', contact_name: 'Ruben Timmermans', phone: '0612000002', email: 'rtimmermans@live.nl', address: 'Berkenhof 22', city: 'Deventer', notes: 'Tuinrenovatie 2025, nu in afwachting van onderhoudsgesprek.' },
    { name: 'Stichting Groenrijk', contact_name: 'Petra Wolsink', phone: '0612000003', email: 'p.wolsink@groenrijk.nl', address: 'Parkweg 88', city: 'Zutphen', notes: 'Bedrijfsterrein 3x per jaar onderhoud. Vaste klant.' },
    { name: 'Familie Postma', contact_name: 'Annelies Postma', phone: '0612000004', email: 'annelies.postma@upcmail.nl', address: 'Eikenlaan 7', city: 'Lochem', notes: 'Schuttingproject afgerond. Review gevraagd maar nog niet ontvangen.' },
    { name: 'Jan Hendriksen', contact_name: 'Jan Hendriksen', phone: '0612000005', email: 'janhendriksen@gmail.com', address: 'Molenweg 3', city: 'Doetinchem', notes: 'Partnerproject via aannemer. Eerste keer klant.' },
  ]

  const rows = clients.map(c => ({ ...c, tenant_id: tenantId, is_demo: true }))
  const { data, error } = await sb.from('clients').insert(rows).select('id, name')
  if (error) throw error
  console.log(`  ✓ ${clients.length} klanten`)
  return data ?? []
}

async function seedProjects(tenantId: string, clients: { id: string; name: string }[]) {
  if (clients.length < 3) {
    console.warn('  ! Te weinig clients voor projecten seed')
    return
  }

  const [devries, timmermans, groenrijk, postma, hendriksen] = clients

  const projects = [
    {
      client_id: devries.id,
      name: 'Tuin Opfrisdag — De Vries',
      description: 'Jaarlijkse opfrisdag: snoei, onkruid, bemesting, nazomer check.',
      status: 'actief',
      project_type: 'onderhoud',
      start_date: daysAgoDate(30),
      budget_cents: 45000,
      hourly_rate_cents: 6500,
      city: 'Apeldoorn',
    },
    {
      client_id: timmermans.id,
      name: 'Tuinrenovatie achtertuin Timmermans',
      description: 'Volledige herinrichting: terras 40m², hagen, beplanting, verlichting.',
      status: 'opgeleverd',
      project_type: 'vakwerk',
      start_date: daysAgoDate(75),
      end_date: daysAgoDate(20),
      budget_cents: 1450000,
      hourly_rate_cents: 7500,
      city: 'Deventer',
    },
    {
      client_id: groenrijk.id,
      name: 'Onderhoud Groenrijk Q3',
      description: 'Kwartaalonderhoud bedrijfsterrein: maai, snoei, onkruid, afvoer.',
      status: 'gepland',
      project_type: 'onderhoud',
      start_date: daysAgoDate(-7),
      budget_cents: 185000,
      hourly_rate_cents: 6500,
      city: 'Zutphen',
    },
    {
      client_id: postma.id,
      name: 'Schutting vervangen — Postma',
      description: 'Oud hout vervangen door aluminium schutting 18 meter, palen gebetoneerd.',
      status: 'opgeleverd',
      project_type: 'vakwerk',
      start_date: daysAgoDate(45),
      end_date: daysAgoDate(40),
      budget_cents: 380000,
      hourly_rate_cents: 7500,
      city: 'Lochem',
    },
    {
      client_id: hendriksen.id,
      name: 'Bestrating oprit Hendriksen',
      description: 'Oprit 60m² klinkers + rand afwerking. Partnerproject via Aannemersbedrijf Govers.',
      status: 'gepland',
      project_type: 'vakwerk',
      start_date: daysAgoDate(-14),
      budget_cents: 720000,
      hourly_rate_cents: 7500,
      city: 'Doetinchem',
    },
  ]

  const rows = projects.map(p => ({ ...p, tenant_id: tenantId, is_demo: true }))
  const { error } = await sb.from('projects').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${projects.length} projecten`)
}

async function seedNotifications(tenantId: string) {
  const rows = [
    {
      tenant_id: tenantId,
      is_demo: true,
      title: 'Nieuwe aanvraag — Familie Koopman',
      message: 'AI-score 91. Tuinrenovatie €9K. Reageer binnen 5 minuten.',
      type: 'urgent',
      link: '/dashboard/leads',
      is_read: false,
    },
    {
      tenant_id: tenantId,
      is_demo: true,
      title: 'Review nog niet ontvangen — Postma',
      message: 'Project afgerond 40 dagen geleden. Stuur herinnering.',
      type: 'warning',
      link: '/dashboard/klanten',
      is_read: false,
    },
  ]
  const { error } = await sb.from('notifications').insert(rows)
  if (error) throw error
  console.log(`  ✓ ${rows.length} notificaties`)
}

async function main() {
  console.log('FoundriOS — Groeneveld Tuinen testdata seeder\n')
  const tenantId = await resolveTenantId()
  console.log(`Tenant: ${tenantId}\n`)

  console.log('Verwijderen bestaande demo data...')
  await clearDemoData(tenantId)

  console.log('Seeden...')
  await seedLeads(tenantId)
  const clients = await seedClients(tenantId)
  await seedProjects(tenantId, clients as { id: string; name: string }[])
  await seedNotifications(tenantId)

  console.log('\n✓ GT testdata klaar.')
  console.log('  Schakel demo modus in via de sidebar om de data te zien.')
  console.log('  Of zet is_demo=false in de seed als je permanente testdata wilt.')
}

main().catch(err => {
  console.error('\n✗ Seed mislukt:', err.message ?? err)
  process.exit(1)
})
