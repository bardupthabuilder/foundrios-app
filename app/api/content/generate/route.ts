import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/middleware/requireFeature'
import { generateContent } from '@/lib/ai'
import { channelByKey, parseChannelKey } from '@/lib/content-channels'

// POST /api/content/generate — AI content generatie (tier-gated: content_ai)
export async function POST(request: NextRequest) {
  const gate = await requireFeature('content_ai')
  if (!gate.ok) return gate.response
  const tenantId = gate.tenantId

  const supabase = await createClient()

  const body = await request.json()
  const { topic, content_template, platforms, context } = body as {
    topic: string
    content_template: string
    platforms: string[]
    context?: string
  }

  if (!topic || !content_template || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json(
      { error: 'topic, content_template en platforms zijn verplicht' },
      { status: 400 }
    )
  }

  // platforms bevat channel-keys ("facebook:zakelijk") — voor de AI-prompt
  // gebruiken we de leesbare labels, voor content_distributions de losse
  // platform/profile_type velden.
  const channelLabels = platforms.map((key) => channelByKey(key)?.label ?? key)
  const channels = platforms.map(parseChannelKey).filter((c): c is { platform: string; profile_type: string } => c !== null)

  // Genereer content via Claude
  let generated
  try {
    generated = await generateContent({ topic, content_template, platforms: channelLabels, context })
  } catch (err) {
    console.error('Content generatie mislukt:', err)
    return NextResponse.json({ error: 'AI generatie mislukt' }, { status: 500 })
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
    } as any)
    .select()
    .single()

  if (insertError || !contentItem) {
    return NextResponse.json({ error: insertError?.message }, { status: 500 })
  }

  // Maak distributies aan voor elk kanaal
  if (channels.length > 0) {
    const distributionInserts = channels.map((c) => ({
      content_item_id: contentItem.id,
      tenant_id: tenantId,
      platform: c.platform,
      profile_type: c.profile_type,
      status: 'gepland',
    }))

    await supabase
      .from('content_distributions')
      .insert(distributionInserts as any)
  }

  // Haal het content item op met distributies
  const { data, error } = await supabase
    .from('content_items')
    .select('*, content_distributions(*)')
    .eq('id', contentItem.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
