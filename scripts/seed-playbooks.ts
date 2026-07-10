/**
 * FoundriOS Playbook Seeder
 *
 * Migreert bewezen SOPs/flows/prompts uit Groeneveld_Media/.claude/ naar de
 * playbooks-tabel als system-wide records (tenant_id = NULL).
 *
 * Idempotent: gebruikt source_path als unique key voor upsert.
 *
 * Run vanaf foundrios-app/:
 *   npx tsx scripts/seed-playbooks.ts [--dry-run]
 *
 * Vereist env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GM_REPO_ROOT  (optioneel; default = ../../../../..)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, basename } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')

// Default = ga 5 niveaus omhoog vanaf foundrios-app/scripts/ naar Groeneveld_Media/
const REPO_ROOT = process.env.GM_REPO_ROOT || resolve(__dirname, '../../../../..')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type Tier = 'free' | 'pro' | 'scale'

type SourceFile = {
  path: string                  // relatief vanaf REPO_ROOT
  category_slug: string
  min_tier: Tier
  subcategory?: string
}

// Mapping: bronbestand → categorie + tier
const SOURCES: SourceFile[] = [
  // Outreach library
  { path: '.claude/agents/library/hooks/hooks.md', category_slug: 'outreach-hooks', min_tier: 'pro' },
  { path: '.claude/agents/library/objections/library.md', category_slug: 'sales-bezwaren', min_tier: 'pro' },
  { path: '.claude/agents/library/outreach/angles.md', category_slug: 'outreach-angles', min_tier: 'pro' },
  { path: '.claude/agents/library/signals/latest.md', category_slug: 'outreach-signals', min_tier: 'pro' },
  { path: '.claude/agents/library/topics/topics.md', category_slug: 'content-topics', min_tier: 'pro' },

  // GM Delivery — fundamenten
  { path: '.claude/1. GM Delivery/A-onboarding-factory.md', category_slug: 'delivery', min_tier: 'pro', subcategory: 'onboarding' },
  { path: '.claude/1. GM Delivery/B-module-3-appointment-flow.md', category_slug: 'opvolging', min_tier: 'pro' },
  { path: '.claude/1. GM Delivery/B-module-4-proof-engine.md', category_slug: 'reviews', min_tier: 'pro' },
  { path: '.claude/1. GM Delivery/C-qa-monitoring.md', category_slug: 'governance', min_tier: 'pro', subcategory: 'qa' },
  { path: '.claude/1. GM Delivery/D-client-communication.md', category_slug: 'klantcommunicatie', min_tier: 'pro' },
  { path: '.claude/1. GM Delivery/E-retention-expansion.md', category_slug: 'retentie', min_tier: 'pro' },
  { path: '.claude/1. GM Delivery/F-delivery-feedback-loop.md', category_slug: 'governance', min_tier: 'pro', subcategory: 'feedback-loop' },

  // GM Delivery — Growth Unlock (Scale only)
  { path: '.claude/1. GM Delivery/B-module-1-meta-ads.md', category_slug: 'meta-ads', min_tier: 'scale' },
  { path: '.claude/1. GM Delivery/B-module-2-growzy-automations.md', category_slug: 'growzy-setup', min_tier: 'scale' },
]

type ParsedPlaybook = {
  slug: string
  title: string
  purpose: string | null
  steps: Array<{ title: string; description: string }>
  prompts: Array<{ label: string; prompt: string }>
  source_path: string
  category_slug: string
  subcategory: string | null
  min_tier: Tier
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function parseMarkdown(content: string, source: SourceFile): ParsedPlaybook {
  const lines = content.split('\n')

  // Title = eerste H1, fallback naar filename
  const h1 = lines.find(l => /^#\s+/.test(l))
  const title = h1 ? h1.replace(/^#\s+/, '').trim() : basename(source.path, '.md')

  // Purpose = eerste blockquote-regels (`> ...`) na de title
  const titleIdx = h1 ? lines.indexOf(h1) : 0
  const purposeLines: string[] = []
  for (let i = titleIdx + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/^>\s*/.test(l)) {
      purposeLines.push(l.replace(/^>\s?/, '').trim())
    } else if (purposeLines.length > 0) {
      break
    } else if (l.trim() === '') {
      continue
    } else {
      break
    }
  }
  const purpose = purposeLines.length > 0 ? purposeLines.join(' ').trim() : null

  // Steps = splits op H2 (## ...) — elk H2 wordt een stap met de inhoud eronder
  const steps: Array<{ title: string; description: string }> = []
  let currentTitle: string | null = null
  let currentBody: string[] = []
  for (const l of lines) {
    if (/^##\s+/.test(l)) {
      if (currentTitle) {
        steps.push({ title: currentTitle, description: currentBody.join('\n').trim() })
      }
      currentTitle = l.replace(/^##\s+/, '').trim()
      currentBody = []
    } else if (currentTitle) {
      currentBody.push(l)
    }
  }
  if (currentTitle) {
    steps.push({ title: currentTitle, description: currentBody.join('\n').trim() })
  }

  // Fallback: één stap met de volledige body
  if (steps.length === 0) {
    steps.push({ title: 'Inhoud', description: content.trim() })
  }

  // Prompts = code-blocks die woorden bevatten als "prompt", "instructie", of die langer zijn dan 200 chars
  const prompts: Array<{ label: string; prompt: string }> = []
  const codeBlockRegex = /```(?:[a-z]*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  let promptIdx = 1
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const body = match[1].trim()
    if (body.length >= 100) {
      prompts.push({ label: `Prompt ${promptIdx}`, prompt: body })
      promptIdx++
    }
  }

  return {
    slug: slugify(title),
    title,
    purpose,
    steps,
    prompts,
    source_path: source.path,
    category_slug: source.category_slug,
    subcategory: source.subcategory || null,
    min_tier: source.min_tier,
  }
}

async function main() {
  console.log(`[seed-playbooks] Mode: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}`)
  console.log(`[seed-playbooks] Repo root: ${REPO_ROOT}`)

  const parsed: ParsedPlaybook[] = []
  const missing: string[] = []

  for (const src of SOURCES) {
    const fullPath = resolve(REPO_ROOT, src.path)
    if (!existsSync(fullPath)) {
      missing.push(src.path)
      continue
    }
    const content = readFileSync(fullPath, 'utf-8')
    parsed.push(parseMarkdown(content, src))
  }

  console.log(`[seed-playbooks] Parsed: ${parsed.length} playbooks`)
  if (missing.length > 0) {
    console.warn(`[seed-playbooks] Missing source files (skipped):`)
    missing.forEach(m => console.warn(`  - ${m}`))
  }

  if (DRY_RUN) {
    parsed.forEach(p => {
      console.log(`\n--- ${p.source_path}`)
      console.log(`  title: ${p.title}`)
      console.log(`  slug: ${p.slug}`)
      console.log(`  category: ${p.category_slug}${p.subcategory ? '/' + p.subcategory : ''}`)
      console.log(`  min_tier: ${p.min_tier}`)
      console.log(`  steps: ${p.steps.length} | prompts: ${p.prompts.length}`)
      console.log(`  purpose: ${p.purpose?.slice(0, 100) || '(none)'}...`)
    })
    return
  }

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const p of parsed) {
    const row = {
      tenant_id: null,
      category_slug: p.category_slug,
      subcategory: p.subcategory,
      slug: p.slug,
      title: p.title,
      purpose: p.purpose,
      steps: p.steps,
      prompts: p.prompts,
      checklist: [],
      min_tier: p.min_tier,
      status: 'active',
      source_path: p.source_path,
    }

    const { data: existing } = await sb
      .from('playbooks')
      .select('id')
      .eq('source_path', p.source_path)
      .maybeSingle()

    if (existing) {
      const { error } = await sb.from('playbooks').update(row).eq('id', existing.id)
      if (error) {
        console.error(`[update fail] ${p.source_path}: ${error.message}`)
        failed++
      } else {
        updated++
      }
    } else {
      const { error } = await sb.from('playbooks').insert(row)
      if (error) {
        console.error(`[insert fail] ${p.source_path}: ${error.message}`)
        failed++
      } else {
        inserted++
      }
    }
  }

  console.log(`\n[seed-playbooks] Done: inserted=${inserted} updated=${updated} failed=${failed}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
