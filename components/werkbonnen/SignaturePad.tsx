'use client'

import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

/**
 * Handtekening met de vinger of muis.
 *
 * De werkbon liet de klant alleen zijn naam intypen. Een getypte naam is geen
 * bewijs — juist bij discussie over meerwerk is dat precies wat je nodig hebt.
 * De tekening gaat als PNG data-URL mee naar `work_orders.signature_data`.
 */
export function SignaturePad({
  onChange,
  disabled = false,
}: {
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Op een retina-scherm wordt een 1x canvas een wazige veeg.
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#ffffff'
  }, [])

  function pointFrom(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pointFrom(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawing.current = true
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || disabled) return
    // Scrollen op mobiel terwijl je tekent zou de handtekening verpesten.
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pointFrom(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasInk) setHasInk(true)
  }

  function end() {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas && hasInk) onChange(canvas.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange(null)
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-foundri-surface">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-40 w-full touch-none"
          style={{ touchAction: 'none' }}
        />
        {!hasInk && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-600">
            Laat de klant hier tekenen
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={!hasInk || disabled}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-40"
      >
        <Eraser className="h-3.5 w-3.5" /> Wissen
      </button>
    </div>
  )
}
