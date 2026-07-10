/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Hoeveel van het budget is er al opgegaan?
 *
 * De projectlijst rekende marge uit met het *verkooptarief* als kostprijs en
 * negeerde materiaal. Dat maakt elke klus winstgevend op papier. Hier gebruiken
 * we dezelfde logica als de nacalculatie: loonkosten per medewerker plus
 * materiaal. Valt het uurloon van een medewerker niet te bepalen, dan vallen we
 * terug op het projecttarief — beter een benadering dan geen signaal.
 */

export type BurnStatus = 'ok' | 'krap' | 'over'

export type ProjectBurn = {
  hours: number
  laborCents: number
  materialCents: number
  spentCents: number
  budgetCents: number | null
  /** Aandeel van het budget dat op is. null als er geen budget is. */
  ratio: number | null
  status: BurnStatus
}

export function calculateBurn(project: any): ProjectBurn {
  const timeEntries = (project.time_entries ?? []) as {
    hours: number | null
    employees?: { hourly_cost_cents: number | null } | null
  }[]

  const materialEntries = (project.material_entries ?? []) as { total_cents: number | null }[]

  const fallbackRate = project.hourly_rate_cents ?? 0

  let hours = 0
  let laborCents = 0
  for (const entry of timeEntries) {
    const h = entry.hours ?? 0
    hours += h
    laborCents += h * (entry.employees?.hourly_cost_cents ?? fallbackRate)
  }

  const materialCents = materialEntries.reduce((sum, m) => sum + (m.total_cents ?? 0), 0)
  const spentCents = Math.round(laborCents + materialCents)
  const budgetCents = project.budget_cents ?? null

  const ratio = budgetCents && budgetCents > 0 ? spentCents / budgetCents : null

  // 80% is het moment waarop je nog kunt bijsturen. Daarboven is het schade beperken.
  const status: BurnStatus =
    ratio === null ? 'ok' : ratio >= 1 ? 'over' : ratio >= 0.8 ? 'krap' : 'ok'

  return { hours, laborCents, materialCents, spentCents, budgetCents, ratio, status }
}
