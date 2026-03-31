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

// ─── Content Generation ───────────────────────────────────────────────────────

export interface ContentGenerationInput {
  topic: string
  content_template: string // before_after, timelapse, carousel, educatie, lead_magnet
  platforms: string[] // instagram, linkedin, facebook, tiktok, youtube, google_business
  context?: string // Company name, niche, extra context
}

export interface ContentGenerationResult {
  title: string
  hook: string
  body: string
  cta: string
  visual_prompt: string
  script: string | null
  tags: string[]
  platform_variations: {
    platform: string
    body: string
    hashtags: string[]
  }[]
}

const CONTENT_TOOL = {
  name: 'generate_content',
  description: 'Genereer social media content voor een vakbedrijf',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'Pakkende titel voor het stuk content (max 10 woorden)',
      },
      hook: {
        type: 'string',
        description:
          'Eerste zin die direct aandacht trekt met resultaat of pijn (max 20 woorden)',
      },
      body: {
        type: 'string',
        description: 'Hoofdtekst van de post, direct en nuchter geschreven',
      },
      cta: {
        type: 'string',
        description: 'Één duidelijke call-to-action (max 15 woorden)',
      },
      visual_prompt: {
        type: 'string',
        description:
          'Beschrijving voor het visuele element (foto, video of grafiek)',
      },
      script: {
        type: 'string',
        description:
          'Video- of reelscript als het template daar om vraagt, anders null',
        nullable: true,
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Relevante trefwoorden voor intern gebruik (geen hashtags)',
      },
      platform_variations: {
        type: 'array',
        description: 'Platform-specifieke versies van de body-tekst',
        items: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              description: 'Naam van het platform',
            },
            body: {
              type: 'string',
              description: 'Aangepaste body-tekst voor dit platform',
            },
            hashtags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Hashtags passend bij het platform (zonder #)',
            },
          },
          required: ['platform', 'body', 'hashtags'],
        },
      },
    },
    required: [
      'title',
      'hook',
      'body',
      'cta',
      'visual_prompt',
      'tags',
      'platform_variations',
    ],
  },
}

const CONTENT_SYSTEM_PROMPT =
  'Je bent een content specialist voor Nederlandse vakbedrijven (hoveniers, dakdekkers, installateurs). ' +
  'Schrijf in het Nederlands. Toon: direct, nuchter, geen hype. Kort en krachtig. ' +
  'Hooks: eerste zin pakt aandacht met resultaat of pijn. ' +
  'CTA: één actie per post. Nooit twee. ' +
  'Platform-specifiek: LinkedIn = professioneel, Instagram = visueel + hashtags, ' +
  'Facebook = community, TikTok = trending + informeel.'

export async function generateContent(
  input: ContentGenerationInput
): Promise<ContentGenerationResult> {
  const platformList = input.platforms.join(', ')

  const prompt = `Genereer content voor een vakbedrijf op basis van de volgende informatie.

**Onderwerp:** ${input.topic}
**Template type:** ${input.content_template}
**Platforms:** ${platformList}${input.context ? `\n**Extra context:** ${input.context}` : ''}

Maak voor elk opgegeven platform een aparte variatie in platform_variations.
Zorg dat de hook direct pijn of een concreet resultaat aanpakt.
Gebruik geen hype-taal, generieke claims of verboden woorden (innovatief, revolutionair, game-changer, oplossing op maat, next level, uniek, krachtig, impactvol, transformatief).
Schrijf alsof de eigenaar van het bedrijf zelf praat — ik-vorm, vanuit eigen ervaring.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: CONTENT_SYSTEM_PROMPT,
    tools: [CONTENT_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude retourneerde geen tool use response voor content generatie')
  }

  const result = toolUse.input as ContentGenerationResult
  return result
}

export async function generateBatch(inputs: {
  topics: { topic: string }[]
  content_template: string
  platforms: string[]
  context?: string
}): Promise<ContentGenerationResult[]> {
  const results: ContentGenerationResult[] = []

  for (const { topic } of inputs.topics) {
    const result = await generateContent({
      topic,
      content_template: inputs.content_template,
      platforms: inputs.platforms,
      context: inputs.context,
    })
    results.push(result)
  }

  return results
}

export async function generateContentField(params: {
  field: 'hook' | 'body' | 'cta' | 'visual_prompt' | 'script'
  topic: string
  existing_hook?: string
  existing_body?: string
  platform?: string
  content_template?: string
}): Promise<string> {
  const fieldDescriptions: Record<typeof params.field, string> = {
    hook: 'een pakkende openingszin die direct aandacht trekt met een resultaat of pijn (max 20 woorden)',
    body: 'de hoofdtekst van de post, direct en nuchter, in ik-vorm vanuit eigen ervaring',
    cta: 'één duidelijke call-to-action (max 15 woorden, geen twee acties)',
    visual_prompt:
      'een concrete beschrijving voor het visuele element (foto, video of grafiek)',
    script:
      'een video- of reelscript dat de kijker direct aanspreekt, informeel maar professioneel',
  }

  const contextLines: string[] = [`**Onderwerp:** ${params.topic}`]
  if (params.content_template) {
    contextLines.push(`**Template:** ${params.content_template}`)
  }
  if (params.platform) {
    contextLines.push(`**Platform:** ${params.platform}`)
  }
  if (params.existing_hook) {
    contextLines.push(`**Bestaande hook:** ${params.existing_hook}`)
  }
  if (params.existing_body) {
    contextLines.push(`**Bestaande body:** ${params.existing_body}`)
  }

  const prompt = `${contextLines.join('\n')}

Schrijf alleen ${fieldDescriptions[params.field]}.
Geef uitsluitend de tekst terug, geen uitleg, geen label, geen aanhalingstekens.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: CONTENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`Claude retourneerde geen tekst voor veld: ${params.field}`)
  }

  return textBlock.text.trim()
}
