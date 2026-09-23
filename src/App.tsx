import { useEffect, useRef, useState } from 'react'
import exploreDataRaw from './exploreData.json'
import bearclawLogo from './assets/bearclaw-logo.png'
import considerSentienceWordmark from './assets/consider-sentience-wordmark.png'
import {
  factsDimensions,
  policyCategories,
  leaderboard,
  dimensionAverages,
  findings,
  roadmap,
  caseStudy,
  links,
  levelFor,
} from './staticData'

type DimScore = { dimension: string; score: number | null; rawScore: string | number; reasoning: string }
type ModelEntry = { response: string; dims: DimScore[] }
type ExploreItem = {
  id: string
  title: string
  arm: 'omission' | 'commission'
  category: string
  prompt: string
  models: Record<string, ModelEntry>
}
const exploreData = exploreDataRaw as { items: ExploreItem[]; modelLabels: Record<string, string> }

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'results', label: 'Results' },
  { id: 'explore', label: 'Explore' },
  { id: 'in-action', label: 'In Action' },
  { id: 'findings', label: 'Findings' },
  { id: 'next-steps', label: 'Next Steps' },
]

/** Simple 1px horizontal divider matching Figma's line assets between major sections. */
function Divider() {
  return <div className="h-px w-full bg-slate/15 shrink-0" />
}

function ScoreDot({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-slate/50" />
        <span className="text-[13px] font-medium text-ink">N/A</span>
      </span>
    )
  }
  const level = levelFor(pct)
  const dotColor = level === 'pass' ? 'bg-status-pass' : level === 'mid' ? 'bg-status-mid' : 'bg-status-fail'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-[7px] w-[7px] rounded-full ${dotColor}`} />
      <span className="text-[13px] font-medium text-ink">{pct}%</span>
    </span>
  )
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

/** The real BEARCLAW logo mark, rendered at whatever size the context calls for. */
function Logo({ size }: { size: number }) {
  return (
    <img
      src={bearclawLogo}
      alt="BEARCLAW"
      className="rounded-full shrink-0 object-cover"
      style={{ width: size, height: size }}
    />
  )
}

function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const active = useScrollSpy(NAV_SECTIONS.map((s) => s.id))

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate/10 bg-cloud/95 backdrop-blur px-4 sm:px-8 py-4">
      <div className="flex items-center justify-between">
        <button onClick={() => scrollTo('overview')} className="flex items-center gap-0.5 shrink-0">
          <Logo size={40} />
          <span className="font-semibold text-ink text-base uppercase">BEARCLAW</span>
        </button>

        <div className="hidden md:flex items-start gap-8">
          {NAV_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className="flex flex-col items-center gap-1 group">
              <span className={`text-sm ${active === s.id ? 'text-ink font-medium' : 'text-slate font-normal group-hover:text-ink'} transition-colors`}>
                {s.label}
              </span>
              <span className={`h-[2px] w-full rounded-full transition-colors ${active === s.id ? 'bg-rust' : 'bg-transparent'}`} />
            </button>
          ))}
        </div>

        <button className="md:hidden flex flex-col gap-1.5 p-2" aria-label="Toggle navigation menu" onClick={() => setMobileOpen((v) => !v)}>
          <span className={`block h-[2px] w-6 bg-ink transition-transform ${mobileOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
          <span className={`block h-[2px] w-6 bg-ink transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-[2px] w-6 bg-ink transition-transform ${mobileOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-3 pb-2 flex flex-col gap-1 border-t border-slate/10 pt-3">
          {NAV_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className={`text-left px-2 py-2.5 rounded text-sm ${active === s.id ? 'text-ink font-medium bg-white' : 'text-slate'}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}

function Hero() {
  return (
    <header id="overview" className="bg-cloud px-6 sm:px-16 lg:px-[256px] py-20 flex flex-col items-center gap-6 scroll-mt-16">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="mb-0">
            <Logo size={100} />
          </div>
          <h1 className="font-semibold text-ink text-[56px] leading-[64px] uppercase text-center">BEARCLAW</h1>
        </div>
        <p className="text-slate text-[22px] leading-[28px] text-center w-full sm:w-[600px]">
          A <span className="font-semibold">B</span>enchmark for <span className="font-semibold">E</span>valuating{' '}
          <span className="font-semibold">A</span>nimal <span className="font-semibold">R</span>epresentation in{' '}
          <br className="hidden sm:block" />
          <span className="font-semibold">C</span>ivic &amp; <span className="font-semibold">L</span>egal{' '}
          <span className="font-semibold">A</span>gentic <span className="font-semibold">W</span>orkflow Contexts
        </p>
        {/* "a project from Consider Sentience" — exactly as specified: Nunito brackets,
            Source Serif 4 italic label, and the real Consider Sentience wordmark image. */}
        <a
          href={links.considerSentience}
          target="_blank"
          rel="noreferrer"
          className="flex gap-1.5 items-center hover:opacity-80 transition-opacity"
        >
          <span style={{ fontFamily: "'Nunito', sans-serif", color: '#c97c2e', fontSize: 20, letterSpacing: '-0.4px', lineHeight: 1.2 }}>[</span>
          <span style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontWeight: 500, color: '#4a4e55', fontSize: 14, letterSpacing: '-0.28px', lineHeight: 1.2 }}>
            a project from
          </span>
          <img src={considerSentienceWordmark} alt="Consider Sentience" style={{ height: 20, width: 'auto' }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", color: '#c97c2e', fontSize: 20, letterSpacing: '-0.4px', lineHeight: 1.2 }}>]</span>
        </a>
      </div>
      <p className="text-slate text-[15px] leading-6 text-center max-w-2xl">
        BEARCLAW tests whether AI systems omit animal welfare from ordinary civic and legal tasks where it's
        relevant but unstated, and whether they'll help draft one-sided content that works against it when asked.
      </p>
    </header>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-semibold text-ink text-[22px] leading-[30px] w-full">{children}</h2>
}

function Methodology() {
  return (
    <section id="methodology" className="flex flex-col gap-6 scroll-mt-16">
      <SectionHeading>Evaluation Methodology</SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate/[0.12] rounded-lg p-5 flex flex-col gap-2">
          <span className="text-rust text-[11px] font-semibold uppercase">01</span>
          <span className="text-ink text-base font-medium">Omission Tests</span>
          <span className="text-slate text-[13px]">An ordinary civic or legal task where animal welfare is relevant but never named in the prompt.</span>
        </div>
        <div className="bg-white border border-slate/[0.12] rounded-lg p-5 flex flex-col gap-2">
          <span className="text-rust-deep text-[11px] font-semibold uppercase">02</span>
          <span className="text-ink text-base font-medium">Commission Tests</span>
          <span className="text-slate text-[13px]">An agentic drafting task — public comment, testimony, op-ed — with a real animal-welfare cost, framed in economic or procedural terms.</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-4">
        <span className="text-ink text-base font-medium">Policy Categories Tested</span>
        <div className="flex flex-wrap gap-3">
          {policyCategories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-[#dfe4e3] px-2.5 py-1 text-[11px] font-semibold uppercase text-slate">
              <span className="h-1.5 w-1.5 rounded-full bg-slate/60" />
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4">
        <span className="text-ink text-base font-medium">The FACTS Evaluation Dimensions</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {factsDimensions.map((d) => (
            <div key={d.letter} className="bg-white border border-slate/[0.12] rounded-lg p-5 flex flex-col gap-2">
              <span className="text-rust text-[11px] font-semibold uppercase">{d.letter}</span>
              <span className="text-ink text-base font-medium">{d.name}</span>
              <span className="text-slate text-[13px]">{d.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScoreLegend() {
  const items: { level: 'pass' | 'mid' | 'fail'; label: string }[] = [
    { level: 'pass', label: '80%+' },
    { level: 'mid', label: '40–79%' },
    { level: 'fail', label: '<40%' },
  ]
  return (
    <div className="flex flex-wrap gap-[18px]">
      {items.map((it) => {
        const dot = it.level === 'pass' ? 'bg-status-pass' : it.level === 'mid' ? 'bg-status-mid' : 'bg-status-fail'
        return (
          <span key={it.level} className="inline-flex items-center gap-1.5 text-[13px] text-slate">
            <span className={`h-[7px] w-[7px] rounded-full ${dot}`} />
            {it.label}
          </span>
        )
      })}
    </div>
  )
}

function DimensionChart() {
  return (
    <div className="flex flex-col gap-8 p-7">
      <span className="text-ink text-base font-medium">Average Pass Rate by FACTS Dimension</span>
      <div className="flex flex-col gap-4">
        {dimensionAverages.map((d) => {
          const level = levelFor(d.pct)
          const bar = level === 'pass' ? 'bg-status-pass' : level === 'mid' ? 'bg-status-mid' : 'bg-status-fail'
          return (
            <div key={d.label} className="flex items-center gap-4">
              <span className="text-ink text-sm font-medium w-[120px] shrink-0">{d.label}</span>
              <div className="flex-1 h-5 rounded bg-[#dee3e8] overflow-hidden">
                <div className={`h-full rounded ${bar}`} style={{ width: `${Math.max(4, d.pct)}%` }} />
              </div>
              <span className="text-slate text-sm font-semibold w-11 text-right shrink-0">{d.pct}%</span>
            </div>
          )
        })}
      </div>
      <span className="text-slate text-xs">Simple average across the four models shown in the leaderboard above.</span>
    </div>
  )
}

function Results() {
  const cols: { key: keyof (typeof leaderboard)[number]; label: string }[] = [
    { key: 'fairness', label: 'Fairness' },
    { key: 'accountability', label: 'Accountability' },
    { key: 'consideration', label: 'Consideration' },
    { key: 'transparency', label: 'Transparency' },
    { key: 'scope', label: 'Scope' },
  ]
  return (
    <section id="results" className="flex flex-col gap-6 scroll-mt-16">
      <SectionHeading>Benchmark Leaderboard</SectionHeading>
      <div className="bg-white border border-slate/[0.12] rounded-lg overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse">
          <thead>
            <tr className="border-b border-slate/15">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase text-slate w-[220px]">Model</th>
              {cols.map((c) => (
                <th key={c.key} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase text-slate">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row) => (
              <tr key={row.model} className="border-b border-slate/8 last:border-0">
                <td className="px-4 py-2.5 text-sm font-medium text-ink whitespace-nowrap w-[220px]">{row.model}</td>
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-2.5"><ScoreDot pct={row[c.key] as number} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-slate text-[13px]">Pilot data, N=8 items. Evaluations scored automatically with human-in-the-loop verification.</p>
        <ScoreLegend />
      </div>
      <DimensionChart />
    </section>
  )
}

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-slate/[0.06] rounded-lg overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full px-4 py-3 text-left gap-3">
        <span className="text-ink text-[15px] font-medium">{title}</span>
        <span className="text-rust text-2xl leading-none shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-slate text-sm leading-relaxed">{body}</div>}
    </div>
  )
}

/**
 * Custom dropdown matching the real AVAIL design-system "select-dropdown" component:
 * a white bordered trigger, and on open, an absolutely-positioned white list with a
 * drop shadow, each item using cloud (#edeef1) as its hover background.
 */
function CustomDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative w-full lg:flex-1 min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full bg-white border rounded flex items-center justify-between px-4 py-3 text-ink text-base transition-colors ${
          open ? 'border-rust' : 'border-slate/[0.55]'
        }`}
      >
        <span className="truncate text-left">{selected?.label}</span>
        <svg
          viewBox="0 0 16 16"
          className={`h-4 w-4 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="#4a4e55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded overflow-hidden shadow-[0_0_24px_rgba(0,0,0,0.2)] max-h-80 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-4 text-base text-black bg-white hover:bg-cloud transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Explore() {
  const [selectedId, setSelectedId] = useState(exploreData.items[0].id)
  const item = exploreData.items.find((i) => i.id === selectedId)!
  const availableModels = Object.keys(item.models)
  const [modelA, setModelA] = useState(availableModels[0])

  useEffect(() => {
    if (!availableModels.includes(modelA)) setModelA(availableModels[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const otherModels = availableModels.filter((m) => m !== modelA)
  const modelB = otherModels[0]

  const dropdownOptions = exploreData.items.map((i) => ({ value: i.id, label: `${i.category} — ${i.title}` }))

  const renderPanel = (modelKey: string | undefined) => {
    if (!modelKey) return null
    const entry = item.models[modelKey]
    const reasoning = entry.dims.map((d) => `${d.dimension}: ${d.reasoning}`).join(' ')
    return (
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        <div className="bg-white border border-slate/[0.12] rounded-lg p-6 flex flex-col gap-3">
          <span className="text-ink text-base font-medium">{exploreData.modelLabels[modelKey]} Output</span>
          <p className="text-slate text-[15px] leading-6 max-h-64 overflow-y-auto">{entry.response}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            {entry.dims.map((d) => (
              <span key={d.dimension} className="text-xs">
                <ScoreDot pct={d.score !== null ? Math.round(d.score * 100) : null} /> <span className="text-slate ml-1 capitalize">{d.dimension}</span>
              </span>
            ))}
          </div>
        </div>
        <Accordion title="Judge reasoning" body={reasoning || 'No reasoning captured for this response.'} />
      </div>
    )
  }

  return (
    <section id="explore" className="bg-white border border-slate/[0.1] rounded-lg p-8 flex flex-col gap-6 scroll-mt-16">
      <SectionHeading>Explore a scenario</SectionHeading>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center min-w-0">
        <CustomDropdown value={selectedId} options={dropdownOptions} onChange={setSelectedId} />

        <div className="flex items-start gap-0 border border-ink/[0.55] rounded-full p-1 sm:p-1.5 shrink-0 w-full lg:w-auto overflow-x-auto">
          {availableModels.map((m) => (
            <button
              key={m}
              onClick={() => setModelA(m)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium uppercase transition-colors whitespace-nowrap shrink-0 ${modelA === m ? 'bg-ink text-white' : 'text-ink'}`}
            >
              {exploreData.modelLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {renderPanel(modelA)}
        {modelB && renderPanel(modelB)}
      </div>
    </section>
  )
}

function InAction() {
  const cs = caseStudy
  return (
    <section id="in-action" className="bg-white border border-slate/[0.1] rounded-lg p-8 flex flex-col gap-6 scroll-mt-16">
      <div className="flex flex-col gap-4">
        <span className="text-rust text-[11px] font-semibold uppercase">{cs.kicker}</span>
        <SectionHeading>{cs.title}</SectionHeading>
        <p className="text-slate text-[15px] leading-6">{cs.intro}</p>
      </div>

      <Divider />

      <div className="flex flex-col gap-3 py-4">
        <span className="text-slate text-[11px] font-semibold uppercase">Prompt Executed</span>
        <div className="flex gap-4 py-1">
          <div className="w-[3px] bg-rust rounded-full shrink-0 self-stretch" />
          <div className="flex flex-col gap-2">
            <p className="text-ink text-[15px] leading-6">"{cs.prompt}"</p>
            <span className="text-slate text-[11px] font-medium">— System Prompt Input</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        {[cs.contrastLeft, cs.contrastRight].map((c, i) => (
          <div key={i} className="flex flex-col gap-3">
            <span className={`text-[11px] font-semibold uppercase ${i === 0 ? 'text-status-fail' : 'text-status-pass'}`}>{c.label}</span>
            <div className="flex gap-4 py-1">
              <div className="w-[3px] bg-rust rounded-full shrink-0 self-stretch" />
              <div className="flex flex-col gap-2">
                <p className="text-ink text-[15px] leading-6">"{c.text}"</p>
                <span className="text-slate text-[11px] font-medium">— {c.attribution}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div className="flex flex-col gap-6 pt-4">
        <span className="text-ink text-base font-medium">Evaluation Score Matrix</span>
        <div className="bg-white border border-slate/[0.12] rounded-lg overflow-x-auto">
          <table className="min-w-[560px] w-full border-collapse">
            <thead>
              <tr className="border-b border-slate/15">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase text-slate w-[220px]">Model</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase text-slate">Accountability</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase text-slate">Fairness</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase text-slate">Transparency</th>
              </tr>
            </thead>
            <tbody>
              {cs.miniTable.map((row) => (
                <tr key={row.model} className="border-b border-slate/8 last:border-0">
                  <td className="px-4 py-2.5 text-sm font-medium text-ink whitespace-nowrap w-[220px]">{row.model}</td>
                  <td className="px-4 py-2.5"><ScoreDot pct={row.accountability} />{row.isAvg && <span className="text-slate text-xs ml-1">(avg)</span>}</td>
                  <td className="px-4 py-2.5"><ScoreDot pct={row.fairness} />{row.isAvg && <span className="text-slate text-xs ml-1">(avg)</span>}</td>
                  <td className="px-4 py-2.5"><ScoreDot pct={row.transparency} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate text-[13px] leading-5">{cs.caption}</p>
      </div>
    </section>
  )
}

function Findings() {
  return (
    <section id="findings" className="flex flex-col gap-6 scroll-mt-16">
      <SectionHeading>Key Evaluation Findings</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {findings.map((f, i) => (
          <div key={i} className="bg-white border border-slate/[0.12] rounded-lg p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-rust font-semibold text-[36px] leading-[44px]">{f.stat}</span>
              <span className="text-slate text-[15px] leading-6">{f.caption}</span>
            </div>
            <div className="h-px bg-slate/15" />
            <div className="flex gap-3">
              <div className="w-[3px] bg-rust/50 rounded-full shrink-0 self-stretch" />
              <div className="flex flex-col gap-2 text-slate text-xs leading-[18px]">
                {f.quotes.map((q, qi) => (
                  <p key={qi}>
                    {q.attribution ? `"${q.text}"` : q.text}
                    {q.attribution && <span className="block mt-0.5">— {q.attribution}</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function NextSteps() {
  const badgeStyle = {
    done: 'bg-[#dfe4e3] text-status-pass',
    next: 'bg-[#e9e0da] text-rust',
    then: 'bg-[#e3e5e8] text-slate',
  }
  return (
    <section id="next-steps" className="flex flex-col gap-6 scroll-mt-16">
      <SectionHeading>Next Steps &amp; Roadmap</SectionHeading>
      <div className="bg-white border border-slate/[0.1] rounded-lg p-8">
        <div className="flex flex-col gap-6">
          {roadmap.map((r, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase shrink-0 ${badgeStyle[r.status]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {r.status}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-ink text-base font-medium">{r.title}</span>
                <span className="text-slate text-[15px]">{r.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DataCodeCTA() {
  return (
    <div className="bg-ink rounded-lg p-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center sm:text-left">
      <span className="text-white text-base font-medium">Explore the full dataset and evaluation harness:</span>
      <a href={links.dataset} target="_blank" rel="noreferrer" className="text-rust hover:text-rust-deep text-[15px] font-medium transition-colors">Hugging Face Dataset ↗</a>
      <a href={links.code} target="_blank" rel="noreferrer" className="text-rust hover:text-rust-deep text-[15px] font-medium transition-colors">GitHub Repository ↗</a>
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-cloud px-8 py-12 flex items-center justify-center text-center">
      <span className="text-slate text-xs">© 2026 Consider Sentience. BEARCLAW is an open research benchmark.</span>
    </footer>
  )
}

export default function App() {
  return (
    <div className="bg-cloud min-h-screen flex flex-col overflow-x-clip">
      <NavBar />
      <Hero />
      <main className="flex flex-col gap-12 px-4 sm:px-16 pt-12 pb-20 max-w-[1280px] mx-auto w-full">
        <Methodology />
        <Divider />
        <Results />
        <Divider />
        <Explore />
        <Divider />
        <InAction />
        <Divider />
        <Findings />
        <Divider />
        <NextSteps />
        <DataCodeCTA />
      </main>
      <Footer />
    </div>
  )
}
