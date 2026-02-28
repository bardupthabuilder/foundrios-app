import Anthropic from '@anthropic-ai/sdk'
import type { AiScoreResult } from './types/lead'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SCORE_TOOL = {
  name: 'score_lead',
  description: 'Scoor een lead op basis van de aangeleverde informatie',
  input_schema: {
    type: 'object' as const,
    properties: {
      score: {
        type: 'number',
        description: 'Score van 0 tot 100. 70-100 = hot, 40-69 = warm, 0-39 = cold',
      },
      label: {
        type: 'string',
        enum: ['hot', 'warm', 'cold'],
        description: 'Kwalificatielabel voor de lead',
      },
      summary: {
        type: 'string',
        description: 'Korte Nederlandse samenvatting van de lead (max 2 zinnen)',
      },
      budget_estimate: {
        type: 'string',
        description: 'Geschat budget als vermeld, anders null',
        nullable: true,
      },
      urgency: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Urgentie van de aanvraag',
      },
      intent: {
        type: 'string',
        description: 'Korte omschrijving van wat de klant wil (max 10 woorden)',
      },
    },
    required: ['score', 'label', 'summary', 'urgency', 'intent'],
  },
}

export async function scoreLead(params: {
  name: string
  source: string
  messages: string[]
  email?: string | null
  phone?: string | null
}): Promise<AiScoreResult> {
  const contactInfo = [
    params.email ? `E-mail: ${params.email}` : null,
    params.phone ? `Telefoon: ${params.phone}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const prompt = `Je bent een kwalificatie-assistent voor een vakbedrijf. Analyseer de volgende lead en geef een score.

**Lead informatie:**
- Naam: ${params.name}
- Bron: ${params.source}
- Contactgegevens: ${contactInfo || 'Niet opgegeven'}

**Berichten van de lead:**
${params.messages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

**Scorecriteria:**
- Budget vermeld of duidelijke prijsverwachting: +30 punten
- Tijdlijn of urgentie duidelijk: +25 punten
- Specifiek project beschreven: +25 punten
- Contactgegevens volledig (naam + tel/email): +20 punten

Geef een eerlijke score op basis van de beschikbare informatie. Als er weinig informatie is, scoor laag.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    tools: [SCORE_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude retourneerde geen tool use response')
  }

  const result = toolUse.input as AiScoreResult
  return result
}
