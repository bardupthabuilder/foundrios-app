import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
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

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center rounded-full border bg-zinc-50 px-3 py-1 text-sm text-zinc-600">
          Early Access — eerste 14 dagen gratis
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-zinc-900">
          Het AI Operating System voor vakbedrijven
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-zinc-500">
          Geen leads meer missen. Geen handmatig bijhouden meer. FoundriOS centraliseert
          al je leadkanalen, kwalificeert automatisch met AI, en geeft je realtime inzicht
          in je pipeline.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-base">
              Start gratis — 14 dagen trial
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
          <div className="rounded-xl border p-6">
            <div className="mb-3 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-blue-600 text-lg">📥</span>
            </div>
            <h3 className="font-semibold text-zinc-900">Lead Inbox</h3>
            <p className="mt-2 text-sm text-zinc-500">
              WhatsApp, formulieren en Meta leads op één plek. Nooit meer een aanvraag missen.
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <div className="mb-3 h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-green-600 text-lg">🤖</span>
            </div>
            <h3 className="font-semibold text-zinc-900">AI-kwalificatie</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Claude analyseert elke lead direct: hot, warm of cold — met uitleg over budget en urgentie.
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <div className="mb-3 h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <span className="text-purple-600 text-lg">📊</span>
            </div>
            <h3 className="font-semibold text-zinc-900">Realtime dashboard</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Leads, conversie en responstijd in één overzicht. Altijd weten hoe je pipeline ervoor staat.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-zinc-400">
        © {new Date().getFullYear()} FoundriOS · een product van Groeneveld Media
      </footer>
    </div>
  )
}
