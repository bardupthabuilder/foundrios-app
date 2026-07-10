'use client'

import { useEffect, useState } from 'react'

interface Partner {
  id: string
  tenant_id: string
  name: string
  phone: string
  specialties: string
  is_active: boolean
  leads_assigned: number
  jobs_completed: number
  total_payments: number
  pending_payments: number
  paid_payments: number
  amount_pending: number
}

export function GtPartnerRoster({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard/partner-roster?tenant_id=${tenantId}`)
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Partner Roster</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">Naam</th>
              <th className="text-left py-2 px-3 font-medium">Telefoon</th>
              <th className="text-left py-2 px-3 font-medium">Status</th>
              <th className="text-right py-2 px-3 font-medium">Aanvragen</th>
              <th className="text-right py-2 px-3 font-medium">Klaar</th>
              <th className="text-right py-2 px-3 font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {data.map(partner => (
              <tr key={partner.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-3">{partner.name}</td>
                <td className="py-3 px-3 text-gray-600">{partner.phone}</td>
                <td className="py-3 px-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    partner.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {partner.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-medium">{partner.leads_assigned}</td>
                <td className="py-3 px-3 text-right text-green-600">{partner.jobs_completed}</td>
                <td className="py-3 px-3 text-right">
                  <div className="text-gray-600">
                    €{partner.amount_pending.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {partner.pending_payments} openstaand
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
