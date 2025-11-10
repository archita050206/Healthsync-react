"use client"

import { useState, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/auth-guard'
import { useAuth } from '@/lib/auth'
import ThemeToggle from '@/components/theme-toggle'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Settings />
    </AuthGuard>
  )
}

function Settings() {
  const { user, loading, authFetch } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [org, setOrg] = useState<any | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [affiliatedDoctors, setAffiliatedDoctors] = useState<any[]>([])
  const [loadingOrg, setLoadingOrg] = useState(false)

  const loadOrganization = useCallback(async () => {
    if (! (user?.profile as any)?.organizationId) return
    setLoadingOrg(true)
    try {
      const res = await authFetch('/api/user/organization')
      if (!res.ok) return
      const data = await res.json()
      setOrg(data.organization || null)
      setAffiliatedDoctors(data.affiliatedDoctors || [])
    } catch {
      // ignore
    } finally {
      setLoadingOrg(false)
    }
  }, [authFetch, user?.profile?.organizationId])

  useEffect(() => {
    if (!loading && user) {
      setName('')
      setEmail(user.email || '')
      // load organization info when available
      loadOrganization()
    } else {
      setOrg(null)
      setAffiliatedDoctors([])
    }
  }, [loading, user, loadOrganization])

  async function saveProfile() {
    setSaving(true)
    setSaved(null)
    try {
      // Attempt to persist; API may vary. Use authFetch so token is attached.
      await authFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setSaved('Profile saved')
    } catch (e) {
      setSaved('Failed to save')
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(null), 2500)
    }
  }

  async function saveOrganization(updated: { name?: string }) {
    if (!org) return
    setSaving(true)
    setSaved(null)
    try {
      const res = await authFetch('/api/user/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setOrg(data.organization || org)
      setSaved('Organization saved')
    } catch (e) {
      setSaved('Failed to save')
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(null), 2500)
    }
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Personal details that help identify your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="block">
                <div className="text-sm mb-1 text-muted-foreground">Full name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </label>

              <label className="block">
                <div className="text-sm mb-1 text-muted-foreground">Email</div>
                <Input value={email} disabled />
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-3 ml-auto">
              {saved && <div className="text-sm text-muted-foreground">{saved}</div>}
              <Button variant="ghost" onClick={() => { setName(user?.profile?.name || ''); setSaved(null) }}>Reset</Button>
              <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
            </div>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Security settings for your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Change password</div>
                <div className="flex gap-2">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="ml-auto">
                <Button variant="outline">Update password</Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Organization details and affiliated doctors (visible if your account belongs to an organization).</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrg ? (
                <div className="text-sm text-muted-foreground">Loading organization…</div>
              ) : org ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Organization name</div>
                    <Input value={org.name || ''} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Slug</div>
                    <Input value={org.slug || ''} disabled />
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Admin</div>
                    <div className="text-sm">{org.adminEmail || org.admin || ''}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Affiliated doctors</div>
                    {affiliatedDoctors.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No affiliated doctors</div>
                    ) : (
                      <ul className="space-y-2">
                        {affiliatedDoctors.map((d) => (
                          <li key={d.id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{d.profile?.name || d.email}</div>
                              <div className="text-sm text-muted-foreground">{d.email}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{d.role}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">You are not part of an organization.</div>
              )}
            </CardContent>
            <CardFooter>
              <div className="ml-auto flex items-center gap-3">
                {saved && <div className="text-sm text-muted-foreground">{saved}</div>}
                <Button variant="ghost" onClick={loadOrganization}>Refresh</Button>
                <Button onClick={() => saveOrganization({ name: org?.name })} disabled={saving || !org}>{saving ? 'Saving…' : 'Save organization'}</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
