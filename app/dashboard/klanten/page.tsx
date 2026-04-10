'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Plus, Phone, Mail, MapPin } from 'lucide-react'
import type { Client } from '@/lib/types/project'

export default function KlantenPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then(setClients)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        contact_name: contactName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        notes: notes || null,
      }),
    })
    if (res.ok) {
      const client = await res.json()
      setClients((prev) => [client, ...prev])
      setDialogOpen(false)
      setName(''); setContactName(''); setPhone(''); setEmail(''); setAddress(''); setCity(''); setNotes('')
    }
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Klanten</h1>
          <p className="text-sm text-zinc-500 mt-1">Je opdrachtgevers en contacten</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Klant toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Klant toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Naam / Bedrijfsnaam *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Familie De Vries" />
              </div>
              <div>
                <Label>Contactpersoon</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jan de Vries" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefoon</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06-12345678" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@devries.nl" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Adres</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dorpsstraat 12" />
                </div>
                <div>
                  <Label>Plaats</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Amersfoort" />
                </div>
              </div>
              <div>
                <Label>Notities</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bijzonderheden..." rows={2} />
              </div>
              <Button onClick={handleAdd} disabled={!name.trim() || saving} className="w-full">
                {saving ? 'Opslaan...' : 'Toevoegen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Laden...</div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">Nog geen klanten. Voeg je eerste klant toe of converteer een lead.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Card key={client.id} className="cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => router.push(`/dashboard/klanten/${client.id}`)}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-full bg-zinc-100 shrink-0 flex items-center justify-center text-zinc-600 text-sm font-bold">
                  {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{client.name}</div>
                  {client.contact_name && <div className="text-sm text-zinc-500">{client.contact_name}</div>}
                  <div className="flex items-center gap-3 text-sm text-zinc-400 mt-0.5">
                    {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
                    {client.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.city}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
