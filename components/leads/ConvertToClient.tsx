'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'

interface ConvertToClientProps {
  leadId: string
  leadName: string
  leadPhone: string | null
  leadEmail: string | null
}

export function ConvertToClient({ leadId, leadName, leadPhone, leadEmail }: ConvertToClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(leadName)
  const [phone, setPhone] = useState(leadPhone ?? '')
  const [email, setEmail] = useState(leadEmail ?? '')
  const [contactName, setContactName] = useState('')

  async function handleConvert() {
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        contact_name: contactName || null,
        phone: phone || null,
        email: email || null,
        lead_id: leadId,
      }),
    })
    if (res.ok) {
      const client = await res.json()
      setOpen(false)
      router.push(`/dashboard/klanten`)
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />Naar Klant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lead omzetten naar klant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Naam / Bedrijfsnaam *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Contactpersoon</Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Optioneel" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefoon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleConvert} disabled={!name.trim() || saving} className="w-full">
            {saving ? 'Opslaan...' : 'Omzetten naar klant'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
