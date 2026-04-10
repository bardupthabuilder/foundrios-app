'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type InvoiceItem = { description: string; quantity: number; unit: string; unit_price_cents: number; total_cents: number }
type Invoice = {
  id: string; invoice_number: string | null; title: string | null
  status: string; amount_excl_vat: number; vat_pct: number
  issue_date: string | null; due_date: string | null; paid_at: string | null
  notes: string | null; created_at: string; clients: any; items: InvoiceItem[]
}
type Tenant = { name: string; owner_name: string | null; email: string | null; phone: string | null; website: string | null }

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

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } @page { margin: 20mm; } }
        body { margin: 0; font-family: 'Inter', system-ui, sans-serif; color: #18181b; }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#18181b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Download PDF
        </button>
        <button onClick={() => window.close()} style={{ padding: '8px 16px', background: '#f4f4f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Sluiten
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{tenant.name}</div>
            {tenant.owner_name && <div style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>{tenant.owner_name}</div>}
            {tenant.email && <div style={{ fontSize: 13, color: '#71717a' }}>{tenant.email}</div>}
            {(tenant as any).owner_phone && <div style={{ fontSize: 13, color: '#71717a' }}>{(tenant as any).owner_phone}</div>}
            {tenant.website && <div style={{ fontSize: 13, color: '#71717a' }}>{tenant.website}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#18181b' }}>FACTUUR</div>
            {invoice.invoice_number && <div style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>{invoice.invoice_number}</div>}
            {invoice.issue_date && <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>Factuurdatum: {fmtDate(invoice.issue_date)}</div>}
            {invoice.due_date && <div style={{ fontSize: 13, color: '#71717a' }}>Vervaldatum: {fmtDate(invoice.due_date)}</div>}
          </div>
        </div>

        {/* Klant */}
        {invoice.clients && (
          <div style={{ marginBottom: 32, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Aan</div>
            <div style={{ fontWeight: 600 }}>{invoice.clients.company_name || invoice.clients.name}</div>
            {invoice.clients.contact_name && <div style={{ fontSize: 13, color: '#52525b' }}>{invoice.clients.contact_name}</div>}
            {invoice.clients.address && <div style={{ fontSize: 13, color: '#52525b' }}>{invoice.clients.address}</div>}
            {invoice.clients.city && <div style={{ fontSize: 13, color: '#52525b' }}>{invoice.clients.city}</div>}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid #18181b', marginTop: 4 }}>
              <span>Totaal incl. BTW</span>
              <span>{fmt(amountInclVat)}</span>
            </div>
          </div>
        </div>

        {/* Betaalinstructies */}
        <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>Betaalinstructies</div>
          <div style={{ fontSize: 13, color: '#52525b' }}>
            Gelieve het bedrag van {fmt(amountInclVat)} over te maken naar ons rekeningnummer
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
          {tenant.name} {tenant.email ? `· ${tenant.email}` : ''} {tenant.website ? `· ${tenant.website}` : ''}
        </div>
      </div>
    </>
  )
}
