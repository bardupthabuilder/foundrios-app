import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireWorkforceTenant } from '@/lib/workforce/tenant'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { runQuoteAgent, generateQuotePdf, type QuoteOutput } from '@/lib/workforce/agents/quote-agent'

const bodySchema = z.object({
  prospect_id: z.string().uuid('prospect_id must be a valid UUID').optional(),
  prospect_name: z.string().min(1, 'prospect_name is required'),
  company_name: z.string().min(1, 'company_name is required'),
  project_description: z.string().min(10, 'project_description must be at least 10 characters'),
  project_size: z.string().optional(),
  region: z.string().optional(),
  estimated_budget: z.number().positive().optional(),
})

// POST /api/workforce/agents/quote/generate
export async function POST(request: Request) {
  try {
    const { tenantId } = await requireWorkforceTenant()

    // Validate body
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ongeldige invoer', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { prospect_id, ...prospectData } = parsed.data

    // Verify quote agent is active for this tenant
    const supabase = createWorkforceServiceClient()
    const { data: catalogAgent } = await supabase
      .from('fw_agents_catalog')
      .select('id')
      .eq('slug', 'quote')
      .single()

    if (!catalogAgent) {
      return NextResponse.json({ error: 'Quote agent niet gevonden in catalogus' }, { status: 500 })
    }

    const { data: tenantAgent } = await supabase
      .from('fw_tenant_agents')
      .select('active')
      .eq('tenant_id', tenantId)
      .eq('agent_id', catalogAgent.id)
      .single()

    if (!tenantAgent?.active) {
      return NextResponse.json(
        { error: 'Quote agent is niet geactiveerd voor deze tenant' },
        { status: 403 }
      )
    }

    // Run quote generation agent
    const agentResult = await runQuoteAgent(tenantId, prospect_id ?? '', {
      prospect_name: prospectData.prospect_name,
      company_name: prospectData.company_name,
      project_description: prospectData.project_description,
      project_size: prospectData.project_size,
      region: prospectData.region,
      estimated_budget: prospectData.estimated_budget,
    })

    if (!agentResult.success || !agentResult.output) {
      return NextResponse.json(
        { error: 'Quote generatie mislukt', detail: agentResult.error },
        { status: 500 }
      )
    }

    // Validate agent output has required quote fields
    const quoteData = agentResult.output as unknown as QuoteOutput
    if (!quoteData.quote_items || !Array.isArray(quoteData.quote_items) || quoteData.quote_items.length === 0) {
      return NextResponse.json(
        { error: 'Agent retourneerde geen geldige offerteregels', raw: agentResult.output },
        { status: 500 }
      )
    }

    // Generate and upload PDF
    const { pdfUrl, quoteId } = await generateQuotePdf(quoteData, tenantId, prospect_id ?? '')

    return NextResponse.json(
      {
        success: true,
        quote_id: quoteId,
        pdf_url: pdfUrl,
        quote_data: quoteData,
        run_id: agentResult.runId,
      },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout'

    if (message === 'Niet ingelogd' || message.includes('Geen Workforce tenant')) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
