import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'FoundriOS <noreply@foundrios.app>'

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Skipped (no RESEND_API_KEY):', { to, subject })
    return { success: false, reason: 'no_api_key' }
  }

  try {
    const resend = getResend()
    if (!resend) return { success: false, reason: 'no_api_key' }
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, reason: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Error:', err)
    return { success: false, reason: String(err) }
  }
}

// Pre-built email templates
export function leadFollowUpEmail(leadName: string, companyName: string) {
  return {
    subject: `Nieuwe aanvraag van ${leadName}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F1115; font-size: 18px; margin-bottom: 16px;">Nieuwe lead: ${leadName}</h2>
        <p style="color: #71717A; font-size: 14px; line-height: 1.6;">
          Er is een nieuwe aanvraag binnengekomen bij ${companyName}.
          Log in op FoundriOS om de lead te bekijken en op te volgen.
        </p>
        <a href="https://foundrios-app.vercel.app/dashboard/leads"
           style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #F6C945; color: #0F1115; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Bekijk in FoundriOS
        </a>
        <p style="color: #A1A1AA; font-size: 12px; margin-top: 24px;">
          — FoundriOS
        </p>
      </div>
    `,
  }
}

export function quoteReminderEmail(clientName: string, quoteName: string, daysOpen: number) {
  return {
    subject: `Herinnering: offerte voor ${clientName} staat ${daysOpen} dagen open`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F1115; font-size: 18px; margin-bottom: 16px;">Offerte opvolging</h2>
        <p style="color: #71717A; font-size: 14px; line-height: 1.6;">
          De offerte <strong>"${quoteName}"</strong> voor ${clientName} staat al ${daysOpen} dagen open
          zonder reactie. Overweeg om op te volgen.
        </p>
        <a href="https://foundrios-app.vercel.app/dashboard/offertes"
           style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #F6C945; color: #0F1115; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Bekijk offertes
        </a>
        <p style="color: #A1A1AA; font-size: 12px; margin-top: 24px;">
          — FoundriOS
        </p>
      </div>
    `,
  }
}

export function invoiceOverdueEmail(clientName: string, amount: string, daysOverdue: number) {
  return {
    subject: `Factuur verlopen: ${clientName} — ${amount}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0F1115; font-size: 18px; margin-bottom: 16px;">Factuur verlopen</h2>
        <p style="color: #71717A; font-size: 14px; line-height: 1.6;">
          De factuur voor <strong>${clientName}</strong> ter waarde van <strong>${amount}</strong> is ${daysOverdue} dagen
          over de vervaldatum. Stuur een herinnering of neem contact op.
        </p>
        <a href="https://foundrios-app.vercel.app/dashboard/facturen"
           style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #F6C945; color: #0F1115; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Bekijk facturen
        </a>
        <p style="color: #A1A1AA; font-size: 12px; margin-top: 24px;">
          — FoundriOS
        </p>
      </div>
    `,
  }
}
