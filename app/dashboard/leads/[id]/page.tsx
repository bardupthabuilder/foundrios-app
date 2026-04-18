import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { LeadScoreBadge } from '@/components/leads/LeadScoreBadge'
import { LeadSourceIcon } from '@/components/leads/LeadSourceIcon'
import { LeadStatusSelect } from '@/components/leads/LeadStatusSelect'
import { ConvertToClient } from '@/components/leads/ConvertToClient'
import { ProcessChecklist } from '@/components/leads/ProcessChecklist'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ChevronLeft, Phone, MessageCircle, Mail, FileText } from 'lucide-react'
import { ReplyBox } from '@/components/leads/ReplyBox'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { tenantId } = await requireTenant()

  const [leadResult, messagesResult, eventsResult] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('lead_messages')
      .select('*')
      .eq('lead_id', id)
      .eq('tenant_id', tenantId)
      .order('sent_at', { ascending: true }),
    supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
  ])

  const lead = leadResult.data
  if (!lead) notFound()

  const messages = messagesResult.data ?? []
  const events = eventsResult.data ?? []

  const urgencyLabels = { low: 'Laag', medium: 'Middel', high: 'Hoog' }

  return (
    <div className="flex h-full">
      {/* Main — Thread */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-4 border-b bg-foundri-deep px-6 py-4">
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Terug
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-semibold text-white">{lead.name}</h1>
          <LeadSourceIcon source={lead.source as Parameters<typeof LeadSourceIcon>[0]['source']} showLabel />
          {/* Quick actions */}
          <div className="ml-auto flex items-center gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white" title="Bellen">
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white" title="WhatsApp">
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white" title="E-mail">
                <Mail className="h-3.5 w-3.5" />
              </a>
            )}
            <Link href={`/dashboard/offertes?lead=${lead.id}`} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white" title="Offerte maken">
              <FileText className="h-3.5 w-3.5" />
              Offerte
            </Link>
            <div className="mx-1 h-5 w-px bg-white/10" />
            <LeadScoreBadge label={lead.ai_label as Parameters<typeof LeadScoreBadge>[0]['label']} score={lead.ai_score} />
            <LeadStatusSelect leadId={lead.id} currentStatus={lead.status as Parameters<typeof LeadStatusSelect>[0]['currentStatus']} />
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">Nog geen berichten</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.direction === 'inbound'
                      ? 'bg-foundri-card text-zinc-100'
                      : msg.channel === 'system'
                      ? 'bg-blue-500/10 text-blue-400 text-xs italic'
                      : 'bg-zinc-900 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="mt-1 text-xs opacity-60">
                    {format(new Date(msg.sent_at), 'd MMM HH:mm', { locale: nl })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply box */}
        <ReplyBox leadId={lead.id} />
      </div>

      {/* Sidebar — Lead info */}
      <aside className="w-80 flex-shrink-0 overflow-y-auto border-l bg-foundri-deep">
        <div className="p-5 space-y-5">
          {/* AI Samenvatting */}
          {lead.ai_summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Samenvatting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300">{lead.ai_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Kwalificatie */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Kwalificatie
            </h3>
            <div className="space-y-2">
              {lead.urgency && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Urgentie</span>
                  <Badge variant="outline" className={
                    lead.urgency === 'high' ? 'border-red-500/30 text-red-400' :
                    lead.urgency === 'medium' ? 'border-orange-500/30 text-orange-400' :
                    'border-white/10 text-zinc-400'
                  }>
                    {urgencyLabels[lead.urgency as keyof typeof urgencyLabels]}
                  </Badge>
                </div>
              )}
              {lead.budget_estimate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Budget</span>
                  <span className="font-medium text-zinc-200">{lead.budget_estimate}</span>
                </div>
              )}
              {lead.intent && (
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-400">Intent</span>
                  <span className="text-zinc-200">{lead.intent}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Conversieproces */}
          <ProcessChecklist
            leadId={lead.id}
            qualifiedAt={lead.qualified_at}
            appointmentAt={lead.appointment_at}
            quoteSentAt={lead.quote_sent_at}
            followedUpAt={lead.followed_up_at}
          />

          <Separator />

          {/* Contactgegevens */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Contact
            </h3>
            <div className="space-y-2 text-sm">
              {lead.email && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">E-mail</span>
                  <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline truncate ml-2">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Telefoon</span>
                  <a href={`tel:${lead.phone}`} className="text-zinc-200 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Binnengehaald</span>
                <span className="text-zinc-200">
                  {format(new Date(lead.created_at), 'd MMM yyyy', { locale: nl })}
                </span>
              </div>
            </div>
          </div>

          {/* Conversie naar klant */}
          <ConvertToClient
            leadId={lead.id}
            leadName={lead.name}
            leadPhone={lead.phone}
            leadEmail={lead.email}
          />

          <Separator />

          {/* Audit trail */}
          {events.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Activiteit
              </h3>
              <div className="space-y-2">
                {events.slice(0, 5).map((event) => {
                  const payload = event.payload as { from?: string; to?: string; score?: number; label?: string } | null
                  return (
                    <div key={event.id} className="text-xs text-zinc-400">
                      <span className="font-medium text-zinc-200">
                        {event.event_type === 'status_changed' &&
                          `Status: ${payload?.from} → ${payload?.to}`}
                        {event.event_type === 'ai_scored' &&
                          `AI gescoord: ${payload?.label} (${payload?.score})`}
                      </span>
                      <span className="ml-2">
                        {format(new Date(event.created_at), 'd MMM HH:mm', { locale: nl })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
