/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Herberekent het factuurtotaal uit de regels.
 *
 * Facturen hadden wél een `invoice_items`-tabel maar geen enkele route die hem
 * vulde of bijwerkte. De werkbon-naar-factuur knop zette één bedrag zonder
 * regels, waardoor de factuur-PDF een lege tabel toonde.
 */
export async function recalcInvoiceTotal(supabase: any, invoiceId: string): Promise<void> {
  const { data: items } = await supabase
    .from('invoice_items')
    .select('total_cents')
    .eq('invoice_id', invoiceId)

  const totalExcl = (items ?? []).reduce((sum: number, i: any) => sum + (i.total_cents ?? 0), 0)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('vat_pct')
    .eq('id', invoiceId)
    .single()

  const vatPct = invoice?.vat_pct ?? 21
  const totalIncl = Math.round(totalExcl * (1 + vatPct / 100))

  await supabase
    .from('invoices')
    .update({ amount_excl_vat: totalExcl, amount_incl_vat: totalIncl })
    .eq('id', invoiceId)
}
