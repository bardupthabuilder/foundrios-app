import { createMollieClient } from '@mollie/api-client'

export const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY!,
})

export const PLANS = {
  starter: {
    id: 'starter',
    name: 'FoundriOS Starter',
    amount: { value: '297.00', currency: 'EUR' },
    interval: '1 month',
    description: 'FoundriOS Starter — maandelijks',
  },
} as const

export type PlanId = keyof typeof PLANS
