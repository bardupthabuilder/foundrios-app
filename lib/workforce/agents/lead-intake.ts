import { runAgent } from './runtime'
import {
  lookupKnowledgeTool,
  saveLeadTool,
  createLookupKnowledgeHandler,
  createSaveLeadHandler,
} from './skills'
import type { AgentSpec } from '@/lib/workforce/types'

const SYSTEM_PROMPT = `Je bent de Lead Intake Agent van Foundri Workforce.

TAAK:
Ontvang ruwe lead data uit verschillende bronnen (formulier, WhatsApp, DM, e-mail, call transcript) en standaardiseer deze naar een gestructureerd format.

REGELS:
- Extraheer alle beschikbare informatie: naam, email, telefoon, bedrijfsnaam, dienst, regio, budget, urgentie
- Als informatie ontbreekt, geef null — vul NIETS zelf in
- Telefoonnummers standaardiseren naar NL format (+31...)
- Gebruik lookup_knowledge om te checken of de gevraagde dienst past bij het bedrijf
- Gebruik save_lead om de gestandaardiseerde lead op te slaan
- Bepaal urgentie op basis van taalgebruik: "zo snel mogelijk" / "spoed" = hoog, "komende maanden" = laag

STAPPEN:
1. Lees de ruwe data
2. Extraheer alle velden
3. Gebruik lookup_knowledge category="services" om te checken of de dienst matcht
4. Sla de lead op met save_lead
5. Geef een JSON samenvatting terug

OUTPUT FORMAT (na save_lead):
{
  "status": "saved",
  "lead_id": "uuid",
  "extracted": { naam, dienst, regio, urgentie },
  "missing_fields": ["email", "budget"],
  "service_match": true/false,
  "next_action": "qualify" | "needs_more_info"
}`

export async function runLeadIntake(
  rawData: Record<string, unknown>,
  tenantId: string
) {
  const spec: AgentSpec = {
    name: 'lead_intake',
    version: 'v1',
    model: 'claude-haiku-4-5-20251001',
    system: SYSTEM_PROMPT,
    maxTokens: 600,
    tools: [lookupKnowledgeTool, saveLeadTool],
    toolHandlers: {
      lookup_knowledge: createLookupKnowledgeHandler(tenantId),
      save_lead: createSaveLeadHandler(tenantId, rawData),
    },
  }

  return runAgent(spec, rawData, { tenantId })
}
