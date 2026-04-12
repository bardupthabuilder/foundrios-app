'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Copy, Check, Clock, Users } from 'lucide-react'

type Invite = {
  id: string
  email: string
  role: string
  status: string
  token: string
  created_at: string
  expires_at: string
}

type TenantUser = {
  id: string
  user_id: string
  role: string
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Eigenaar',
  admin: 'Admin',
  viewer: 'Medewerker',
}

export function UsersSection() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tenant/invites')
      .then((r) => r.json())
      .then((data) => {
        setInvites(data.invites ?? [])
        setUsers(data.users ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleInvite() {
    setSending(true)
    setError(null)
    setSent(false)

    const res = await fetch('/api/tenant/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    if (res.ok) {
      const invite = await res.json()
      setInvites((prev) => [invite, ...prev])
      setSent(true)
      setEmail('')
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Uitnodiging mislukt')
    }
    setSending(false)
  }

  function copyInviteLink(invite: Invite) {
    const url = `${window.location.origin}/invite?token=${invite.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gebruikers
        </CardTitle>
        <CardDescription>
          Nodig teamleden uit om samen te werken in FoundriOS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actieve gebruikers */}
        <div>
          <h3 className="text-sm font-medium text-zinc-700 mb-2">Actieve gebruikers ({users.length})</h3>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="text-sm">
                  <span className="font-medium">{u.user_id.slice(0, 8)}...</span>
                </div>
                <Badge variant={u.role === 'owner' ? 'default' : 'outline'} className="text-xs">
                  {ROLE_LABELS[u.role] || u.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Openstaande uitnodigingen */}
        {pendingInvites.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">Openstaande uitnodigingen</h3>
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-dashed p-3">
                  <div>
                    <div className="text-sm font-medium">{inv.email}</div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Verloopt {new Date(inv.expires_at).toLocaleDateString('nl-NL')}
                      <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[inv.role]}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(inv)}
                  >
                    {copiedId === inv.id ? (
                      <><Check className="h-3 w-3 mr-1" /> Gekopieerd</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Link kopiëren</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nieuw uitnodigen */}
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-700 flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Iemand uitnodigen
          </h3>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {sent && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              Uitnodiging aangemaakt. Kopieer de link en stuur deze naar de gebruiker.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">E-mailadres</Label>
              <Input
                type="email"
                placeholder="collega@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Medewerker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleInvite} disabled={!email.trim() || sending} size="sm">
            {sending ? 'Uitnodigen...' : 'Uitnodigen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
