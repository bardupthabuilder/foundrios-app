import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { generateContent } from '@/lib/ai'

// POST /api/content/batch — batch AI content generatie voor meerdere onderwerpen
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const { topics, content_template, platforms, context } = body as {
    topics: string[]
    content_template: string
    platforms: string[]
    context?: string
  }

  if (!Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json({ error: 'topics moet een niet-lege array zijn' }, { status: 400 })
  }
  if (!content_template) {
    return NextResponse.json({ error: 'content_template is verplicht' }, { status: 400 })
  }
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'platforms is verplicht' }, { status: 400 })
  }

  const batch_id = crypto.randomUUID()
  const createdItems: unknown[] = []

  for (const topic of topics) {
    // Genereer content via Claude
    let generated
    try {
      generated = await generateContent({ topic, content_template, platforms, context })
    } catch (err) {
      console.error(`Content generatie mislukt voor topic "${topic}":`, err)
      // Sla over bij fout, ga door met volgende topic
      continue
    }

    // Sla het content item op
    const { data: contentItem, error: insertError } = await supabase
      .from('content_items')
      .insert({
        tenant_id: tenantId,
        title: generated.title,
        hook: generated.hook,
        body: generated.body,
        cta: generated.cta,
        visual_prompt: generated.visual_prompt,
        script: generated.script ?? null,
        tags: generated.tags,
        content_template: content_template as any,
        platforms,
        status: 'ideeen' as any,
        ai_generated: true,
        batch_id,
      } as any)
      .select()
      .single()

    if (insertError || !contentItem) {
      console.error(`Insert mislukt voor topic "${topic}":`, insertError?.message)
      continue
    }

    // Maak distributies aan voor elk platform
    if (platforms.length > 0) {
      const distributionInserts = platforms.map((platform) => ({
        content_item_id: contentItem.id,
        tenant_id: tenantId,
        platform,
        status: 'gepland',
      }))

      await supabase
        .from('content_distributions')
        .insert(distributionInserts as any)
    }

    createdItems.push(contentItem)
  }

  // Haal alle aangemaakt items op met distributies
  const { data, error } = await supabase
    .from('content_items')
    .select('*, content_distributions(*)')
    .eq('batch_id', batch_id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ batch_id, items: data }, { status: 201 })
}
