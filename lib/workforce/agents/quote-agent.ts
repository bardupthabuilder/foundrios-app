import { loadTenantAgentContext, injectTenantContextIntoPrompt } from '@/lib/workforce/config-loader'
import type { AgentSpec, AgentContext, AgentResult, ToolDefinition } from '@/lib/workforce/types'
import { runAgent } from './runtime'
import { generateQuotePdf as buildAndUploadPdf } from './quote-pdf'

const QUOTE_SYSTEM_PROMPT = `You are a Quote Generation Agent for a professional trade business. Your role is to:

1. Receive prospect information (name, company, project description)
2. Analyze the project scope, estimated size, and materials needed
3. Generate a structured quote with:
   - Itemized services (labor + materials)
   - Professional pricing based on niche standards
   - Clear terms and conditions
   - Validity period
   - Approval/signature mechanism

Output Format:
You MUST return ONLY valid JSON. No markdown, no extra text. Structure:
{
  "prospect_name": "string",
  "company_name": "string",
  "quote_items": [
    {
      "description": "string (service or material)",
      "quantity": number,
      "unit": "string (pieces, hours, m², etc)",
      "unit_price": number (in euro, ex VAT),
      "subtotal": number
    }
  ],
  "subtotal": number,
  "vat_rate": 21,
  "vat_amount": number,
  "total": number,
  "validity_days": number,
  "payment_terms": "string",
  "notes": "string (any special conditions or disclaimers)"
}

CRITICAL RULES:
- All prices must be realistic for the specified niche and region
- Always include labor AND materials (never quote labor-only)
- Use tenant tone and pricing rules from context
- Quantity and unit_price must multiply to subtotal exactly
- Total must equal subtotal + VAT
- Be specific with item descriptions (not "work" but "tuinaanleg 50m²")
- Return only JSON, no explanations`

interface ProspectInput {
  prospect_name: string
  company_name: string
  project_description: string
  project_size?: string
  region?: string
  estimated_budget?: number
}

export interface QuoteOutput {
  prospect_name: string
  company_name: string
  quote_items: Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
    subtotal: number
  }>
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  validity_days: number
  payment_terms: string
  notes: string
}

export async function runQuoteAgent(
  tenantId: string,
  prospectId: string,
  prospectData: ProspectInput
): Promise<AgentResult> {
  const context = await loadTenantAgentContext(tenantId, 'quote')

  let systemPrompt = QUOTE_SYSTEM_PROMPT
  if (context) {
    systemPrompt = injectTenantContextIntoPrompt(systemPrompt, context.formattedOverrides)
  }

  const spec: AgentSpec = {
    name: 'quote-agent',
    version: 'v1',
    model: 'claude-sonnet-4-6-20250514',
    system: systemPrompt,
    maxTokens: 2048,
    tools: [] as ToolDefinition[],
    toolHandlers: {},
  }

  const input: Record<string, unknown> = {
    prospect_name: prospectData.prospect_name,
    company_name: prospectData.company_name,
    project_description: prospectData.project_description,
    project_size: prospectData.project_size || 'not specified',
    region: prospectData.region || 'not specified',
    estimated_budget: prospectData.estimated_budget || 'not specified',
  }

  const agentContext: AgentContext = {
    tenantId,
    leadId: prospectId,
  }

  return runAgent(spec, input, agentContext)
}

export async function generateQuotePdf(
  quoteData: QuoteOutput,
  tenantId: string,
  prospectId: string
): Promise<{ pdfUrl: string; quoteId: string }> {
  return buildAndUploadPdf(quoteData, tenantId, prospectId)
}
