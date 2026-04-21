import { NextResponse } from 'next/server'
import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import { runLeadIntake } from '@/lib/workforce/agents/lead-intake'
import { runQualification } from '@/lib/workforce/agents/qualification'

// POST /workforce/api/webhook/lead
// Ontvangt ruwe lead data → Lead Intake Agent → Qualification Agent
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const apiKey = process.env.FW_WEBHOOK_SECRET
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const tenantSlug = body.tenant || request.headers.get('x-tenant') || 'groeneveld-tuinen'
    const supabase = createWorkforceServiceClient()

    const { data: tenant } = await supabase
      .from('fw_tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: `Tenant not found: ${tenantSlug}` }, { status: 404 })
    }

    // Step 1: Lead Intake Agent
    const intakeResult = await runLeadIntake(body, tenant.id)

    if (!intakeResult.success) {
      return NextResponse.json(
        { error: 'Lead intake failed', detail: intakeResult.error, runId: intakeResult.runId },
        { status: 500 }
      )
    }

    // Extract lead_id from intake output
    const leadId =
      intakeResult.output?.lead_id as string ||
      (intakeResult.output?.extracted as Record<string, unknown>)?.lead_id as string

    // Step 2: Qualification Agent (if we have a lead_id)
    let qualResult = null
    if (leadId) {
      const { data: lead } = await supabase
        .from('fw_leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (lead) {
        qualResult = await runQualification(lead, tenant.id)
      }
    }

    return NextResponse.json({
      success: true,
      intake: {
        runId: intakeResult.runId,
        output: intakeResult.output,
      },
      qualification: qualResult
        ? {
            runId: qualResult.runId,
            output: qualResult.output,
          }
        : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Webhook processing failed', detail: message }, { status: 500 })
  }
}
