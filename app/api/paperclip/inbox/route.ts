import { NextRequest, NextResponse } from 'next/server'

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://api.paperclip.ing'
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY

// GET inbox/tasks
export async function GET(req: NextRequest) {
  try {
    if (!PAPERCLIP_API_KEY) {
      return NextResponse.json(
        { error: 'Paperclip API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `${PAPERCLIP_API_URL}/api/agents/me/inbox-lite`,
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
      { error: error.message || 'Failed to fetch inbox' },
      { status: 500 }
    )
  }
}
