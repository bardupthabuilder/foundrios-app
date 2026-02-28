'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LeadStatus } from '@/lib/types/lead'

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nieuw' },
  { value: 'hot', label: '🔥 Hot' },
  { value: 'warm', label: '🌡️ Warm' },
  { value: 'cold', label: '❄️ Cold' },
  { value: 'won', label: '✅ Gewonnen' },
  { value: 'lost', label: '❌ Verloren' },
]

interface LeadStatusSelectProps {
  leadId: string
  currentStatus: LeadStatus
}

export function LeadStatusSelect({ leadId, currentStatus }: LeadStatusSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)

  async function handleChange(newStatus: LeadStatus) {
    setStatus(newStatus)

    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-36 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
