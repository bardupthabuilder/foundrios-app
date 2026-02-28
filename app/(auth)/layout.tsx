export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900" />
          <span className="text-xl font-semibold tracking-tight">FoundriOS</span>
        </div>
        {children}
      </div>
    </div>
  )
}
