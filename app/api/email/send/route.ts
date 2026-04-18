import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/tenant'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
})

export async function POST(request: NextRequest) {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = EmailSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await sendEmail(parsed.data)

  if (!result.success) {
    return NextResponse.json({ error: result.reason }, { status: 500 })
  }

  return NextResponse.json({ sent: true, id: result.id })
}
