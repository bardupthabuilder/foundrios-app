import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Inbox, Bot, BarChart3, FolderOpen, Clock, FileText, Calendar, Users, Zap } from 'lucide-react'

const MODULES = [
  { icon: Inbox, title: 'Lead Inbox', desc: 'WhatsApp, formulieren en Meta Ads leads op een plek. Nooit meer een aanvraag missen.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Bot, title: 'AI-kwalificatie', desc: 'Elke lead automatisch gescoord op budget, urgentie en intent. Hot, warm of cold — met uitleg.', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: FolderOpen, title: 'Projecten', desc: 'Van offerte tot oplevering. Budget, status en marge per project in een overzicht.', color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: Calendar, title: 'Planning', desc: 'Wie werkt waar en wanneer. Sleep medewerkers op projecten, zie direct de bezetting.', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Clock, title: 'Urenregistratie', desc: 'Uren, kilometers en materiaal per project bijhouden. Nacalculatie in een klik.', color: 'text-red-600', bg: 'bg-red-50' },
  { icon: FileText, title: 'Offertes & Facturen', desc: 'Professionele offertes en facturen. Vanuit je projecten, zonder dubbel werk.', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { icon: Users, title: 'Team', desc: 'Medewerkers beheren met rollen, uurtarieven en projecttoewijzingen.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: BarChart3, title: 'Dashboard', desc: 'Leads, conversie, uren en marge in realtime. Altijd weten hoe je bedrijf ervoor staat.', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Zap, title: 'Content Engine', desc: 'AI genereert social media content voor jouw bedrijf. Per platform, in jouw toon.', color: 'text-yellow-600', bg: 'bg-yellow-50' },
]

const NICHES = ['Hoveniers', 'Dakdekkers', 'Installateurs', 'Badkamer & Keuken', 'Bouw & Verbouw', 'Schilders', 'Elektra']

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900" />
          <span className="text-lg font-semibold tracking-tight">FoundriOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Inloggen</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Gratis proberen</Button>
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="flex flex-col items-center px-6 py-20 text-center sm:py-28">
          <div className="mb-4 inline-flex items-center rounded-full border bg-zinc-50 px-3 py-1 text-sm text-zinc-600">
            14 dagen gratis — geen creditcard nodig
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Het complete bedrijfssysteem voor vakbedrijven
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-500 sm:text-xl">
            Leads, projecten, planning, uren, offertes en facturen. Alles in een systeem
            dat gebouwd is voor hoe vakbedrijven echt werken.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="text-base">
                Start gratis trial
              </Button>
            </Link>
            <p className="text-sm text-zinc-400">Binnen 60 seconden operationeel</p>
          </div>
        </section>

        {/* Niches */}
        <section className="border-y bg-zinc-50 px-6 py-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-zinc-400 mr-2">Gebouwd voor:</span>
            {NICHES.map((n) => (
              <span key={n} className="rounded-full border bg-white px-3 py-1 text-sm text-zinc-700">
                {n}
              </span>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-zinc-900">Alles wat je nodig hebt</h2>
              <p className="mt-3 text-zinc-500">
                Geen 10 losse tools meer. Een systeem dat samenwerkt.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((mod) => {
                const Icon = mod.icon
                return (
                  <div key={mod.title} className="rounded-xl border p-6">
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${mod.bg}`}>
                      <Icon className={`h-5 w-5 ${mod.color}`} />
                    </div>
                    <h3 className="font-semibold text-zinc-900">{mod.title}</h3>
                    <p className="mt-2 text-sm text-zinc-500">{mod.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Social proof / stats */}
        <section className="border-y bg-zinc-50 px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-4xl font-bold text-zinc-900">60 sec</p>
              <p className="mt-1 text-sm text-zinc-500">Onboarding — direct aan de slag</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-zinc-900">12+</p>
              <p className="mt-1 text-sm text-zinc-500">Modules in een systeem</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-zinc-900">AI</p>
              <p className="mt-1 text-sm text-zinc-500">Lead scoring + content generatie</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center px-6 py-20 text-center">
          <h2 className="max-w-xl text-3xl font-bold text-zinc-900">
            Klaar om je bedrijf overzichtelijk te maken?
          </h2>
          <p className="mt-4 text-zinc-500">
            14 dagen gratis. Geen creditcard. Binnen een minuut je dashboard klaar.
          </p>
          <Link href="/register" className="mt-8">
            <Button size="lg" className="text-base">
              Start gratis trial
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-zinc-400">
        &copy; {new Date().getFullYear()} FoundriOS &middot; een product van Groeneveld Media
      </footer>
    </div>
  )
}
