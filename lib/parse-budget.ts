/**
 * `leads.budget_estimate` is vrije tekst die de AI invult: "± €12.000",
 * "€8.500,-", "tussen 10.000 en 15.000". Er is geen numeriek budgetveld.
 *
 * Om de pipeline in euro's te tonen halen we het eerste bedrag eruit. Wat niet
 * te lezen is telt niet mee — liever een eerlijk "3 van de 5 met budget" dan een
 * verzonnen totaal.
 */

/** Geeft het bedrag in centen, of null als er niets bruikbaars in staat. */
export function parseBudgetCents(text: string | null | undefined): number | null {
  if (!text) return null

  // Nederlandse notatie: punt is duizendtal, komma is decimaal.
  const match = text.match(/(\d[\d.\s]*?)(?:,(\d{1,2}))?(?!\d)/)
  if (!match) return null

  const whole = match[1].replace(/[.\s]/g, '')
  if (!whole) return null

  const euros = Number(whole)
  const cents = match[2] ? Number(match[2].padEnd(2, '0')) : 0
  if (!Number.isFinite(euros)) return null

  // Een vakbedrijf offreert geen tientallen miljoenen; zulke waardes zijn parse-fouten.
  const total = euros * 100 + cents
  if (total <= 0 || total > 10_000_000_00) return null

  return total
}

export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
