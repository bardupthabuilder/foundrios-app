import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foundri Workforce — AI Agents voor Vakbedrijven',
  description: '5 AI-agents die leads opvangen, kwalificeren en inplannen. Meer afspraken. Minder gedoe.',
}

const problems = [
  {
    icon: '\u{1F4F1}',
    title: 'Gemiste aanvragen',
    description: 'WhatsApp, e-mail, formulier, Instagram DM — alles staat verspreid. Aanvragen vallen tussen wal en schip.',
  },
  {
    icon: '\u23F0',
    title: 'Te laat opvolgen',
    description: 'Na 5 minuten daalt je kans op een afspraak met 8x. De meeste vakbedrijven reageren pas na uren.',
  },
  {
    icon: '\u{1F507}',
    title: 'Geen opvolging',
    description: '40% van leads hoort nooit meer iets na het eerste contact. Dat zijn afspraken die je laat liggen.',
  },
]

const agents = [
  { number: '01', name: 'Lead Intake', description: 'Vangt elke aanvraag op. WhatsApp, formulier, DM — alles op één plek. Nooit meer iets missen.' },
  { number: '02', name: 'Qualification', description: 'Filtert de serieuze leads. Checkt regio, dienst, budget en urgentie. Jij ziet alleen koopklare leads.' },
  { number: '03', name: 'Conversation', description: 'Stelt de juiste vragen. Haalt ontbrekende info op en bouwt vertrouwen — zonder dat jij belt.' },
  { number: '04', name: 'Booking', description: 'Plant afspraken in je agenda. Voorstel, bevestiging en reminders. De afspraak staat er gewoon.' },
  { number: '05', name: 'Reactivation', description: 'Activeert oude leads opnieuw. Zonder nieuwe ads. Extra afspraken uit je bestaande database.' },
]

const faqs = [
  { q: 'Wat kost Foundri Workforce?', a: 'Pricing wordt bepaald na de early access fase. Verwachting: €299-499/mnd. Early access is volledig gratis.' },
  { q: 'Moet ik technisch zijn?', a: 'Nee. Alles werkt automatisch. Je hoeft alleen je kanalen te verbinden en je bedrijfsinformatie in te vullen.' },
  { q: 'Welke kanalen worden ondersteund?', a: 'WhatsApp, contactformulieren, DMs en e-mail. Meer kanalen volgen na de early access fase.' },
  { q: 'Kan ik berichten aanpassen?', a: 'Ja. Je kunt elk bericht bekijken, aanpassen en het gesprek volledig overnemen. Jij houdt altijd de controle.' },
  { q: 'Hoe snel ben ik live?', a: 'Binnen één dag. Wij zetten alles voor je klaar. Jij vult alleen je bedrijfsinformatie in.' },
  { q: 'Werkt het voor mijn type bedrijf?', a: 'Als je een vakbedrijf bent dat werkt met aanvragen en afspraken: ja. Hoveniers, dakdekkers, installateurs, bouw- en renovatiebedrijven.' },
  { q: 'Wat als het niet werkt?', a: 'Dan stop je. Geen langlopend contract. Geen verplichtingen. Geen risico.' },
]

export default function WorkforceLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-lg font-bold tracking-tight">
            Foundri<span className="text-indigo-500">.</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/workforce/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Inloggen
            </Link>
            <Link
              href="/workforce/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Gratis starten
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 mb-8">
                Early access — beperkt aantal plekken
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl max-w-4xl leading-[1.1]">
                Jouw digitale workforce.{' '}
                <span className="text-indigo-400">Meer afspraken.</span>{' '}
                Minder gedoe.
              </h1>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed sm:text-xl">
                5 AI-agents die leads opvangen, kwalificeren en inplannen.
                Jij doet alleen nog het verkoopgesprek.
              </p>
              <div className="mt-10">
                <Link
                  href="/workforce/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Gratis starten
                </Link>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Gratis early access. Geen creditcard nodig.
              </p>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-400 mb-4">Het probleem</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl max-w-3xl">
              Elke dag lopen er leads weg. <span className="text-zinc-500">En jij merkt het niet eens.</span>
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
              {problems.map((p) => (
                <div key={p.title} className="rounded-xl border border-white/[0.06] bg-[#111] p-6 hover:border-white/[0.12] transition-colors">
                  <span className="text-3xl">{p.icon}</span>
                  <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-zinc-400 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution — 5 Agents */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-400 mb-4">De oplossing</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              5 agents. Eén team. <span className="text-zinc-500">Nul gedoe.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
              Elk agent heeft één taak en doet die 24/7. Samen vormen ze je digitale salesteam.
            </p>
            <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {agents.map((agent, i) => (
                <div
                  key={agent.name}
                  className="group relative rounded-xl border border-white/[0.06] bg-[#111] p-5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all"
                >
                  {i < agents.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-px bg-white/[0.12] z-10" />
                  )}
                  <span className="text-xs font-mono text-indigo-400/60">{agent.number}</span>
                  <h3 className="mt-2 text-base font-semibold">{agent.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{agent.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-400 mb-4">FAQ</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Veelgestelde vragen</h2>
            <div className="mt-12 divide-y divide-white/[0.06]">
              {faqs.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex items-center justify-between text-lg font-medium hover:text-indigo-400 transition-colors cursor-pointer">
                    {faq.q}
                    <span className="ml-4 text-zinc-500 group-open:rotate-45 transition-transform text-xl">+</span>
                  </summary>
                  <p className="mt-3 text-zinc-400 leading-relaxed pr-8">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Klaar om leads te stoppen met verliezen?
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Start gratis. Geen creditcard. Geen verplichtingen.
            </p>
            <div className="mt-8">
              <Link
                href="/workforce/register"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Gratis starten
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold tracking-tight">
            Foundri<span className="text-indigo-500">.</span>
          </span>
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Foundri Workforce
          </p>
        </div>
      </footer>
    </div>
  )
}
