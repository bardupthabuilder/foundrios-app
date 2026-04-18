'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'

type Notification = {
  id: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotifications(data))
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const displayed = notifications.slice(0, 5)

  async function markAllRead() {
    const res = await fetch('/api/notifications', { method: 'PATCH' })
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
        title="Notificaties"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-foundri-deep shadow-2xl">
          <div className="border-b border-white/5 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notificaties</span>
          </div>

          {displayed.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Geen notificaties
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {displayed.map((n) => {
                const inner = (
                  <div
                    key={n.id}
                    className={`border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5 ${
                      !n.is_read ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foundri-yellow" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        {n.message && (
                          <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{n.message}</p>
                        )}
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: nl,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )

                if (n.link) {
                  return (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {inner}
                    </Link>
                  )
                }
                return <div key={n.id}>{inner}</div>
              })}
            </div>
          )}

          {unreadCount > 0 && (
            <div className="border-t border-white/5 px-4 py-2">
              <button
                onClick={markAllRead}
                className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-foundri-yellow transition-colors hover:bg-white/5"
              >
                Alles gelezen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
