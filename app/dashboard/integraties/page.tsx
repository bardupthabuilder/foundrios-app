'use client'

import { useState, useEffect, useCallback } from 'react'
import Nango from '@nangohq/frontend'
import { INTEGRATIONS } from '@/lib/nango'
import { Plug, CheckCircle2, Loader2, ExternalLink, Unplug } from 'lucide-react'

type Connection = {
  id: string
  connectionId: string
  providerConfigKey: string
  provider: string
  createdAt: string
}

export default function IntegratiesPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    const res = await fetch('/api/integrations/connections')
    const data = await res.json()
    setConnections(data.connections || [])
    setConfigured(data.configured ?? false)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  async function handleConnect(integrationId: string) {
    setConnecting(integrationId)

    try {
      // Get session token from our API
      const sessionRes = await fetch('/api/integrations/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      })

      if (!sessionRes.ok) {
        const err = await sessionRes.json()
        alert(err.error || 'Kon verbinding niet starten')
        setConnecting(null)
        return
      }

      const { sessionToken } = await sessionRes.json()

      // Open Nango Connect UI
      const nango = new Nango()
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          if (event.type === 'close') {
            setConnecting(null)
            fetchConnections()
          } else if (event.type === 'connect') {
            fetchConnections()
          }
        },
      })

      connect.setSessionToken(sessionToken)
    } catch (err) {
      console.error('Connect failed:', err)
      alert('Verbinding mislukt — probeer opnieuw')
      setConnecting(null)
    }
  }

  function isConnected(integrationId: string): boolean {
    return connections.some(c => c.providerConfigKey === integrationId)
  }

  function getConnection(integrationId: string): Connection | undefined {
    return connections.find(c => c.providerConfigKey === integrationId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pt-16 sm:p-6 lg:pt-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
          Integraties
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Verbind je tools — FoundriOS handelt de rest af
        </p>
      </div>

      {!configured && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
          <p className="text-sm text-orange-400">
            Nango is nog niet geconfigureerd. Voeg <code className="rounded bg-foundri-card px-1">NANGO_SECRET_KEY</code> toe aan je environment variables om integraties te activeren.
          </p>
        </div>
      )}

      {/* Integration Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const connected = isConnected(integration.id)
          const conn = getConnection(integration.id)
          const isConnecting = connecting === integration.id

          return (
            <div
              key={integration.id}
              className={`rounded-lg border p-5 transition-colors ${
                connected
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-white/5 bg-foundri-deep'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                    <p className="text-xs text-zinc-400">{integration.description}</p>
                  </div>
                </div>
                {integration.tier !== 'free' && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    integration.tier === 'scale'
                      ? 'bg-foundri-yellow/20 text-foundri-yellow'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {integration.tier}
                  </span>
                )}
              </div>

              <div className="mt-4">
                {connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Verbonden
                    </div>
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.id)}
                    disabled={!configured || isConnecting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-foundri-card px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foundri-hover disabled:opacity-40"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verbinden...
                      </>
                    ) : (
                      <>
                        <Plug className="h-4 w-4" />
                        Verbinden
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-white/5 bg-foundri-deep p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Hoe werkt het?</h3>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>1. Klik op <strong className="text-zinc-200">Verbinden</strong> bij een integratie</p>
          <p>2. Geef toestemming via het beveiligde OAuth-scherm</p>
          <p>3. FoundriOS synchroniseert automatisch — tokens worden veilig beheerd</p>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
          <ExternalLink className="h-3 w-3" />
          Powered by Nango — 250+ API integraties
        </div>
      </div>
    </div>
  )
}
