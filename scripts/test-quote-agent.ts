/**
 * E2E test script — Quote Agent
 * Sprint 2 Task 2.1.5
 *
 * Usage:
 *   npx tsx scripts/test-quote-agent.ts
 *   npx tsx scripts/test-quote-agent.ts --with-pdf   (also runs PDF generation)
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

import 'dotenv/config'
import { createWorkforceServiceClient } from '../lib/workforce/supabase'
import { runQuoteAgent, generateQuotePdf, type QuoteOutput } from '../lib/workforce/agents/quote-agent'

const TEST_TENANT_ID = '00ddc11d-3ca8-44d4-9595-cd6516b763d7'
const QUOTE_AGENT_ID = 'e058f8fc-7bbd-497a-8bea-4fcba870d7ff'

const WITH_PDF = process.argv.includes('--with-pdf')

const TEST_PROSPECT = {
  prospect_name: 'Jan de Vries',
  company_name: 'De Vries Tuinen BV',
  project_description:
    'Aanleg achtertuin van circa 80m². Gewenst: grasveld, borders met vaste planten, natuurstenen terras 20m², beplanting langs schutting. Regio Utrecht, uitvoering gewenst voor eind mei.',
  project_size: '80m²',
  region: 'Utrecht',
  estimated_budget: 12000,
}

function pass(msg: string) {
  console.log(`  ✓ ${msg}`)
}

function fail(msg: string) {
  console.error(`  ✗ ${msg}`)
  process.exit(1)
}

function section(title: string) {
  console.log(`\n── ${title}`)
}

async function activateQuoteAgent() {
  section('Agent activeren voor test-tenant')
  const supabase = createWorkforceServiceClient()

  const { error } = await supabase.from('fw_tenant_agents').upsert(
    {
      tenant_id: TEST_TENANT_ID,
      agent_id: QUOTE_AGENT_ID,
      active: true,
      activated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,agent_id' }
  )

  if (error) fail(`Agent activatie mislukt: ${error.message}`)
  pass(`Quote agent actief voor tenant ${TEST_TENANT_ID}`)
}

function validateQuoteOutput(output: unknown): QuoteOutput {
  section('Output valideren')

  if (!output || typeof output !== 'object') fail('Output is geen object')
  const q = output as Record<string, unknown>

  if (!q.prospect_name) fail('Ontbrekend veld: prospect_name')
  if (!q.company_name) fail('Ontbrekend veld: company_name')
  if (!Array.isArray(q.quote_items) || q.quote_items.length === 0) fail('quote_items is leeg of geen array')
  if (typeof q.subtotal !== 'number' || q.subtotal <= 0) fail('subtotal ongeldig')
  if (q.vat_rate !== 21) fail(`vat_rate moet 21 zijn, kreeg: ${q.vat_rate}`)
  if (typeof q.vat_amount !== 'number') fail('vat_amount ongeldig')
  if (typeof q.total !== 'number') fail('total ongeldig')
  if (!q.payment_terms) fail('Ontbrekend veld: payment_terms')

  // Controleer BTW-berekening
  const expectedVat = Math.round((q.subtotal as number) * 0.21 * 100) / 100
  const expectedTotal = Math.round(((q.subtotal as number) + (q.vat_amount as number)) * 100) / 100
  const vatDiff = Math.abs((q.vat_amount as number) - expectedVat)
  const totalDiff = Math.abs((q.total as number) - expectedTotal)

  if (vatDiff > 0.02) fail(`BTW-berekening klopt niet: verwacht ${expectedVat}, kreeg ${q.vat_amount}`)
  if (totalDiff > 0.02) fail(`Totaal klopt niet: verwacht ${expectedTotal}, kreeg ${q.total}`)

  // Controleer subtotalen van items
  for (const item of q.quote_items as Array<Record<string, unknown>>) {
    const expectedSub = Math.round((item.quantity as number) * (item.unit_price as number) * 100) / 100
    const diff = Math.abs((item.subtotal as number) - expectedSub)
    if (diff > 0.02) {
      fail(`Item subtotaal klopt niet: "${item.description}" — ${item.quantity} × ${item.unit_price} ≠ ${item.subtotal}`)
    }
  }

  pass(`${(q.quote_items as unknown[]).length} offerteregels aanwezig`)
  pass(`Subtotaal: €${q.subtotal} | BTW: €${q.vat_amount} | Totaal: €${q.total}`)
  pass('BTW-berekening correct')
  pass('Alle item-subtotalen correct')

  return q as unknown as QuoteOutput
}

async function runTest() {
  console.log('═══════════════════════════════════════')
  console.log('  Quote Agent — E2E Test')
  console.log('═══════════════════════════════════════')
  console.log(`  Tenant:  ${TEST_TENANT_ID}`)
  console.log(`  Prospect: ${TEST_PROSPECT.prospect_name} (${TEST_PROSPECT.company_name})`)
  if (WITH_PDF) console.log('  Modus: inclusief PDF-generatie')

  const startTime = Date.now()

  // Stap 1: activeer agent
  await activateQuoteAgent()

  // Stap 2: genereer offerte
  section('Quote genereren via agent')
  const result = await runQuoteAgent(TEST_TENANT_ID, '', TEST_PROSPECT)

  if (!result.success) fail(`Agent mislukt: ${result.error}`)
  pass(`Agent succesvol (run_id: ${result.runId})`)
  pass(`Output ontvangen van Claude`)

  // Stap 3: valideer output
  const quoteData = validateQuoteOutput(result.output)

  // Stap 4: (optioneel) PDF genereren
  if (WITH_PDF) {
    section('PDF genereren')
    console.log('  Let op: vereist Chromium — dit kan 10-30s duren...')
    const pdfResult = await generateQuotePdf(quoteData, TEST_TENANT_ID, '')
    pass(`PDF gegenereerd: ${pdfResult.pdfUrl}`)
    pass(`Quote ID: ${pdfResult.quoteId}`)
  } else {
    section('PDF overgeslagen (gebruik --with-pdf om te testen)')
  }

  // Stap 5: verify DB record van agent run
  section('Database controleren')
  const supabase = createWorkforceServiceClient()
  const { data: run } = await supabase
    .from('fw_agent_runs')
    .select('id, status, tokens_input, tokens_output, duration_ms')
    .eq('id', result.runId)
    .single()

  if (!run) {
    fail(`Agent run niet gevonden in DB: ${result.runId}`)
    return
  }
  if (run.status !== 'success') fail(`Agent run status is '${run.status}', verwacht 'success'`)
  pass(`Agent run opgeslagen (status: ${run.status})`)
  pass(`Tokens: ${run.tokens_input} input / ${run.tokens_output} output`)
  pass(`Duur: ${run.duration_ms}ms`)

  const totalMs = Date.now() - startTime
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  GESLAAGD in ${(totalMs / 1000).toFixed(1)}s`)
  console.log(`═══════════════════════════════════════\n`)
}

runTest().catch((err) => {
  console.error('\n  FOUT:', err instanceof Error ? err.message : err)
  process.exit(1)
})
