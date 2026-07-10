import { requireTenant } from '@/lib/tenant'
import { GtLeadsPipeline } from '@/components/dashboard/GtLeadsPipeline'
import { GtPartnerRoster } from '@/components/dashboard/GtPartnerRoster'
import { GtPaymentTracking } from '@/components/dashboard/GtPaymentTracking'
import { GtMetricsSummary } from '@/components/dashboard/GtMetricsSummary'

export default async function GroeneveldsTuinenDashboard() {
  const { tenantId } = await requireTenant()

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-green-700 to-green-600 border-b-4 border-green-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Groeneveld Tuinen</h1>
              <p className="text-green-100">Bedrijfsdashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <GtMetricsSummary tenantId={tenantId} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GtLeadsPipeline tenantId={tenantId} />
            <GtPaymentTracking tenantId={tenantId} />
          </div>

          <GtPartnerRoster tenantId={tenantId} />
        </div>
      </div>
    </div>
  )
}
