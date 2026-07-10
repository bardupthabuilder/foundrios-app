'use client'

import { useEffect } from 'react'

export function ViewLogger({ token }: { token: string }) {
  useEffect(() => {
    const key = `q-viewed-${token}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch(`/api/q/${token}/view`, { method: 'POST' }).catch(() => {})
  }, [token])
  return null
}
