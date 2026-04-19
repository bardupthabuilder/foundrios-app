export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg bg-foundri-card" />
        <div className="h-8 w-24 rounded-lg bg-foundri-card" />
      </div>
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-white/5 bg-foundri-deep p-4">
          <div className="h-3 w-3 rounded-full bg-foundri-card" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-foundri-card" />
            <div className="h-3 w-2/3 rounded bg-foundri-card" />
          </div>
          <div className="h-6 w-16 rounded-full bg-foundri-card" />
        </div>
      ))}
    </div>
  )
}
