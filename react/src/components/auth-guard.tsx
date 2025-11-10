"use client"

import { useEffect, useState, type PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthGuard({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('hs_token') || sessionStorage.getItem('hs_token')) : null
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        // Validate token server-side
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          try {
            localStorage.removeItem('hs_token')
            sessionStorage.removeItem('hs_token')
          } catch {
          }
          navigate('/login', { replace: true })
          return
        }

        // all good
        if (mounted) setChecking(false)
      } catch {
        try {
          localStorage.removeItem('hs_token')
          sessionStorage.removeItem('hs_token')
        } catch {
        }
        navigate('/login', { replace: true })
      }
    }

    check()
    return () => { mounted = false }
  }, [navigate])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    )
  }

  return <>{children}</>
}
