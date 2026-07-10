import OpenAI from 'openai'
import type { AiScoreResult } from './types/lead'
import { z } from 'zod'

// ─── OpenRouter Client (lazy — voorkomt build-time crash zonder key) ─────────

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || 'missing',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://foundrios-app.vercel.app',
        'X-Title': 'FoundriOS',
      },
    })
  }
  return _client
}

// ─── Model Config ────────────────────────────────────────────────────────────

const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'openai/gpt-4o-mini'
const BATCH_API_ENABLED = process.env.BATCH_API_ENABLED !== 'false'

export type ModelOverride = string | undefined

function getModel(override?: ModelOverride): string {
  return override || DEFAULT_MODEL
}

// ─── Lead Scoring ────────────────────────────────────────────────────────────

const SCORE_SCHEMA = {
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
}

const LEAD_SCORE_SYSTEM_PROMPT = 'Je bent een kwalificatie-assistent voor vakbedrijven. Analyseer leads op budget, urgentie, project-specificiteit en contactinfo. Score eerlijk op basis van beschikbare informatie.'

function scoreLeadDeterministic(params: {
  name: string
  source: string
  messages: string[]
  email?: string | null
  phone?: string | null
}): AiScoreResult | null {
  const fullText = params.messages.join(' ').toLowerCase()
  let score = 0

  if (fullText.includes('budget') || fullText.includes('€') || fullText.includes('euro')) score += 30
  if (fullText.includes('week') || fullText.includes('urgent') || fullText.includes('snel')) score += 25
  if (fullText.length > 100) score += 15
  if (params.email && params.phone) score += 20

  if (score >= 60) {
    return {
      score,
      label: score > 70 ? 'hot' : 'warm',
      summary: `Lead van ${params.name} via ${params.source}. Duidelijke signalen voor kwaliteit.`,
      budget_estimate: fullText.includes('€') ? 'Budget vermeld' : null,
      urgency: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      intent: fullText.substring(0, 50) + (fullText.length > 50 ? '...' : ''),
    }
  }

  return null
}

export async function scoreLead(
  params: {
    name: string
    source: string
    messages: string[]
    email?: string | null
    phone?: string | null
  },
  model?: ModelOverride
): Promise<AiScoreResult> {
  const deterministicResult = scoreLeadDeterministic(params)
  if (deterministicResult) {
    return deterministicResult
  }

  const contactInfo = [
    params.email ? `E-mail: ${params.email}` : null,
    params.phone ? `Telefoon: ${params.phone}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const prompt = `Analyseer deze lead en geef een score.

**Lead informatie:**
- Naam: ${params.name}
- Bron: ${params.source}
- Contactgegevens: ${contactInfo || 'Niet opgegeven'}

**Berichten:**
${params.messages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

**Criteria:** Budget +30 | Urgentie +25 | Project specifiek +25 | Contactinfo +20

Antwoord uitsluitend in JSON-formaat:
${JSON.stringify(SCORE_SCHEMA.properties, null, 2)}`

  const response = await getClient().chat.completions.create({
    model: getModel(model),
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: LEAD_SCORE_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) {
    throw new Error('OpenRouter retourneerde geen response')
  }

  return JSON.parse(text) as AiScoreResult
}

// ─── Content Generation ──────────────────────────────────────────────────────

export interface ContentGenerationInput {
  topic: string
  content_template: string
  platforms: string[]
  context?: string
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

const CONTENT_SYSTEM_PROMPT =
  'Je bent een content specialist voor Nederlandse vakbedrijven (hoveniers, dakdekkers, installateurs). ' +
  'Schrijf in het Nederlands. Toon: direct, nuchter, geen hype. Kort en krachtig. ' +
  'Hooks: eerste zin pakt aandacht met resultaat of pijn. ' +
  'CTA: een actie per post. Nooit twee. ' +
  'Platform-specifiek: LinkedIn = professioneel, Instagram = visueel + hashtags, ' +
  'Facebook = community, TikTok = trending + informeel. ' +
  'Antwoord uitsluitend in JSON-formaat.'

const CONTENT_SCHEMA_DESCRIPTION = `Antwoord in dit JSON-formaat:
{
  "title": "Pakkende titel (max 10 woorden)",
  "hook": "Eerste zin die aandacht trekt met resultaat of pijn (max 20 woorden)",
  "body": "Hoofdtekst, direct en nuchter, ik-vorm",
  "cta": "Een duidelijke call-to-action (max 15 woorden)",
  "visual_prompt": "Beschrijving voor visueel element (foto, video of grafiek)",
  "script": "Video/reelscript als template daar om vraagt, anders null",
  "tags": ["relevante", "trefwoorden"],
  "platform_variations": [
    {
      "platform": "instagram",
      "body": "Aangepaste tekst voor dit platform",
      "hashtags": ["zonder", "hekje"]
    }
  ]
}`

export async function generateContent(
  input: ContentGenerationInput,
  model?: ModelOverride
): Promise<ContentGenerationResult> {
  const platformList = input.platforms.join(', ')

  const prompt = `Genereer content voor een vakbedrijf op basis van de volgende informatie.

**Onderwerp:** ${input.topic}
**Template type:** ${input.content_template}
**Platforms:** ${platformList}${input.context ? `\n**Extra context:** ${input.context}` : ''}

Maak voor elk opgegeven platform een aparte variatie in platform_variations.
Zorg dat de hook direct pijn of een concreet resultaat aanpakt.
Gebruik geen hype-taal, generieke claims of verboden woorden (innovatief, revolutionair, game-changer, oplossing op maat, next level, uniek, krachtig, impactvol, transformatief).
Schrijf alsof de eigenaar van het bedrijf zelf praat — ik-vorm, vanuit eigen ervaring.

${CONTENT_SCHEMA_DESCRIPTION}`

  const response = await getClient().chat.completions.create({
    model: getModel(model),
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CONTENT_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) {
    throw new Error('OpenRouter retourneerde geen response voor content generatie')
  }

  return JSON.parse(text) as ContentGenerationResult
}

export async function generateBatch(
  inputs: {
    topics: { topic: string }[]
    content_template: string
    platforms: string[]
    context?: string
  },
  model?: ModelOverride
): Promise<ContentGenerationResult[]> {
  const results: ContentGenerationResult[] = []

  for (const { topic } of inputs.topics) {
    const result = await generateContent(
      {
        topic,
        content_template: inputs.content_template,
        platforms: inputs.platforms,
        context: inputs.context,
      },
      model
    )
    results.push(result)
  }

  return results
}

const MULTI_FIELD_SCHEMA = {
  type: 'object' as const,
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hook: { type: 'string', description: 'Openingszin (max 20 woorden)' },
          body: { type: 'string', description: 'Hoofdtekst, ik-vorm' },
          cta: { type: 'string', description: 'CTA (max 15 woorden)' },
          visual_prompt: { type: 'string', description: 'Visuele beschrijving' },
          script: { type: 'string', nullable: true, description: 'Video script of null' },
        },
        required: ['hook', 'body', 'cta', 'visual_prompt'],
      },
    },
  },
  required: ['fields'],
}

export async function generateContentFields(
  params: {
    topic: string
    fields: ('hook' | 'body' | 'cta' | 'visual_prompt' | 'script')[]
    existing_hook?: string
    existing_body?: string
    platform?: string
    content_template?: string
  },
  model?: ModelOverride
): Promise<Record<string, string>> {
  const contextLines: string[] = [`**Onderwerp:** ${params.topic}`]
  if (params.content_template) contextLines.push(`**Template:** ${params.content_template}`)
  if (params.platform) contextLines.push(`**Platform:** ${params.platform}`)
  if (params.existing_hook) contextLines.push(`**Bestaande hook:** ${params.existing_hook}`)
  if (params.existing_body) contextLines.push(`**Bestaande body:** ${params.existing_body}`)

  const fieldList = params.fields.join(', ')
  const prompt = `${contextLines.join('\n')}

Genereer alle aangevraagde velden in één keer: ${fieldList}.
Volg de schema-structuur.`

  const response = await getClient().chat.completions.create({
    model: getModel(model),
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CONTENT_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('OpenRouter retourneerde geen response voor velden')

  const result = JSON.parse(text)
  const fieldObj = result.fields[0] || {}
  return Object.fromEntries(
    params.fields.map(f => [f, fieldObj[f] || ''])
  )
}

export async function generateContentField(
  params: {
    field: 'hook' | 'body' | 'cta' | 'visual_prompt' | 'script'
    topic: string
    existing_hook?: string
    existing_body?: string
    platform?: string
    content_template?: string
  },
  model?: ModelOverride
): Promise<string> {
  const result = await generateContentFields(
    {
      topic: params.topic,
      fields: [params.field],
      existing_hook: params.existing_hook,
      existing_body: params.existing_body,
      platform: params.platform,
      content_template: params.content_template,
    },
    model
  )
  return result[params.field] || ''
}
