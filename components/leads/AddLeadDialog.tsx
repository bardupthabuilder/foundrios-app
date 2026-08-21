'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { LEAD_SOURCES } from '@/lib/types/lead'

interface AddLeadDialogProps {
  tenantId: string
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  city: '',
  service: '',
  source: 'manual',
  profile_type: '',
  description: '',
  message: '',
  referral_client_id: '',
}

const CONTENT_SOURCES = ['facebook_organic', 'instagram_organic']

export function AddLeadDialog({ tenantId: _ }: AddLeadDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [clients, setClients] = useState<{ id: string; name: string; company_name?: string | null }[]>([])

  useEffect(() => {
    if (form.source === 'referral' && clients.length === 0) {
      fetch('/api/clients').then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [form.source, clients.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        referral_client_id: form.referral_client_id || null,
        profile_type: form.profile_type || null,
      }),
    })

    setLoading(false)

    if (res.ok) {
      setOpen(false)
      setForm(EMPTY_FORM)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Aanvraag toevoegen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aanvraag handmatig toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een aanvraag toe vanuit Facebook, Instagram, WhatsApp of persoonlijk contact.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              required
              placeholder="Jan de Vries"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@voorbeeld.nl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06-12345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">Locatie</Label>
              <Input
                id="city"
                placeholder="Plaats"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Dienst</Label>
              <Input
                id="service"
                placeholder="Bijv. tuinaanleg"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bron</Label>
            <Select
              value={form.source}
              onValueChange={(v) => setForm({ ...form, source: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {CONTENT_SOURCES.includes(form.source) && (
            <div className="space-y-2">
              <Label>Profiel</Label>
              <Select
                value={form.profile_type}
                onValueChange={(v) => setForm({ ...form, profile_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zakelijk of persoonlijk..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zakelijk">Zakelijk</SelectItem>
                  <SelectItem value="persoonlijk">Persoonlijk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {form.source === 'referral' && (
            <div className="space-y-2">
              <Label>Doorverwezen door</Label>
              <Select value={form.referral_client_id} onValueChange={(v) => setForm({ ...form, referral_client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecteer klant..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea
              id="description"
              placeholder="Wat wil de klant?"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Eerste bericht (optioneel)</Label>
            <Textarea
              id="message"
              placeholder="Letterlijk bericht van de klant — helpt AI bij het scoren"
              rows={2}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              {loading ? 'Opslaan en scoren...' : 'Aanvraag toevoegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
