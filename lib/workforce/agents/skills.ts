import { createWorkforceServiceClient } from '@/lib/workforce/supabase'
import type { ToolDefinition, ToolHandler } from '@/lib/workforce/types'

// ============================================================
// Shared skill definitions — herbruikbaar door alle agents
// ============================================================

export const lookupKnowledgeTool: ToolDefinition = {
  name: 'lookup_knowledge',
  description:
    'Zoek in de knowledge base van het bedrijf. Gebruik dit om te checken welke diensten, regio\'s, prijzen of bedrijfsinformatie beschikbaar is.',
  input_schema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['services', 'regions', 'pricing', 'faq', 'company_info'],
        description: 'Categorie om in te zoeken',
      },
      query: {
        type: 'string',
        description: 'Optionele zoekterm om te filteren',
      },
    },
    required: ['category'],
  },
}

export const saveLeadTool: ToolDefinition = {
  name: 'save_lead',
  description:
    'Sla een gestandaardiseerde lead op in de database. Gebruik dit nadat je alle beschikbare informatie hebt geëxtraheerd en gestandaardiseerd.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Volledige naam van de lead' },
      email: { type: 'string', description: 'E-mailadres' },
      phone: { type: 'string', description: 'Telefoonnummer in +31 format' },
      company: { type: 'string', description: 'Bedrijfsnaam' },
      service: { type: 'string', description: 'Gevraagde dienst' },
      region: { type: 'string', description: 'Regio / werkgebied' },
      budget: { type: 'string', description: 'Budget indicatie indien bekend' },
      urgency: { type: 'string', description: 'Urgentie: hoog / middel / laag' },
      notes: { type: 'string', description: 'Aanvullende notities' },
    },
    required: ['name'],
  },
}

export const updateLeadTool: ToolDefinition = {
  name: 'update_lead',
  description: 'Werk een bestaande lead bij met nieuwe informatie.',
  input_schema: {
    type: 'object',
    properties: {
      lead_id: { type: 'string', description: 'UUID van de lead' },
      status: {
        type: 'string',
        enum: ['new', 'qualified', 'conversation', 'booking', 'booked', 'rejected', 'reactivation'],
      },
      qualification: { type: 'string', enum: ['hot', 'warm', 'cold', 'reject'] },
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      company: { type: 'string' },
      service: { type: 'string' },
      region: { type: 'string' },
      budget: { type: 'string' },
      urgency: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['lead_id'],
  },
}

// --- TOOL HANDLERS ---

export function createLookupKnowledgeHandler(tenantId: string): ToolHandler {
  return async (input) => {
    const supabase = createWorkforceServiceClient()
    let query = supabase
      .from('fw_knowledge')
      .select('title, content, category')
      .eq('tenant_id', tenantId)

    if (input.category) {
      query = query.eq('category', input.category as string)
    }

    const { data, error } = await query.limit(5)
    if (error) return { error: error.message }
    return data || []
  }
}

export function createSaveLeadHandler(tenantId: string, rawData: Record<string, unknown>): ToolHandler {
  return async (input) => {
    const supabase = createWorkforceServiceClient()

    const { data, error } = await supabase
      .from('fw_leads')
      .insert({
        tenant_id: tenantId,
        source: (rawData.source as string) || 'webhook',
        raw_data: rawData,
        status: 'new',
        name: input.name || null,
        email: input.email || null,
        phone: input.phone || null,
        company: input.company || null,
        service: input.service || null,
        region: input.region || null,
        budget: input.budget || null,
        urgency: input.urgency || null,
        notes: input.notes || null,
      })
      .select('id, status')
      .single()

    if (error) return { error: error.message }
    return { lead_id: data.id, status: data.status }
  }
}

export function createUpdateLeadHandler(): ToolHandler {
  return async (input) => {
    const supabase = createWorkforceServiceClient()
    const leadId = input.lead_id as string
    const updates: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(input)) {
      if (key !== 'lead_id' && value !== undefined) {
        updates[key] = value
      }
    }

    const { data, error } = await supabase
      .from('fw_leads')
      .update(updates)
      .eq('id', leadId)
      .select('id, status, qualification')
      .single()

    if (error) return { error: error.message }
    return { lead_id: data.id, status: data.status, qualification: data.qualification }
  }
}
