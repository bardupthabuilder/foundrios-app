'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type InvoiceItem = { description: string; quantity: number; unit: string; unit_price_cents: number; total_cents: number }
type Invoice = {
  id: string; invoice_number: string | null; title: string | null
  status: string; amount_excl_vat: number; amount_incl_vat: number; vat_pct: number
  issue_date: string | null; due_date: string | null; paid_at: string | null
  notes: string | null; created_at: string; invoice_type: string | null; related_quote_id: string | null
  clients: any; items: InvoiceItem[]
}
type Tenant = {
  name: string; owner_name: string | null; email: string | null; phone: string | null; address: string | null; region: string | null; website: string | null
  logo_url: string | null; iban: string | null; kvk_number: string | null; vat_number: string | null; primary_color: string | null
}

export default function InvoicePrintPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then(r => r.json()),
      fetch('/api/tenant').then(r => r.json()),
    ]).then(([inv, t]) => {
      setInvoice(inv)
      setTenant(t)
      setReady(true)
    })
  }, [id])

  useEffect(() => {
    if (ready && invoice) {
      setTimeout(() => window.print(), 500)
    }
  }, [ready, invoice])

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!invoice || !tenant) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Laden...</div>

  const amountInclVat = Math.round(invoice.amount_excl_vat * (1 + invoice.vat_pct / 100))
  const vatAmount = amountInclVat - invoice.amount_excl_vat

  const color = tenant.primary_color || '#2d6a2d'

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } @page { margin: 18mm 20mm; } }
        body { margin: 0; font-family: 'Inter', system-ui, sans-serif; color: #18181b; background: #fff; }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#18181b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Download PDF
        </button>
        <button onClick={() => window.close()} style={{ padding: '8px 16px', background: '#f4f4f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Sluiten
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, paddingBottom: 20, borderBottom: `3px solid ${color}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
            {tenant.logo_url && (
              <img src={tenant.logo_url} alt={tenant.name} style={{ maxHeight: 72, maxWidth: 160, objectFit: 'contain', marginTop: 2 }} />
            )}
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{tenant.name}</div>
              {tenant.owner_name && <div style={{ fontSize: 12, color: '#71717a', marginTop: 3 }}>{tenant.owner_name}</div>}
              {(tenant as any).owner_phone || tenant.phone
                ? <div style={{ fontSize: 12, color: '#71717a' }}>{(tenant as any).owner_phone || tenant.phone}</div>
                : null}
              {tenant.email && <div style={{ fontSize: 12, color: '#71717a' }}>{tenant.email}</div>}
              {tenant.website && <div style={{ fontSize: 12, color: '#71717a' }}>{tenant.website}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: 1 }}>FACTUUR</div>
            {invoice.invoice_number && <div style={{ fontSize: 13, color: '#71717a', marginTop: 4, fontWeight: 500 }}>{invoice.invoice_number}</div>}
            {invoice.issue_date && <div style={{ fontSize: 12, color: '#71717a', marginTop: 3 }}>Datum: {fmtDate(invoice.issue_date)}</div>}
            {invoice.due_date && <div style={{ fontSize: 12, color: '#71717a' }}>Vervaldatum: {fmtDate(invoice.due_date)}</div>}
          </div>
        </div>

        {/* Klant */}
        {invoice.clients && (
          <div style={{ marginBottom: 32, padding: '14px 16px', background: '#f9fafb', borderRadius: 8, borderLeft: `4px solid ${color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Aan</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{invoice.clients.company_name || invoice.clients.name}</div>
            {invoice.clients.contact_name && <div style={{ fontSize: 13, color: '#52525b', marginTop: 2 }}>{invoice.clients.contact_name}</div>}
            {invoice.clients.address && <div style={{ fontSize: 13, color: '#52525b' }}>{invoice.clients.address}</div>}
            {invoice.clients.city && <div style={{ fontSize: 13, color: '#52525b' }}>{invoice.clients.city}</div>}
            {invoice.clients.phone && <div style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>{invoice.clients.phone}</div>}
            {invoice.clients.email && <div style={{ fontSize: 13, color: '#52525b' }}>{invoice.clients.email}</div>}
          </div>
        )}

        {/* Titel */}
        {invoice.title && (
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>{invoice.title}</div>
        )}

        {/* Regels */}
        {invoice.items && invoice.items.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e4e4e7' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#71717a' }}>Omschrijving</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#71717a', width: 70 }}>Aantal</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#71717a', width: 60 }}>Eenheid</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#71717a', width: 90 }}>Prijs</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#71717a', width: 90 }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: InvoiceItem, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '10px 0', fontSize: 14 }}>{item.description}</td>
                  <td style={{ padding: '10px 0', fontSize: 14, textAlign: 'right' }}>{Number(item.quantity)}</td>
                  <td style={{ padding: '10px 0', fontSize: 14 }}>{item.unit}</td>
                  <td style={{ padding: '10px 0', fontSize: 14, textAlign: 'right' }}>{fmt(item.unit_price_cents)}</td>
                  <td style={{ padding: '10px 0', fontSize: 14, textAlign: 'right', fontWeight: 500 }}>{fmt(item.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {/* Totalen */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <div style={{ width: 250 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#71717a' }}>Subtotaal excl. BTW</span>
              <span>{fmt(invoice.amount_excl_vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#71717a' }}>BTW ({invoice.vat_pct}%)</span>
              <span>{fmt(vatAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 700, borderTop: `2px solid ${color}`, marginTop: 4, color }}>
              <span>Totaal incl. BTW</span>
              <span>{fmt(amountInclVat)}</span>
            </div>
          </div>
        </div>

        {/* Betaalinstructies */}
        <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>Betaalinstructies</div>
          <div style={{ fontSize: 13, color: '#52525b' }}>
            Gelieve het bedrag van {fmt(amountInclVat)} over te maken naar rekeningnummer {tenant.iban || 'ons rekeningnummer'}
            onder vermelding van {invoice.invoice_number || 'het factuurnummer'}.
            {invoice.due_date && ` Betaal voor ${fmtDate(invoice.due_date)}.`}
          </div>
        </div>

        {/* Notities */}
        {invoice.notes && (
          <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>Opmerkingen</div>
            <div style={{ fontSize: 13, color: '#52525b', whiteSpace: 'pre-wrap' }}>{invoice.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 16, fontSize: 12, color: '#a1a1aa', textAlign: 'center' }}>
          {tenant.name}{tenant.email && ` · ${tenant.email}`}{tenant.website && ` · ${tenant.website}`}{tenant.kvk_number && ` · KvK: ${tenant.kvk_number}`}{tenant.vat_number && ` · VAT: ${tenant.vat_number}`}
        </div>
      </div>
    </>
  )
}
