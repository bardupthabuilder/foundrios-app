'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Clock, Zap, ChevronRight } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'backlog'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assigneeAgentId?: string
  createdAt: string
}

interface InboxData {
  tasks: Task[]
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  todo: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'To Do' },
  in_progress: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Done' },
  blocked: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Blocked' },
  backlog: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Backlog' },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'text-red-400', label: 'Critical' },
  high: { color: 'text-orange-400', label: 'High' },
  medium: { color: 'text-yellow-400', label: 'Medium' },
  low: { color: 'text-gray-400', label: 'Low' },
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PaperclipPage() {
  const [data, setData] = useState<InboxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInbox() {
      try {
        const res = await fetch('/api/paperclip/inbox', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }
        const json = await res.json()
        setData(json)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inbox')
      } finally {
        setLoading(false)
      }
    }

    fetchInbox()
    const interval = setInterval(fetchInbox, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-foundri-deep flex items-center justify-center">
        <div className="text-zinc-400">Loading tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-foundri-deep p-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-300">
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  const tasks = data?.tasks || []
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const blockedCount = tasks.filter(t => t.status === 'blocked').length

  return (
    <div className="min-h-screen bg-foundri-deep">
      {/* Header */}
      <div className="bg-black/40 border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-white mb-3">Paperclip Inbox</h1>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="rounded bg-white/5 p-2 text-center">
              <div className="text-amber-400 font-semibold">{todoCount}</div>
              <div className="text-zinc-400">To Do</div>
            </div>
            <div className="rounded bg-white/5 p-2 text-center">
              <div className="text-blue-400 font-semibold">{inProgressCount}</div>
              <div className="text-zinc-400">In Progress</div>
            </div>
            <div className="rounded bg-white/5 p-2 text-center">
              <div className="text-emerald-400 font-semibold">{doneCount}</div>
              <div className="text-zinc-400">Done</div>
            </div>
            <div className="rounded bg-white/5 p-2 text-center">
              <div className="text-red-400 font-semibold">{blockedCount}</div>
              <div className="text-zinc-400">Blocked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No tasks in inbox
          </div>
        ) : (
          tasks.map(task => {
            const config = statusConfig[task.status]
            const priority = priorityConfig[task.priority] || { color: 'text-gray-400', label: task.priority }
            const StatusIcon = config.icon

            return (
              <a
                key={task.id}
                href={`/paperclip/${task.id}`}
                className="block rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <StatusIcon className={`${config.color} w-5 h-5 mt-0.5 flex-shrink-0`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-blue-300">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <span>{config.label}</span>
                      <span>·</span>
                      <span className={priority.color}>{priority.label}</span>
                      <span>·</span>
                      <span>{formatTime(task.createdAt)}</span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                </div>
              </a>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 py-4 border-t border-white/5 text-xs text-zinc-500 text-center">
        Updates every 30 seconds
      </div>
    </div>
  )
}
