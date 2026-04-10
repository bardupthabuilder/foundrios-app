'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export function DemoSeedBanner() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSeed() {
    setLoading(true)
    try {
      const res = await fetch('/api/demo-seed', { method: 'POST' })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <Card className="border-dashed border-zinc-300 bg-zinc-50/50">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
          <Sparkles className="h-5 w-5 text-zinc-500" />
        </div>
        <div>
          <p className="font-medium text-zinc-900">Je dashboard is nog leeg</p>
          <p className="mt-1 text-sm text-zinc-500">
            Vul je account met realistische voorbeelddata om het systeem te verkennen.
          </p>
        </div>
        <Button onClick={handleSeed} disabled={loading} variant="outline" size="sm">
          {loading ? 'Data laden...' : 'Vul demo data'}
        </Button>
      </CardContent>
    </Card>
  )
}
