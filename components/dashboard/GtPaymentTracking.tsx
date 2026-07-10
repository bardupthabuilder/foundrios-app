'use client'

import { useEffect, useState } from 'react'

interface Payment {
  tenant_id: string
  partner_id: string
  partner_name: string
  status: string
  payment_count: number
  total_amount: number
  avg_amount: number
  oldest_payment: string
  latest_paid: string
}

export function GtPaymentTracking({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard/payment-tracking?tenant_id=${tenantId}`)
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

  const groupedByStatus = data.reduce((acc, payment) => {
    if (!acc[payment.status]) {
      acc[payment.status] = []
    }
    acc[payment.status].push(payment)
    return acc
  }, {} as Record<string, Payment[]>)

  const statusLabels: Record<string, string> = {
    pending: 'Openstaand',
    paid: 'Betaald',
    overdue: 'Achterstallig'
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200',
    paid: 'bg-green-50 border-green-200',
    overdue: 'bg-red-50 border-red-200'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-6">Payment Tracking</h2>
      <div className="space-y-6">
        {Object.entries(groupedByStatus).map(([status, payments]) => (
          <div key={status} className={`rounded-lg border-2 p-4 ${statusColors[status]}`}>
            <h3 className="font-semibold mb-3">{statusLabels[status]}</h3>
            <div className="space-y-2">
              {payments.map((payment, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{payment.partner_name}</div>
                    <div className="text-xs text-gray-600">
                      {payment.payment_count} betalingen · gem. €{payment.avg_amount.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">€{payment.total_amount.toFixed(0)}</div>
                    {status === 'pending' && payment.oldest_payment && (
                      <div className="text-xs text-gray-600">
                        sinds {new Date(payment.oldest_payment).toLocaleDateString('nl-NL')}
                      </div>
                    )}
                    {status === 'paid' && payment.latest_paid && (
                      <div className="text-xs text-gray-600">
                        {new Date(payment.latest_paid).toLocaleDateString('nl-NL')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
