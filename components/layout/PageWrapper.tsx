interface PageWrapperProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  wide?: boolean
}

export function PageWrapper({ title, subtitle, action, children, wide }: PageWrapperProps) {
  return (
    <div className={`p-4 pt-16 sm:p-6 lg:pt-6 mx-auto space-y-6 ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}
