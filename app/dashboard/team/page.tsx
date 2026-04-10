'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HardHat, Plus, Phone, Mail, Pencil } from 'lucide-react'
import type { Employee } from '@/lib/types/project'

const ROLE_LABELS: Record<string, string> = {
  eigenaar: 'Eigenaar',
  voorman: 'Voorman',
  monteur: 'Monteur',
  leerling: 'Leerling',
  zzp: 'ZZP',
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function TeamPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('monteur')
  const [color, setColor] = useState('#6366f1')

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then(setEmployees)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    setSaving(true)
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone: phone || null, email: email || null, role, color }),
    })
    if (res.ok) {
      const emp = await res.json()
      setEmployees((prev) => [...prev, emp])
      setDialogOpen(false)
      setName('')
      setPhone('')
      setEmail('')
      setRole('monteur')
      setColor('#6366f1')
    }
    setSaving(false)
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('monteur')
  const [editColor, setEditColor] = useState('#6366f1')
  const [editSaving, setEditSaving] = useState(false)

  function openEdit(emp: Employee) {
    setEditId(emp.id)
    setEditName(emp.name)
    setEditPhone(emp.phone || '')
    setEditEmail(emp.email || '')
    setEditRole(emp.role || 'monteur')
    setEditColor(emp.color || '#6366f1')
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editId) return
    setEditSaving(true)
    const res = await fetch(`/api/employees/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        phone: editPhone || null,
        email: editEmail || null,
        role: editRole,
        color: editColor,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setEmployees((prev) => prev.map((e) => e.id === editId ? { ...e, ...updated } : e))
      setEditOpen(false)
    }
    setEditSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medewerkers</h1>
          <p className="text-sm text-zinc-500 mt-1">Beheer je team en monteurs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Medewerker toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Naam *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan de Boer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefoon</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06-12345678" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@bedrijf.nl" />
                </div>
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kleur (planningsbord)</Label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? 'border-zinc-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HardHat className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">Nog geen medewerkers. Voeg je eerste teamlid toe.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {employees.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: emp.color }}>
                  {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{emp.name}</div>
                  <div className="flex items-center gap-3 text-sm text-zinc-500 mt-0.5">
                    <Badge variant="secondary" className="text-xs">{ROLE_LABELS[emp.role] ?? emp.role}</Badge>
                    {emp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{emp.phone}</span>}
                    {emp.email && <span className="hidden sm:flex items-center gap-1"><Mail className="h-3 w-3" />{emp.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-600" onClick={() => handleDeactivate(emp.id)}>
                    Deactiveren
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medewerker bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Naam *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefoon</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kleur</Label>
              <div className="flex gap-2 mt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${editColor === c ? 'border-zinc-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleEdit} disabled={!editName.trim() || editSaving} className="w-full">
              {editSaving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
