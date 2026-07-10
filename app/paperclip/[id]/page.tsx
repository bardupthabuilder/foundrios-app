'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, AlertCircle } from 'lucide-react'

interface TaskDetail {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'backlog'
  priority: 'critical' | 'high' | 'medium' | 'low'
  description?: string
  assigneeAgentId?: string
  createdAt: string
  updatedAt: string
}

const statusOptions = ['todo', 'in_progress', 'blocked', 'done', 'backlog']

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/paperclip/issue/${taskId}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to load task: ${res.status}`)
        }
        const data = await res.json()
        setTask(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch task')
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId])

  async function handleStatusChange(newStatus: string) {
    if (!task) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/paperclip/issue/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: `Status changed to ${newStatus}`,
        }),
      })

      if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`)
      }

      const updated = await res.json()
      setTask(updated)
      setSuccessMessage('Status updated')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  async function handleCheckout() {
    if (!task) return

    setUpdating(true)
    try {
      const res = await fetch('/api/paperclip/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: taskId,
          agentId: 'user', // Simplified — in production, use actual agent ID
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || `Checkout failed: ${res.status}`)
      }

      const data = await res.json()
      setTask(prev => prev ? { ...prev, ...data } : null)
      setSuccessMessage('Task checked out')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout')
    } finally {
      setUpdating(false)
    }
  }

  async function handleAddComment() {
    if (!task || !newComment.trim()) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/paperclip/issue/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to add comment: ${res.status}`)
      }

      setNewComment('')
      setSuccessMessage('Comment added')
      setTimeout(() => setSuccessMessage(''), 2000)

      // Refetch task
      const refreshRes = await fetch(`/api/paperclip/issue/${taskId}`, { cache: 'no-store' })
      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        setTask(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-foundri-deep flex items-center justify-center">
        <div className="text-zinc-400">Loading task...</div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-foundri-deep p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 mb-4 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-300">
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-foundri-deep p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 mb-4 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-zinc-400">Task not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-foundri-deep">
      {/* Header */}
      <div className="bg-black/40 border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 mb-3 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-xl font-semibold text-white">{task.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Success Message */}
        {successMessage && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2 text-emerald-300 text-sm">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Info Card */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-zinc-500 mb-1">Status</div>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="w-full bg-white/10 border border-white/10 rounded px-2 py-1.5 text-white text-sm hover:border-white/20 disabled:opacity-50"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Priority</div>
              <div className="text-white font-medium capitalize">{task.priority}</div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-3">
            <div className="text-xs text-zinc-500">
              <div>Created: {new Date(task.createdAt).toLocaleString('nl-NL')}</div>
              <div>Updated: {new Date(task.updatedAt).toLocaleString('nl-NL')}</div>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        {task.status === 'todo' || task.status === 'backlog' ? (
          <button
            onClick={handleCheckout}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {updating ? 'Checking out...' : 'Checkout Task'}
          </button>
        ) : null}

        {/* Comment Form */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Comment</h3>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={updating}
            placeholder="Type a comment..."
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-zinc-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            rows={3}
          />
          <button
            onClick={handleAddComment}
            disabled={updating || !newComment.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {updating ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {/* Description */}
        {task.description && (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
