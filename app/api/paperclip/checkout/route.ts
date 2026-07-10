import { NextRequest, NextResponse } from 'next/server'

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://api.paperclip.ing'
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY

// POST checkout issue
export async function POST(req: NextRequest) {
  try {
    if (!PAPERCLIP_API_KEY) {
      return NextResponse.json(
        { error: 'Paperclip API key not configured' },
        { status: 500 }
      )
    }

    const { issueId, agentId } = await req.json()

    if (!issueId || !agentId) {
      return NextResponse.json(
        { error: 'Missing issueId or agentId' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${PAPERCLIP_API_URL}/api/issues/${issueId}/checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAPERCLIP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Paperclip-Run-Id': 'bardos-mobile-ui',
        },
        body: JSON.stringify({
          agentId,
          expectedStatuses: ['todo', 'backlog', 'blocked'],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `Checkout failed: ${error}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to checkout issue' },
      { status: 500 }
    )
  }
}
