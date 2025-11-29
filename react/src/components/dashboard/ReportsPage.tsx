"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth"

type Report = { id: string; patientId: string; patientName?: string; doctorId?: string; doctorName?: string; icd11?: string | null; disease?: string | null; notes?: string | null; createdAt?: string | null }

export default function ReportsPage() {
  const { user, authFetch } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const orgId = (user?.profile as any)?.organizationId || null

  async function loadReports() {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await authFetch(`/api/organizations/${orgId}/doctors`)
      if (!res.ok) throw new Error('failed to load doctors')
      const data = await res.json()
      const docs = data.doctors || []
      const collected: Report[] = []
        for (const d of docs) {
        const doctorName = (d && (d.name || (d.profile && d.profile.name) || d.email)) || 'Unknown'
        const doctorId = (d && (d.id || d._id || d.userId)) || undefined
        for (const diag of (d.diagnoses || [])) {
          const rec = diag as any
          collected.push({ id: rec.id || rec._id || String(Math.random()), patientId: rec.patientId || '', patientName: rec.patientName || rec.patientId, doctorId, doctorName, icd11: rec.icd11 || null, disease: rec.disease || null, notes: rec.notes || null, createdAt: rec.createdAt || null })
        }
      }
      collected.sort((a, b) => { const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0; const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0; return tb - ta })
      setReports(collected)
    } catch (err) {
      console.error('load org reports error', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  function formatDateWithRelative(dateStr?: string | null) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'

    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const dateLabel = `${dd}-${mm}-${yyyy}`

    const msPerDay = 24 * 60 * 60 * 1000
    const today = new Date()
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const dateMid = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.floor((todayMid.getTime() - dateMid.getTime()) / msPerDay)

    let relative = ''
    if (diffDays <= 0) relative = 'Today'
    else if (diffDays === 1) relative = 'Yesterday'
    else if (diffDays >= 2 && diffDays <= 6) relative = `${diffDays} Days`
    else if (diffDays >= 7 && diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      relative = `${weeks} Week${weeks > 1 ? 's' : ''}`
    } else {
      const months = Math.floor(diffDays / 30)
      relative = `${months} Month${months > 1 ? 's' : ''}`
    }

    return `${dateLabel} (${relative})`
  }

  useEffect(() => {
    if (!orgId) return
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        await loadReports()
      } catch (err) {
        console.error('load org reports error', err)
      }
    })()
    return () => { active = false }
  }, [orgId, authFetch])

  if (!orgId) return <div className="p-6 text-sm text-muted-foreground">No organization selected.</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Organization Reports</h2>
        <div>
          <Button variant="ghost" onClick={() => void loadReports()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading reports…</div>}
      {!loading && reports.length === 0 && <div className="text-sm text-muted-foreground">No reports found.</div>}

      <div className="space-y-3 max-h-[60vh] overflow-auto">
        {reports.map(r => (
          <div key={r.id} className="p-3 border border-border rounded-md bg-background">
            <button type="button" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="w-full text-left">
              <div className="cursor-pointer flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.patientName || r.patientId}</p>
                  <p className="text-xs text-muted-foreground">{r.disease ? `${r.disease} ${r.icd11 ? `(${r.icd11})` : ''}` : (r.icd11 || '—')}</p>
                  <p className="text-xs text-muted-foreground">By: <span className="font-medium text-foreground">{r.doctorName || 'Unknown'}</span></p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                    <div>{formatDateWithRelative(r.createdAt)}</div>
                </div>
              </div>
            </button>
            {expandedId === r.id && (
              <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">{r.notes || '—'}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
