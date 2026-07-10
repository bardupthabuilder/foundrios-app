'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type QuoteItem = { description: string; quantity: number; unit: string; unit_price_cents: number; total_cents: number }
type Quote = {
  id: string; quote_number: string | null; title: string; description: string | null
  status: string; amount_excl_vat: number; amount_incl_vat: number; vat_pct: number
  valid_until: string | null; created_at: string; notes: string | null
  advance_pct: number | null; milestone_pct: number | null; final_pct: number | null
  payment_note: string | null
  clients: any; items: QuoteItem[]
}
type Tenant = {
  name: string; owner_name: string | null; email: string | null; phone: string | null
  address: string | null; website: string | null; logo_url: string | null
  iban: string | null; kvk_number: string | null; vat_number: string | null
  primary_color: string | null; default_payment_days: number | null
}

export default function QuotePrintPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${id}`).then(r => r.json()),
      fetch('/api/tenant').then(r => r.json()),
    ]).then(([q, t]) => { setQuote(q); setTenant(t); setReady(true) })
  }, [id])

  useEffect(() => {
    if (ready && quote) setTimeout(() => window.print(), 600)
  }, [ready, quote])

  const fmt = (cents: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!quote || !tenant) {
    return <div style={{ padding: 40, background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>Laden...</div>
  }

  const color = tenant.primary_color || '#166534'
  const ownerPhone = (tenant as any).owner_phone || tenant.phone
  const vatAmount = quote.amount_incl_vat - quote.amount_excl_vat

  const S = {
    page: { maxWidth: 740, margin: '0 auto', padding: '52px 56px', background: '#fff' } as React.CSSProperties,
    label: { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: 4 },
    divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '28px 0' } as React.CSSProperties,
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #111827; font-size: 14px; line-height: 1.55; }
        @media screen { body { background: #f3f4f6; } .print-wrap { padding: 32px 0 48px; } }
        @media print {
          html, body { background: #fff; }
          .print-wrap { padding: 0; }
          @page { margin: 14mm 16mm; size: A4; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; vertical-align: top; }
      `}</style>

      <div className="print-wrap">

        <div style={S.page}>

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt={tenant.name}
                  style={{ maxHeight: 56, maxWidth: 130, objectFit: 'contain', marginTop: 2 }} />
              )}
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color, lineHeight: 1.2 }}>{tenant.name}</div>
                {tenant.owner_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{tenant.owner_name}</div>}
                {ownerPhone && <div style={{ fontSize: 12, color: '#6b7280' }}>{ownerPhone}</div>}
                {tenant.email && <div style={{ fontSize: 12, color: '#6b7280' }}>{tenant.email}</div>}
                {tenant.website && <div style={{ fontSize: 12, color: '#6b7280' }}>{tenant.website}</div>}
              </div>
            </div>
            {/* Right */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '0.06em', lineHeight: 1 }}>OFFERTE</div>
              {quote.quote_number && (
                <div style={{ fontSize: 13, color: '#374151', marginTop: 6, fontWeight: 500 }}>{quote.quote_number}</div>
              )}
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Datum: {fmtDate(quote.created_at)}</div>
              {quote.valid_until && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>Geldig tot: {fmtDate(quote.valid_until)}</div>
              )}
            </div>
          </div>

          <hr style={S.divider} />

          {/* ── AAN ── */}
          {quote.clients && (
            <div style={{ marginBottom: 28 }}>
              <span style={S.label}>Aan</span>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                {quote.clients.company_name || quote.clients.name}
              </div>
              {quote.clients.contact_name && <div style={{ fontSize: 13, color: '#374151' }}>{quote.clients.contact_name}</div>}
              {quote.clients.address && <div style={{ fontSize: 13, color: '#6b7280' }}>{quote.clients.address}</div>}
              {quote.clients.city && <div style={{ fontSize: 13, color: '#6b7280' }}>{quote.clients.city}</div>}
              {quote.clients.phone && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{quote.clients.phone}</div>}
              {quote.clients.email && <div style={{ fontSize: 12, color: '#9ca3af' }}>{quote.clients.email}</div>}
            </div>
          )}

          {/* Title + description */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{quote.title}</div>
            {quote.description && (
              <div style={{ fontSize: 13, color: '#374151', marginTop: 6, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{quote.description}</div>
            )}
          </div>

          <hr style={S.divider} />

          {/* ── REGELS ── */}
          {quote.items && quote.items.length > 0 ? (
            <>
              <table style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #111827' }}>
                    <th style={{ padding: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Omschrijving</th>
                    <th style={{ padding: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', width: 56 }}>Aantal</th>
                    <th style={{ padding: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', width: 56 }}>Eenh.</th>
                    <th style={{ padding: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', width: 90 }}>Prijs</th>
                    <th style={{ padding: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', width: 90 }}>Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 0', fontSize: 13, color: '#111827' }}>{item.description}</td>
                      <td style={{ padding: '10px 0', fontSize: 13, color: '#374151', textAlign: 'right' }}>{Number(item.quantity)}</td>
                      <td style={{ padding: '10px 0', fontSize: 13, color: '#9ca3af' }}>{item.unit}</td>
                      <td style={{ padding: '10px 0', fontSize: 13, color: '#374151', textAlign: 'right' }}>{fmt(item.unit_price_cents)}</td>
                      <td style={{ padding: '10px 0', fontSize: 13, color: '#111827', fontWeight: 500, textAlign: 'right' }}>{fmt(item.total_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ padding: '12px 0', fontSize: 13, color: '#9ca3af' }}>Geen regels.</div>
          )}

          {/* ── TOTALEN ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '24px 0 28px' }}>
            <div style={{ width: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Subtotaal excl. BTW</span>
                <span style={{ color: '#374151' }}>{fmt(quote.amount_excl_vat)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>BTW ({quote.vat_pct}%)</span>
                <span style={{ color: '#374151' }}>{fmt(vatAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 15, fontWeight: 700, borderTop: `2px solid ${color}`, marginTop: 6, color }}>
                <span>Totaal incl. BTW</span>
                <span>{fmt(quote.amount_incl_vat)}</span>
              </div>
            </div>
          </div>

          {/* ── BETALINGSSTRUCTUUR ── */}
          {quote.advance_pct && quote.advance_pct > 0 && (
            <>
              <hr style={S.divider} />
              <div style={{ marginBottom: 28 }}>
                <span style={S.label}>Betalingsstructuur</span>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                  {quote.advance_pct > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 340 }}>
                      <span>Aanbetaling bij akkoord ({quote.advance_pct}%)</span>
                      <span style={{ fontWeight: 500 }}>{fmt((quote.amount_incl_vat * quote.advance_pct) / 100)}</span>
                    </div>
                  )}
                  {quote.milestone_pct && quote.milestone_pct > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 340 }}>
                      <span>Tussentijdse betaling ({quote.milestone_pct}%)</span>
                      <span style={{ fontWeight: 500 }}>{fmt((quote.amount_incl_vat * quote.milestone_pct) / 100)}</span>
                    </div>
                  )}
                  {quote.final_pct && quote.final_pct > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 340 }}>
                      <span>Eindafrekening ({quote.final_pct}%)</span>
                      <span style={{ fontWeight: 500 }}>{fmt((quote.amount_incl_vat * quote.final_pct) / 100)}</span>
                    </div>
                  )}
                </div>
                {quote.payment_note && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{quote.payment_note}</div>
                )}
              </div>
            </>
          )}

          {quote.notes && (
            <>
              <hr style={S.divider} />
              <div>
                <span style={S.label}>Opmerkingen</span>
                <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{quote.notes}</div>
              </div>
            </>
          )}

          {/* ── FOOTER ── */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.8 }}>
            {[
              tenant.name,
              tenant.kvk_number ? `KvK: ${tenant.kvk_number}` : null,
              tenant.vat_number ? `BTW: ${tenant.vat_number}` : null,
              tenant.iban ? `IBAN: ${tenant.iban}` : null,
              tenant.email,
              tenant.website,
            ].filter(Boolean).join('  ·  ')}
          </div>

        </div>
      </div>
    </>
  )
}
