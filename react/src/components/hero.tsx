"use client"

import { Button } from "./ui/button"
import { Users, MessageCircle, BookOpen, Shield, Search } from "lucide-react"
import { motion, useScroll } from "framer-motion"

import { useRef, useState, useEffect } from "react"
import { Card } from "./ui/card"

const features = [
  {
    icon: Users,
    title: "Patient Registry",
    description: "Maintain a secure, searchable registry of patient records with structured clinical data.",
  },
  {
    icon: MessageCircle,
    title: "Care Coordination",
    description: "Streamline referrals, messaging, and care plans across teams and facilities.",
  },
  {
    icon: BookOpen,
    title: "Clinical Resources",
    description: "Provide evidence-based guidelines, clinical pathways, and decision support.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "HIPAA-compliant controls, audit logs, and encrypted storage.",
  },
]

export function Hero() {
  const containerRef = useRef(null)
  const [, setIsMobile] = useState(false)

  // State for ICD-11 API data and UI states
  const [query, setQuery] = useState("")
  const [diseaseCatalog, setDiseaseCatalog] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<any | null>(null)
  const [saved, setSaved] = useState<Array<any>>([])
  const [fhirPreview, setFhirPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendLog, setSendLog] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string, ms = 3000) {
    setToast(message)
    setTimeout(() => setToast(null), ms)
  }

  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch ICD-11 API data when query changes, debounce to avoid overloading API
  useEffect(() => {
    if (!query.trim()) {
      setDiseaseCatalog([])
      setError(null)
      return
    }
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=${encodeURIComponent(query)}&maxList=15`)
        if (!res.ok) throw new Error('Network response not OK')
        const data = await res.json()
        /* data format:
          [
            totalCount,
            code array,
            extra data object with properties including 'title' which stores display names,
            array of display strings, e.g. ['code', 'title', 'parent', ...]
          ]
        */
        const codes = data[1]
        const titles = data[3].map((entry: string[]) => entry[1]) // title is at index 1 of each entry
        // Map API results into a format similar to your previous static array
        const catalog = codes.map((code: string, idx: number) => ({
          id: code,
          icd: code,
          title: titles[idx],
          description: '', // API does not provide description here
        }))
        setDiseaseCatalog(catalog)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || 'Error fetching data')
        setDiseaseCatalog([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce fetch by 300ms
    const debounce = setTimeout(fetchData, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const filtered = query
    ? diseaseCatalog.filter((d) => {
        const q = query.toLowerCase()
        return (
          d.title.toLowerCase().includes(q) ||
          d.icd.toLowerCase().includes(q)
        )
      })
    : diseaseCatalog

  function convertToFHIR(diagnosis: any) {
    const fhir = {
      resourceType: 'Condition',
      id: `cond-${diagnosis.id}`,
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
      code: {
        coding: [
          { system: 'http://who.int/icd', code: diagnosis.icd, display: diagnosis.title },
        ],
        text: diagnosis.title,
      },
      subject: { reference: 'Patient/sample-patient', display: 'Sample Patient' },
      onsetDateTime: new Date().toISOString(),
    }
    return fhir
  }

  async function handleSave() {
    if (!selected) return
    setSaved((s) => {
      if (s.find((it) => it.id === selected.id)) return s
      return [...s, selected]
    })
  }

  function handlePreview() {
    if (!selected) return
    const fhir = convertToFHIR(selected)
    setFhirPreview(JSON.stringify(fhir, null, 2))
  }

  async function handleMockSend() {
    if (!fhirPreview) return
    setSending(true)
    setSendLog(null)

    await new Promise((r) => setTimeout(r, 700))
    setSending(false)
    setSendLog('FHIR payload successfully sent to mock EMR (simulated).')
    // Inform the user they need to log in to save real patient records
    showToast('Log in to save patient records to EMR')
  }


  // Mobile animation ranges and spring configs as before (omitted here for brevity)
  // ... (copy your existing scroll and animation related code)

  // For brevity, I keep animation code unchanged — insert your previous code here

  return (
    <div ref={containerRef} className="overflow-hidden">
      {/* Toast - simple inline implementation for quick user feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded shadow-lg">{toast}</div>
        </div>
      )}
      {/* Animated shadow CSS omitted for brevity; keep unchanged */}

      <section className="relative py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:gap-12 items-center">
            <motion.div
              className="space-y-6 md:space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  HealthSync
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Search ICD-11 terms, save a diagnosis for a sample patient, and preview a FHIR-compatible record.
                </p>

                {/* EMR interaction */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                  <div className="col-span-1">
                    <label className="sr-only">Search diagnoses</label>
                    <div className="relative">
                      <input
                        aria-label="Search diagnoses"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search ICD-11 or free text..."
                        className="w-full pl-10 pr-3 h-9 rounded-md border border-border bg-input text-sm"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">Try: "heart", "diabetes", or ICD codes like "6A00".</p>

                    <div className="mt-2 max-h-44 overflow-auto">
                      {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
                      {error && <p className="text-xs text-red-600">Error: {error}</p>}
                      {!loading && filtered.length === 0 && <p className="text-xs text-muted-foreground">No results</p>}
                      {!loading && filtered.length > 0 && (
                        <ul className="space-y-2">
                          {filtered.map((d) => (
                            <li key={d.id}>
                              <button
                                onClick={() => setSelected(d)}
                                className={`w-full text-left p-2 rounded-md hover:bg-accent/5 transition ${selected?.id === d.id ? 'bg-accent/10' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-foreground">{d.title}</div>
                                    <div className="text-xs text-muted-foreground">ICD: {d.icd}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">View</div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Selected diagnosis</p>
                      <p className="text-xs text-muted-foreground">Sample Patient</p>
                    </div>
                    <div className="mt-2 p-3 rounded-md bg-card border border-border min-h-[72px]">
                      {selected ? (
                        <div>
                          <div className="text-sm font-semibold text-foreground">{selected.title}</div>
                          <div className="text-xs text-muted-foreground">{selected.description}</div>
                          <div className="text-xs text-muted-foreground">ICD-11: {selected.icd}</div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No diagnosis selected</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-3 flex-wrap">
                  <Button variant="secondary" size="sm" onClick={handleSave} disabled={!selected}>
                    Save diagnosis
                  </Button>
                  <Button size="sm" onClick={handlePreview} disabled={!selected}>
                    Preview FHIR
                  </Button>
                  <Button size="sm" onClick={handleMockSend} disabled={!fhirPreview || sending}>
                    {sending ? 'Sending…' : 'Send to EMR (mock)'}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Saved diagnoses</p>
                    <div className="mt-2 space-y-2">
                      {saved.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None saved yet</p>
                      ) : (
                        saved.map((s) => (
                          <div key={s.id} className="p-2 rounded border border-border bg-card text-sm">
                            <div className="font-medium">{s.title}</div>
                            <div className="text-xs text-muted-foreground">ICD: {s.icd}</div>
                          </div>
                        ))
                      )}
                    </div>
                    {sendLog && <p className="mt-2 text-xs text-success">{sendLog}</p>}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">FHIR preview</p>
                    <div className="mt-2 p-2 rounded bg-black/5 max-h-48 overflow-auto text-xs font-mono">
                      {fhirPreview ? (
                        <pre className="whitespace-pre-wrap">{fhirPreview}</pre>
                      ) : (
                        <p className="text-xs text-muted-foreground">Preview a FHIR Condition by selecting a diagnosis and clicking Preview FHIR.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="relative py-12 md:py-20 lg:py-32 bg-muted/30">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="relative z-10">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                Why Choose HealthSync?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance px-4">
                We design every feature for secure, interoperable clinical workflows and improved patient outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-4 sm:px-0">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="p-6 sm:p-8 bg-card hover:shadow-lg transition-shadow border-border" style={{ boxShadow: 'var(--card-shadow, 0 18px 48px rgba(2,6,23,0.12))' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{feature.description}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
