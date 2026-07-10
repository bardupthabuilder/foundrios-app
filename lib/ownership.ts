import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * De routes hier draaien tegen tabellen die (nog) niet in de gegenereerde types
 * staan en gebruiken daarom een losgekoppelde client. Eén keer benoemen is
 * duidelijker dan `any` op elke plek herhalen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

/**
 * Regelitems (quote_items, invoice_items, work_order_hours, work_order_materials)
 * hebben zelf geen tenant_id — ze horen bij hun parent. Zonder expliciete check
 * kon een ingelogde gebruiker een regel van een andere tenant aanpassen of
 * verwijderen door alleen het UUID te raden.
 *
 * RLS in migratie 022b dekt dit af op databaseniveau; deze helpers geven daarnaast
 * een nette 404 in plaats van een stille no-op, en beschermen ook wanneer een route
 * ooit met de service-role client zou draaien (die RLS omzeilt).
 */

type ParentTable = 'quotes' | 'invoices' | 'work_orders'

/** Controleert of een parent-record (offerte/factuur/werkbon) bij deze tenant hoort. */
export async function tenantOwnsParent(
  supabase: AnySupabaseClient,
  table: ParentTable,
  parentId: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('id', parentId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  return Boolean(data)
}

/**
 * Zoekt de parent van een regelitem op en controleert of die bij deze tenant hoort.
 * Geeft het parent-id terug (handig om daarna totalen te herberekenen), of null.
 */
export async function parentIdIfOwned(
  supabase: AnySupabaseClient,
  childTable: 'quote_items' | 'invoice_items' | 'work_order_hours' | 'work_order_materials' | 'work_order_photos',
  childId: string,
  tenantId: string
): Promise<string | null> {
  const parentColumn = {
    quote_items: 'quote_id',
    invoice_items: 'invoice_id',
    work_order_hours: 'work_order_id',
    work_order_materials: 'work_order_id',
    work_order_photos: 'work_order_id',
  }[childTable]

  const parentTable: ParentTable = {
    quote_items: 'quotes' as const,
    invoice_items: 'invoices' as const,
    work_order_hours: 'work_orders' as const,
    work_order_materials: 'work_orders' as const,
    work_order_photos: 'work_orders' as const,
  }[childTable]

  const { data: child } = await supabase
    .from(childTable)
    .select(parentColumn)
    .eq('id', childId)
    .maybeSingle()

  const parentId = (child as Record<string, string> | null)?.[parentColumn]
  if (!parentId) return null

  const owned = await tenantOwnsParent(supabase, parentTable, parentId, tenantId)
  return owned ? parentId : null
}
