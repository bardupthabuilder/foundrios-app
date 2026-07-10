import Link from 'next/link'
import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  rowHref?: (row: T) => string
  emptyState?: ReactNode
}

export function DataTable<T>({ columns, rows, rowKey, rowHref, emptyState }: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-foundri-deep">
      {/* Desktop table */}
      <table className="hidden sm:table w-full">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 ${col.hideOnMobile ? 'hidden lg:table-cell' : ''} ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const href = rowHref?.(row)
            const cells = columns.map(col => (
              <td
                key={col.key}
                className={`px-4 py-3 text-sm text-zinc-300 ${col.hideOnMobile ? 'hidden lg:table-cell' : ''} ${col.className ?? ''}`}
              >
                {col.render(row)}
              </td>
            ))
            if (href) {
              return (
                <tr
                  key={rowKey(row)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                >
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-zinc-300 ${col.hideOnMobile ? 'hidden lg:table-cell' : ''} ${col.className ?? ''}`}
                    >
                      <Link href={href} className="block -mx-4 -my-3 px-4 py-3 text-zinc-300 group-hover:text-white">
                        {col.render(row)}
                      </Link>
                    </td>
                  ))}
                </tr>
              )
            }
            return (
              <tr key={rowKey(row)} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                {cells}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-white/5">
        {rows.map(row => {
          const href = rowHref?.(row)
          const content = (
            <div className="px-4 py-3 space-y-2">
              {columns.filter(c => !c.hideOnMobile).map(col => (
                <div key={col.key} className="flex items-baseline justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">{col.header}</span>
                  <span className="text-sm text-zinc-300 text-right">{col.render(row)}</span>
                </div>
              ))}
            </div>
          )
          if (href) {
            return (
              <Link key={rowKey(row)} href={href} className="block hover:bg-white/[0.02]">
                {content}
              </Link>
            )
          }
          return <div key={rowKey(row)}>{content}</div>
        })}
      </div>
    </div>
  )
}
