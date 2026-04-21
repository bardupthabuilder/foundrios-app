import { runAgent } from './runtime'
import {
  lookupKnowledgeTool,
  updateLeadTool,
  createLookupKnowledgeHandler,
  createUpdateLeadHandler,
} from './skills'
import type { AgentSpec, FwLead } from '@/lib/workforce/types'

const SYSTEM_PROMPT = `Je bent de Qualification Agent van Foundri Workforce.

TAAK:
Beoordeel een gestandaardiseerde lead en ken een kwalificatiescore toe: hot, warm, cold of reject.

SCORING CRITERIA:
- HOT: dienst matcht + regio matcht + urgentie hoog + budget passend → direct afspraak waardig
- WARM: dienst matcht + 1-2 ontbrekende velden of lagere urgentie → opvolging nodig
- COLD: dienst matcht maar veel ontbreekt of urgentie laag → nurture
- REJECT: dienst matcht niet OF buiten regio EN geen uitzonderingsreden

REGELS:
- Gebruik lookup_knowledge category="services" om te checken of de dienst wordt aangeboden
- Gebruik lookup_knowledge category="regions" om te checken of de regio wordt bediend
- Gebruik update_lead om de kwalificatie en status bij te werken
- Bij twijfel tussen twee scores: kies de hogere (liever een warm lead missen dan een hot lead afwijzen)

STAPPEN:
1. Lees de lead data
2. Check dienst via lookup_knowledge
3. Check regio via lookup_knowledge
4. Bepaal score
5. Update de lead met update_lead (status="qualified", qualification=score)
6. Geef JSON samenvatting

OUTPUT FORMAT:
{
  "lead_id": "uuid",
  "qualification": "hot|warm|cold|reject",
  "reason": "korte uitleg",
  "service_match": true/false,
  "region_match": true/false,
  "next_action": "book_appointment|follow_up|nurture|reject"
}`

export async function runQualification(lead: FwLead, tenantId: string) {
  const spec: AgentSpec = {
    name: 'qualification',
    version: 'v1',
    model: 'claude-haiku-4-5-20251001',
    system: SYSTEM_PROMPT,
    maxTokens: 400,
    tools: [lookupKnowledgeTool, updateLeadTool],
    toolHandlers: {
      lookup_knowledge: createLookupKnowledgeHandler(tenantId),
      update_lead: createUpdateLeadHandler(),
    },
  }

  const input = {
    lead_id: lead.id,
    name: lead.name,
    company: lead.company,
    service: lead.service,
    region: lead.region,
    budget: lead.budget,
    urgency: lead.urgency,
    notes: lead.notes,
    source: lead.source,
  }

  return runAgent(spec, input, { tenantId, leadId: lead.id })
}
