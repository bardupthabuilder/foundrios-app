import Link from 'next/link'

const PROCESSES = [
  {
    title: 'Acquisitie',
    desc: 'Van onbekende naar aanvraag',
    color: 'text-blue-400',
    borderColor: 'border-blue-400/20',
    dotColor: 'bg-blue-400',
    steps: [
      { label: 'Lead binnenkomst', desc: 'Via formulier, WhatsApp, Meta Ads of handmatig', link: '/dashboard/leads' },
      { label: 'Eerste reactie', desc: 'Binnen 5 minuten reageren — snelheid wint', link: '/dashboard/leads' },
      { label: 'Kwalificatie', desc: 'Budget, urgentie en fit beoordelen', link: '/dashboard/pipeline' },
    ],
  },
  {
    title: 'Conversie',
    desc: 'Van aanvraag naar betalende klant',
    color: 'text-foundri-yellow',
    borderColor: 'border-foundri-yellow/20',
    dotColor: 'bg-foundri-yellow',
    steps: [
      { label: 'Afspraak plannen', desc: 'Intake of adviesgesprek inplannen', link: '/dashboard/pipeline' },
      { label: 'Offerte versturen', desc: 'Binnen 24 uur na afspraak', link: '/dashboard/offertes' },
      { label: 'Opvolging', desc: 'Na 3 dagen opvolgen, na 5 dagen bellen', link: '/dashboard/offertes' },
      { label: 'Deal sluiten', desc: 'Akkoord → klant aanmaken → project starten', link: '/dashboard/klanten' },
    ],
  },
  {
    title: 'Uitvoering',
    desc: 'Van opdracht naar oplevering',
    color: 'text-green-400',
    borderColor: 'border-green-400/20',
    dotColor: 'bg-green-400',
    steps: [
      { label: 'Project aanmaken', desc: 'Planning, team en budget vastleggen', link: '/dashboard/projecten' },
      { label: 'Werkbon opstellen', desc: 'Taken en materialen per dag', link: '/dashboard/werkbonnen' },
      { label: 'Uren registreren', desc: 'Dagelijks bijhouden per medewerker', link: '/dashboard/uren' },
      { label: 'Oplevering', desc: 'Controleren, fotograferen, klant informeren', link: '/dashboard/projecten' },
    ],
  },
  {
    title: 'Retentie',
    desc: 'Van eenmalig naar terugkerend',
    color: 'text-purple-400',
    borderColor: 'border-purple-400/20',
    dotColor: 'bg-purple-400',
    steps: [
      { label: 'Review vragen', desc: 'Binnen 7 dagen na oplevering', link: '/dashboard/projecten' },
      { label: 'Onderhoud aanbieden', desc: 'Terugkerend contract voorstellen', link: '/dashboard/onderhoud' },
      { label: 'Upsell identificeren', desc: 'Extra werk signaleren bij bestaande klant', link: '/dashboard/projecten' },
      { label: 'Referral activeren', desc: 'Tevreden klant = nieuwe lead', link: '/dashboard/campagnes' },
    ],
  },
  {
    title: 'Financieel',
    desc: 'Controle op geld en marges',
    color: 'text-orange-400',
    borderColor: 'border-orange-400/20',
    dotColor: 'bg-orange-400',
    steps: [
      { label: 'Factureren', desc: 'Direct na oplevering of volgens afspraak', link: '/dashboard/facturen' },
      { label: 'Betaling opvolgen', desc: 'Na vervaldatum herinnering sturen', link: '/dashboard/facturen' },
      { label: 'Marge checken', desc: 'Nacalculatie per project', link: '/dashboard/projecten' },
    ],
  },
]

export default function ProcessenPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Processen</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Zo draait een vakbedrijf — stap voor stap.
        </p>
      </div>

      {/* Process Cards */}
      <div className="space-y-6">
        {PROCESSES.map((process) => (
          <div
            key={process.title}
            className={`rounded-xl border border-white/5 bg-[#1A1F29] p-6`}
          >
            <div className="mb-5">
              <h2 className={`text-lg font-bold ${process.color}`}>{process.title}</h2>
              <p className="mt-0.5 text-sm text-zinc-400">{process.desc}</p>
            </div>

            <div className="relative ml-3 space-y-0">
              {process.steps.map((step, i) => (
                <div key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Vertical line */}
                  {i < process.steps.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/10" />
                  )}

                  {/* Numbered circle */}
                  <div
                    className={`relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${process.dotColor} mt-0.5`}
                  >
                    <span className="text-[9px] font-bold text-[#0F1115]">{i + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={step.link}
                      className="group inline-flex items-center gap-1.5"
                    >
                      <span className="text-sm font-semibold text-white group-hover:text-foundri-yellow transition-colors">
                        {step.label}
                      </span>
                      <span className="text-xs text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
                        &rarr;
                      </span>
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
