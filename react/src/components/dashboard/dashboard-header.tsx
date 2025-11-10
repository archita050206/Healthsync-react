"use client"

import { Link } from "react-router-dom"
import { Menu, Search } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"

interface HeaderProps {
  onSidebarToggle: () => void
}

const traditionalCatalog = [
  { id: 'trad-1', ayush: 'Unmada', ayushSystem: 'Ayurveda', icd: '6A00', title: 'Psychotic disorder (example)', description: 'Traditional term mapped to ICD-11.' },
  { id: 'trad-2', ayush: 'Chitta-Vikriti', ayushSystem: 'NAMASTE', icd: 'MB24.0', title: 'Depressive episode (example)', description: 'Traditional depressive presentation.' },
  { id: 'trad-3', ayush: 'Prana-Vikriti', ayushSystem: 'Ayurveda', icd: '6A40', title: 'Anxiety disorder (example)', description: 'Anxiety-like concept mapped.' }
]

export default function Header({ onSidebarToggle }: HeaderProps) {
  const [query, setQuery] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    // Filter local AYUSH/NAMASTE
    const filteredTraditional = traditionalCatalog.filter((d) => {
      const q = query.toLowerCase()
      return (d.title.toLowerCase().includes(q) || d.ayush.toLowerCase().includes(q) || d.icd.toLowerCase().includes(q))
    })

    // Fetch ICD-11 as well
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=${encodeURIComponent(query)}&maxList=7`)
        const data = await res.json()
        const codes = data[1]
        const titles = data[3].map((entry: string[]) => entry[1])
        const apiResults = codes.map((code: string, idx: number) => ({
          id: code,
          icd: code,
          title: titles[idx],
          description: '',
          ayush: '',
          ayushSystem: '',
          source: 'ICD-11'
        }))
        setSearchResults([...filteredTraditional.map(x => ({ ...x, source: 'Traditional' })), ...apiResults])
        setLoading(false)
      } catch {
        setSearchResults([...filteredTraditional.map(x => ({ ...x, source: 'Traditional' }))])
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="sm" onClick={onSidebarToggle} className="inline-flex">
          <Menu className="w-5 h-5" />
        </Button>

        {/* SEARCH BAR with results dropdown */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true) }}
            placeholder="Search patients, codes..."
            className="pl-10 h-9 bg-input"
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            autoComplete="off"
          />
          {/* Results dropdown */}
          {showResults && query.trim() && (
            <div className="absolute left-0 top-full mt-1 w-full z-10 bg-card border border-border rounded shadow-lg max-h-72 overflow-auto">
              {loading && <div className="p-3 text-xs text-muted-foreground">Loading...</div>}
              {searchResults.length === 0 && !loading && (
                <div className="p-3 text-xs text-muted-foreground">No results found</div>
              )}
              {searchResults.length > 0 && (
                <ul>
                  {searchResults.map(result => (
                    <li key={result.id} className="border-b last:border-b-0">
                      <button
                        type="button"
                        className="w-full text-left p-3 hover:bg-accent/10 transition rounded flex flex-col"
                        // onClick={() => ... handle selection/click/navigation here
                        >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{result.title}</span>
                          <span className="text-xs rounded px-2 py-1 bg-muted-foreground/10 ml-2">
                            {result.icd}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.description}</span>
                        <span className="text-xs text-muted-foreground">{result.source === "Traditional" ? result.ayushSystem : "ICD-11"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
  <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <img src="/logo-white.png" alt="HealthSync" className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-foreground">HealthSync</span>
        </Link>
        <button
          aria-label="Open user menu"
          className="w-9 h-9 rounded-full bg-gradient-blue-purple flex items-center justify-center"
        >
          <span className="text-white text-sm font-semibold">DR</span>
        </button>
      </div>
    </header>
  )
}
