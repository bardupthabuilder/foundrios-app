'use client'

import { useEffect, useState } from 'react'

interface Metrics {
  tenant_id: string
  total_leads: number
  qualified_leads: number
  overall_qualification_rate: number
  avg_lead_value: number
  active_partner_count: number
  total_jobs_completed: number
  streets_active: number
  total_street_revenue: number
  recurring_ltv_total: number
}

export function GtMetricsSummary({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard/metrics-summary?tenant_id=${tenantId}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenantId])

  if (loading) return <div className="p-4">Laden...</div>
  if (error) return <div className="p-4 text-red-600">Fout: {error}</div>
  if (!data) return <div className="p-4 text-gray-600">Geen data beschikbaar</div>

  const metrics = [
    {
      label: 'Totaal aanvragen',
      value: data.total_leads,
      suffix: '',
      color: 'blue'
    },
    {
      label: 'Gekwalificeerd',
      value: data.qualified_leads,
      suffix: `(${data.overall_qualification_rate.toFixed(1)}%)`,
      color: 'green'
    },
    {
      label: 'Gem. aanvraagwaarde',
      value: data.avg_lead_value,
      prefix: '€',
      color: 'purple'
    },
    {
      label: 'Actieve partners',
      value: data.active_partner_count,
      suffix: '',
      color: 'orange'
    },
    {
      label: 'Klaar (jobs)',
      value: data.total_jobs_completed,
      suffix: '',
      color: 'green'
    },
    {
      label: 'Straten actief',
      value: data.streets_active,
      suffix: '',
      color: 'indigo'
    },
    {
      label: 'Straatopbrengst',
      value: data.total_street_revenue,
      prefix: '€',
      color: 'teal'
    },
    {
      label: 'Recurring LTV',
      value: data.recurring_ltv_total,
      prefix: '€',
      color: 'rose'
    }
  ]

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    teal: 'bg-teal-50 border-teal-200',
    rose: 'bg-rose-50 border-rose-200'
  }

  const textColorClasses: Record<string, string> = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900',
    indigo: 'text-indigo-900',
    teal: 'text-teal-900',
    rose: 'text-rose-900'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-6">Metrics Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`rounded-lg border-2 p-4 ${colorClasses[metric.color]}`}
          >
            <div className="text-xs text-gray-600 mb-2">{metric.label}</div>
            <div className={`text-2xl font-bold ${textColorClasses[metric.color]}`}>
              {metric.prefix}{metric.value.toFixed(0)}{metric.suffix}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
