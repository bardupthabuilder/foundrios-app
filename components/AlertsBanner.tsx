'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Inbox, Receipt, FolderOpen, Clock, ChevronRight } from 'lucide-react'

type Alert = {
  type: 'lead' | 'invoice' | 'project' | 'hours'
  severity: 'warning' | 'urgent'
  title: string
  description: string
  link: string
}

const typeIcons = {
  lead: Inbox,
  invoice: Receipt,
  project: FolderOpen,
  hours: Clock,
}

export function AlertsBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Aandachtspunten ({alerts.length})
      </h3>
      {alerts.slice(0, 5).map((alert, i) => {
        const Icon = typeIcons[alert.type]
        return (
          <Link
            key={i}
            href={alert.link}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-zinc-50 ${
              alert.severity === 'urgent' ? 'border-red-200 bg-red-50/50' : 'border-orange-200 bg-orange-50/30'
            }`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              alert.severity === 'urgent' ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              <Icon className={`h-4 w-4 ${alert.severity === 'urgent' ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${alert.severity === 'urgent' ? 'text-red-900' : 'text-orange-900'}`}>
                {alert.title}
              </p>
              <p className={`text-xs ${alert.severity === 'urgent' ? 'text-red-700' : 'text-orange-700'}`}>
                {alert.description}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </Link>
        )
      })}
      {alerts.length > 5 && (
        <p className="text-xs text-zinc-400 text-center">
          +{alerts.length - 5} meer
        </p>
      )}
    </div>
  )
}
