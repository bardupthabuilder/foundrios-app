import { NextRequest, NextResponse } from 'next/server'

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://api.paperclip.ing'
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY

// GET issue context
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params
  try {
    if (!PAPERCLIP_API_KEY) {
      return NextResponse.json(
        { error: 'Paperclip API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `${PAPERCLIP_API_URL}/api/issues/${issueId}/heartbeat-context`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAPERCLIP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Paperclip API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch issue' },
      { status: 500 }
    )
  }
}

// PATCH issue (update status/comment)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params
  try {
    if (!PAPERCLIP_API_KEY) {
      return NextResponse.json(
        { error: 'Paperclip API key not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()

    const response = await fetch(
      `${PAPERCLIP_API_URL}/api/issues/${issueId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${PAPERCLIP_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Paperclip-Run-Id': 'bardos-mobile-ui',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Paperclip API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update issue' },
      { status: 500 }
    )
  }
}
