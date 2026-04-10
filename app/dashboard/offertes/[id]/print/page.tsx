'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type QuoteItem = { description: string; quantity: number; unit: string; unit_price_cents: number; total_cents: number }
type Quote = {
  id: string; quote_number: string | null; title: string; description: string | null
  status: string; amount_excl_vat: number; amount_incl_vat: number; vat_pct: number
  valid_until: string | null; created_at: string; notes: string | null
  clients: any; items: QuoteItem[]
}
type Tenant = { name: string; owner_name: string | null; email: string | null; phone: string | null; address: string | null; region: string | null; website: string | null }

export default function QuotePrintPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${id}`).then(r => r.json()),
      fetch('/api/tenant').then(r => r.json()),
    ]).then(([q, t]) => {
      setQuote(q)
      setTenant(t)
      setReady(true)
    })
  }, [id])

  useEffect(() => {
    if (ready && quote) {
      setTimeout(() => window.print(), 500)
    }
  }, [ready, quote])

  const fmt = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!quote || !tenant) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Laden...</div>

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
            <div style={{ fontSize: 28, fontWeight: 700, color: '#18181b' }}>OFFERTE</div>
            {quote.quote_number && <div style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>{quote.quote_number}</div>}
            <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>Datum: {fmtDate(quote.created_at)}</div>
            {quote.valid_until && <div style={{ fontSize: 13, color: '#71717a' }}>Geldig tot: {fmtDate(quote.valid_until)}</div>}
          </div>
        </div>

        {/* Klant */}
        {quote.clients && (
          <div style={{ marginBottom: 32, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Aan</div>
            <div style={{ fontWeight: 600 }}>{quote.clients.company_name || quote.clients.name}</div>
            {quote.clients.contact_name && <div style={{ fontSize: 13, color: '#52525b' }}>{quote.clients.contact_name}</div>}
            {quote.clients.address && <div style={{ fontSize: 13, color: '#52525b' }}>{quote.clients.address}</div>}
            {quote.clients.city && <div style={{ fontSize: 13, color: '#52525b' }}>{quote.clients.city}</div>}
            {quote.clients.email && <div style={{ fontSize: 13, color: '#52525b' }}>{quote.clients.email}</div>}
          </div>
        )}

        {/* Titel + omschrijving */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{quote.title}</div>
          {quote.description && <div style={{ fontSize: 14, color: '#52525b', marginTop: 8, whiteSpace: 'pre-wrap' }}>{quote.description}</div>}
        </div>

        {/* Regels */}
        {quote.items.length > 0 && (
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
              {quote.items.map((item, i) => (
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
        )}

        {/* Totalen */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <div style={{ width: 250 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#71717a' }}>Subtotaal excl. BTW</span>
              <span>{fmt(quote.amount_excl_vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#71717a' }}>BTW ({quote.vat_pct}%)</span>
              <span>{fmt(quote.amount_incl_vat - quote.amount_excl_vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid #18181b', marginTop: 4 }}>
              <span>Totaal incl. BTW</span>
              <span>{fmt(quote.amount_incl_vat)}</span>
            </div>
          </div>
        </div>

        {/* Notities */}
        {quote.notes && (
          <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 4 }}>Opmerkingen</div>
            <div style={{ fontSize: 13, color: '#52525b', whiteSpace: 'pre-wrap' }}>{quote.notes}</div>
          </div>
        )}

        {/* Premium sectie: Waarom wij */}
        {(((tenant as any).premium_guarantees?.length > 0) || ((tenant as any).premium_usp?.length > 0) || (tenant as any).google_review_score) && (
          <div style={{ padding: 20, background: '#18181b', borderRadius: 8, marginBottom: 32, color: '#fff' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Waarom kiezen voor {tenant.name}?
            </div>
            {(tenant as any).premium_tagline && (
              <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 12, fontStyle: 'italic' }}>{(tenant as any).premium_tagline}</div>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
              {((tenant as any).premium_usp as string[] ?? []).map((usp: string, i: number) => (
                <div key={i} style={{ flex: '1 1 200px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#22c55e', fontSize: 16, lineHeight: 1 }}>✓</span>
                  <span style={{ fontSize: 13 }}>{usp}</span>
                </div>
              ))}
            </div>
            {((tenant as any).premium_guarantees as string[] ?? []).length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #333' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Onze garanties</div>
                {((tenant as any).premium_guarantees as string[]).map((g: string, i: number) => (
                  <div key={i} style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#f59e0b' }}>★</span> {g}
                  </div>
                ))}
              </div>
            )}
            {(tenant as any).google_review_score && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #333', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{(tenant as any).google_review_score}/5</span>
                  {(tenant as any).google_review_count && <span style={{ fontSize: 12, color: '#a1a1aa' }}> op basis van {(tenant as any).google_review_count} reviews</span>}
                </div>
              </div>
            )}
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
