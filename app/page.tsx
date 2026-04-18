import Link from 'next/link'
import Image from 'next/image'
import { Inbox, Bot, BarChart3, FolderOpen, Clock, FileText, Calendar, Users, Zap, ArrowRight, CheckCircle2, Shield, Gauge } from 'lucide-react'

const MODULES = [
  { icon: Inbox, title: 'Lead Inbox', desc: 'WhatsApp, formulieren en Meta Ads leads op een plek. Nooit meer een aanvraag missen.', color: 'text-foundri-yellow' },
  { icon: Bot, title: 'AI-kwalificatie', desc: 'Elke lead automatisch gescoord op budget, urgentie en intent. Hot, warm of cold — met uitleg.', color: 'text-foundri-blue' },
  { icon: FolderOpen, title: 'Projecten', desc: 'Van offerte tot oplevering. Budget, status en marge per project in een overzicht.', color: 'text-foundri-yellow' },
  { icon: Calendar, title: 'Planning', desc: 'Wie werkt waar en wanneer. Sleep medewerkers op projecten, zie direct de bezetting.', color: 'text-foundri-blue' },
  { icon: Clock, title: 'Urenregistratie', desc: 'Uren, kilometers en materiaal per project bijhouden. Nacalculatie in een klik.', color: 'text-foundri-yellow' },
  { icon: FileText, title: 'Offertes & Facturen', desc: 'Professionele offertes en facturen. Vanuit je projecten, zonder dubbel werk.', color: 'text-foundri-blue' },
  { icon: Users, title: 'Team', desc: 'Medewerkers beheren met rollen, uurtarieven en projecttoewijzingen.', color: 'text-foundri-yellow' },
  { icon: BarChart3, title: 'Dashboard', desc: 'Leads, conversie, uren en marge in realtime. Altijd weten hoe je bedrijf ervoor staat.', color: 'text-foundri-blue' },
  { icon: Zap, title: 'Content Engine', desc: 'AI genereert social media content voor jouw bedrijf. Per platform, in jouw toon.', color: 'text-foundri-yellow' },
]

const NICHES = ['Hoveniers', 'Dakdekkers', 'Installateurs', 'Badkamer & Keuken', 'Bouw & Verbouw', 'Schilders', 'Elektra']

const DIFFERENTIATORS = [
  { icon: Gauge, title: 'Gebouwd voor de praktijk', desc: 'Geen generiek CRM. Elk scherm is ontworpen voor hoe vakbedrijven echt werken — van werkbon tot nacalculatie.' },
  { icon: Bot, title: 'AI die meedenkt', desc: 'Leads worden automatisch gekwalificeerd. Content wordt gegenereerd in jouw toon. Het systeem wordt slimmer met elk gebruik.' },
  { icon: Shield, title: 'Alles in een systeem', desc: 'Geen 10 losse tools meer. Leads, projecten, uren, offertes en facturen — alles verbonden, alles overzichtelijk.' },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-foundri-graphite text-foundri-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-foundri-border bg-foundri-graphite/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="FoundriOS" width={28} height={28} />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              Foundri<span className="text-foundri-yellow">OS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-foundri-muted transition-colors hover:text-white"
            >
              Inloggen
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-4 py-2 text-sm font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_20px_rgba(246,201,69,0.3)]"
            >
              Gratis proberen
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-24 sm:py-32">
          {/* Subtle grid background */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(246,201,69,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(246,201,69,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-foundri-border bg-foundri-deep px-4 py-1.5 text-sm text-foundri-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-foundri-yellow" />
              14 dagen gratis — geen creditcard nodig
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Het complete bedrijfssysteem{' '}
              <span className="text-foundri-yellow">voor vakbedrijven</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foundri-muted sm:text-xl">
              Leads, projecten, planning, uren, offertes en facturen. Alles in een
              systeem dat gebouwd is voor hoe vakbedrijven echt werken.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-6 py-3 text-base font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_24px_rgba(246,201,69,0.35)]"
              >
                Start gratis trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-sm text-foundri-muted">Binnen 60 seconden operationeel</p>
            </div>
          </div>
        </section>

        {/* Niches */}
        <section className="border-y border-foundri-border bg-foundri-deep px-6 py-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
            <span className="mr-2 text-xs font-medium uppercase tracking-wider text-foundri-muted">Gebouwd voor</span>
            {NICHES.map((n) => (
              <span key={n} className="rounded-sm border border-foundri-border bg-foundri-card px-3 py-1 text-sm text-foundri-text">
                {n}
              </span>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
                Alles wat je nodig hebt
              </h2>
              <p className="mt-3 text-foundri-muted">
                Geen 10 losse tools meer. Een systeem dat samenwerkt.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((mod) => {
                const Icon = mod.icon
                return (
                  <div
                    key={mod.title}
                    className="group rounded-lg border border-foundri-border bg-foundri-card p-6 transition-colors hover:border-foundri-slate hover:bg-foundri-hover"
                  >
                    <Icon className={`mb-3 h-5 w-5 ${mod.color}`} />
                    <h3 className="font-[family-name:var(--font-display)] font-semibold text-white">
                      {mod.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foundri-muted">{mod.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-foundri-border bg-foundri-deep px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-foundri-yellow">60 sec</p>
              <p className="mt-2 text-sm text-foundri-muted">Onboarding — direct aan de slag</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-foundri-yellow">9+</p>
              <p className="mt-2 text-sm text-foundri-muted">Modules in een systeem</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-foundri-yellow">AI</p>
              <p className="mt-2 text-sm text-foundri-muted">Lead scoring & content generatie</p>
            </div>
          </div>
        </section>

        {/* Differentiators */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
                Waarom FoundriOS
              </h2>
              <p className="mt-3 text-foundri-muted">
                Gebouwd door mensen die vakbedrijven begrijpen.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {DIFFERENTIATORS.map((d) => {
                const Icon = d.icon
                return (
                  <div key={d.title} className="text-center sm:text-left">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-foundri-border bg-foundri-card sm:mx-0">
                      <Icon className="h-6 w-6 text-foundri-yellow" />
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                      {d.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foundri-muted">{d.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section className="border-t border-foundri-border bg-foundri-deep px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
              Herken je dit?
            </h2>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              {[
                'Leads die binnenkomen maar niet worden opgepakt',
                'Uren bijhouden op papier of in Excel',
                'Geen overzicht van welke projecten winst maken',
                'Offertes sturen vanuit 3 verschillende tools',
                'Geen idee hoeveel werk er volgende maand binnenkomt',
                'Medewerkers die niet weten waar ze morgen moeten zijn',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-foundri-border bg-foundri-card p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foundri-yellow" />
                  <span className="text-sm text-foundri-text">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-foundri-muted">
              FoundriOS lost dit op — in een systeem, vanaf dag 1.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden px-6 py-24 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,201,69,0.06),transparent_70%)]" />
          <div className="relative mx-auto max-w-xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white sm:text-4xl">
              Klaar om je bedrijf overzichtelijk te maken?
            </h2>
            <p className="mt-4 text-foundri-muted">
              14 dagen gratis. Geen creditcard. Binnen een minuut je dashboard klaar.
            </p>
            <Link
              href="/register"
              className="group mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-foundri-yellow to-foundri-yellow-dim px-6 py-3 text-base font-semibold text-foundri-graphite transition-all hover:shadow-[0_0_24px_rgba(246,201,69,0.35)]"
            >
              Start gratis trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-foundri-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="FoundriOS" width={20} height={20} />
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
              Foundri<span className="text-foundri-yellow">OS</span>
            </span>
          </div>
          <p className="text-sm text-foundri-muted">
            &copy; {new Date().getFullYear()} FoundriOS &middot; een product van Groeneveld Media
          </p>
        </div>
      </footer>
    </div>
  )
}
