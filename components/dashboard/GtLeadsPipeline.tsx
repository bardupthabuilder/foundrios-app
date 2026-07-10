'use client'

import { useEffect, useState } from 'react'

interface PipelineStage {
  tenant_id: string
  pipeline_stage: string
  lead_count: number
  qualified_count: number
  qualification_rate: number
  avg_days_in_stage: number
}

export function GtLeadsPipeline({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard/leads-pipeline?tenant_id=${tenantId}`)
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

  const stages = ['new', 'contacted', 'qualified', 'scheduled', 'executing', 'invoiced', 'recurring']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Leads Pipeline</h2>
      <div className="space-y-3">
        {stages.map(stage => {
          const stageData = data.find(d => d.pipeline_stage === stage)
          const count = stageData?.lead_count || 0
          const qualified = stageData?.qualified_count || 0
          const rate = stageData?.qualification_rate || 0

          return (
            <div key={stage} className="border rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium capitalize">{stage}</span>
                <span className="text-sm text-gray-600">{count} leads</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{qualified} gekwalificeerd ({rate.toFixed(1)}%)</span>
                {stageData && <span>{stageData.avg_days_in_stage.toFixed(1)} dagen gem.</span>}
              </div>
              <div className="w-full bg-gray-200 rounded h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${Math.min((qualified / Math.max(count, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
