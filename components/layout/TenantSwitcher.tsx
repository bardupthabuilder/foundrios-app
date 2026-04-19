'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Building2 } from 'lucide-react'

type TenantOption = {
  tenant_id: string
  tenant_name: string
  role: string
  is_active: boolean
}

export function TenantSwitcher({ currentName }: { currentName: string }) {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tenants/list')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.tenants && data.tenants.length > 1) {
          setTenants(data.tenants)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSwitch(tenantId: string) {
    setSwitching(true)
    await fetch('/api/tenants/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    })
    setOpen(false)
    router.refresh()
    window.location.reload()
  }

  // Only show switcher if user has access to multiple tenants
  if (tenants.length <= 1) {
    return (
      <span className="font-semibold tracking-tight truncate text-white text-sm">
        {currentName}
      </span>
    )
  }

  const activeTenant = tenants.find(t => t.is_active)

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/5"
      >
        <span className="font-semibold tracking-tight truncate text-white text-sm">
          {activeTenant?.tenant_name || currentName}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/10 bg-foundri-deep shadow-xl">
          <div className="p-1">
            {tenants.map(t => (
              <button
                key={t.tenant_id}
                onClick={() => handleSwitch(t.tenant_id)}
                disabled={switching}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  t.is_active
                    ? 'bg-foundri-yellow/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{t.tenant_name}</span>
                {t.is_active && <Check className="h-3.5 w-3.5 text-foundri-yellow shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
