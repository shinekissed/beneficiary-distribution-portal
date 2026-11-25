import { FormEvent, ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import heroWelcome from './assets/illustrations/hero-welcome.webp'
import kaagapayLogo from './assets/kaagapay-logo.png'
import scheduleSearch from './assets/illustrations/schedule-search.webp'
import requirementsChecklist from './assets/illustrations/requirements-checklist.webp'
import requirementsDocuments from './assets/illustrations/requirements-documents.webp'
import serviceArea from './assets/illustrations/service-area.webp'
import assistanceDesk from './assets/illustrations/assistance-desk.webp'
import processSchedule from './assets/illustrations/process-schedule.webp'
import processVenue from './assets/illustrations/process-venue.webp'
import processDocuments from './assets/illustrations/process-documents.webp'
import processGuidance from './assets/illustrations/process-guidance.webp'
import processComplete from './assets/illustrations/process-complete.webp'
import { getAnnouncements, getSchedules, lookupBeneficiary } from './api/api'
import type { Announcement, BeneficiaryLookupResult, Schedule } from './types/api'
import { beneficiaryLookup } from './data/mockData'
import { API_CONFIG } from './api/config'
import type { processInstructions, requirements } from './data/guidance'
import { formatDate, formatTimestamp, getContentSnapshot, publishedContent, readContent, subscribeToContent } from './data/staffContent'
import StaffArea from './StaffArea'

type Page =
  | 'home'
  | 'schedules'
  | 'lookup'
  | 'requirements'
  | 'process'
  | 'service'
  | 'waiting'
  | 'announcements'
  | 'assistance'
  | 'staff'

type IconName =
  | 'home'
  | 'calendar'
  | 'search'
  | 'file'
  | 'steps'
  | 'map'
  | 'clock'
  | 'bell'
  | 'help'
  | 'arrow'
  | 'menu'
  | 'close'
  | 'check'
  | 'info'
  | 'phone'
  | 'mail'
  | 'pin'
  | 'users'
  | 'id'
  | 'shield'

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
  steps: <><path d="M4 19h5v-5h5V9h6"/><path d="m17 6 3 3-3 3"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 3.3 2.4c-.8.3-1.1.8-1.1 1.6M12 17h.01"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  phone: <path d="M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4c0 1-1 2-2 2A17 17 0 0 1 3 6c0-1 1-2 2-2Z"/>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c.8-2 4.2-2 5 0M13 10h5M13 14h5"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
}

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'schedules', label: 'Schedules', icon: 'calendar' },
  { id: 'lookup', label: 'Individual Lookup', icon: 'search' },
  { id: 'requirements', label: 'Requirements', icon: 'file' },
  { id: 'process', label: 'Process Guide', icon: 'steps' },
  { id: 'service', label: 'Service Area', icon: 'map' },
  { id: 'waiting', label: 'Waiting Time', icon: 'clock' },
  { id: 'announcements', label: 'Announcements', icon: 'bell' },
  { id: 'assistance', label: 'Assistance', icon: 'help' },
]

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#6F4FA8]">{eyebrow}</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#D8CCE9] bg-[#F7F4FB] p-4 text-sm leading-relaxed text-[#352054]">
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-[#6F4FA8]" />
      <div>{children}</div>
    </div>
  )
}

function HomePage({ goTo, updatedAt }: { goTo: (page: Page) => void; updatedAt?: string }) {
  const quickLinks = navItems.slice(1, 7)
  const [announcementItems, setAnnouncementItems] = useState<Announcement[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getAnnouncements()
      .then((items) => {
        if (active) setAnnouncementItems(items)
      })
      .catch(() => {
        if (active) setAnnouncementsError('Announcements are temporarily unavailable. Please try again later.')
      })
      .finally(() => {
        if (active) setAnnouncementsLoading(false)
      })

    return () => {
      active = false
    }
  }, [updatedAt])

  return (
    <>
      <section className="overflow-hidden rounded-3xl bg-[#54358B] text-white shadow-xl shadow-[#352054]/10">
        <div className="relative grid items-center gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.35fr_.65fr] lg:gap-10 lg:px-10 xl:px-12">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[48px] border-white/5" />
          <div className="absolute bottom-0 right-24 h-36 w-36 rounded-full bg-[#8B6FC0]/10 blur-2xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8BAF93] bg-[#8BAF93]/15 px-3 py-1.5 text-sm font-semibold text-[#F3EFF9]">
              <Icon name="shield" className="h-4 w-4" /> Public information prototype
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl xl:text-5xl">Benefit information, made easier to understand.</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[#F3EFF9]">Find your sample schedule, prepare the right documents, and learn what to expect at the distribution site.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => goTo('schedules')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#EDE7F6] px-6 py-3 font-bold text-[#352054] shadow-lg shadow-[#352054]/20 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Check schedules <Icon name="arrow" />
              </button>
              <button onClick={() => goTo('lookup')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Individual lookup
              </button>
            </div>
          </div>
          <figure className="relative hidden lg:block">
            <div className="absolute inset-6 rounded-full bg-[#8B6FC0]/20 blur-2xl" />
            <img src={heroWelcome} alt="Senior beneficiary using an information tablet with help from a public-service staff member" className="relative mx-auto aspect-[4/3] max-h-72 w-full max-w-md rounded-[2rem] object-cover shadow-2xl shadow-[#352054]/25 ring-1 ring-white/20" />
          </figure>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-[#6F4FA8]">Quick access</p><h2 className="mt-1 text-2xl font-bold text-slate-950">How can we help?</h2></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <button key={item.id} onClick={() => goTo(item.id)} className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#C5B6DE] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EDE7F6] text-[#54358B]"><Icon name={item.icon} /></span>
              <span><span className="block font-bold text-slate-900">{item.label}</span><span className="mt-1 block text-sm leading-relaxed text-slate-600">{item.id === 'schedules' ? 'Find sample dates and venues by barangay.' : item.id === 'lookup' ? 'Check a fictional beneficiary record.' : item.id === 'requirements' ? 'Review what to bring on the day.' : item.id === 'process' ? 'Follow the distribution steps.' : item.id === 'service' ? 'Navigate counters and queue areas.' : 'See available wait estimates.'}</span></span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-[#6F4FA8]">Latest notices</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Announcements</h2></div><button onClick={() => goTo('announcements')} className="hidden font-bold text-[#54358B] hover:underline sm:block">View all</button></div>
          <div className="mt-5 divide-y divide-slate-200">
            {announcementsLoading && <p className="py-4 text-sm text-slate-600">Loading announcements…</p>}
            {announcementsError && <p className="py-4 text-sm text-red-700">{announcementsError}</p>}
            {!announcementsLoading && !announcementsError && !announcementItems.length && <p className="py-4 text-sm text-slate-600">No announcements available.</p>}
            {!announcementsLoading && !announcementsError && announcementItems.slice(0, 2).map((item) => <article key={item.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#6F4FA8]"><span>{item.type}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="text-slate-500">{item.date}</span></div><h3 className="mt-2 font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p></article>)}
          </div>
        </div>
        <div className="rounded-2xl bg-[#E3ECE5] p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#8BAF93] text-[#26382A] shadow-sm"><Icon name="help" className="h-6 w-6" /></span>
          <h2 className="mt-5 text-xl font-bold text-slate-950">Need assistance?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">Our sample help desk guide explains who to approach and what information to prepare.</p>
          <button onClick={() => goTo('assistance')} className="mt-5 inline-flex items-center gap-2 font-bold text-[#452A73] hover:underline">Get help <Icon name="arrow" className="h-4 w-4" /></button>
        </div>
      </section>
    </>
  )
}

function SchedulesPage({ updatedAt }: { updatedAt?: string }) {
  const [query, setQuery] = useState('')
  const [scheduleItems, setScheduleItems] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getSchedules()
      .then((items) => {
        if (active) setScheduleItems(items)
      })
      .catch(() => {
        if (active) setError('Schedules are temporarily unavailable. Please try again later.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [updatedAt])

  const filtered = scheduleItems.filter((item) => item.barangay.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <>
      <PageIntro eyebrow="Distribution calendar" title="Search schedules by barangay" description="Enter a barangay name to view fictional distribution dates, times, and venues for this prototype." />
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_220px]">
        <div className="p-5 sm:p-7">
          <label htmlFor="barangay" className="text-sm font-bold text-slate-800">Barangay name</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="barangay" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try “Maligaya” or “Mabini”" className="field pl-12" /></div>
            {query && <button onClick={() => setQuery('')} className="min-h-12 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50">Clear search</button>}
          </div>
          <p className="mt-3 text-sm text-slate-500">Showing {filtered.length} of {scheduleItems.length} sample schedules</p>
        </div>
        <img src={scheduleSearch} alt="Calendar, location pin, and search tools for finding a barangay schedule" className="hidden h-full min-h-44 w-full object-cover md:block" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {!loading && !error && filtered.map((item) => (
          <article key={item.barangay} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-[#8BAF93] px-3 py-1 text-xs font-bold text-[#26382A]">SCHEDULED</span><h2 className="mt-3 text-xl font-bold text-slate-950">{item.barangay}</h2></div><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EDE7F6] text-[#54358B]"><Icon name="calendar" /></span></div>
            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Date</dt><dd className="mt-1 font-semibold text-slate-900">{item.date} <span className="font-normal text-slate-500">({item.day})</span></dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Time</dt><dd className="mt-1 font-semibold text-slate-900">{item.time}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Venue</dt><dd className="mt-1 font-semibold text-slate-900">{item.venue}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Group</dt><dd className="mt-1 font-semibold text-slate-900">{item.group}</dd></div>
            </dl>
          </article>
        ))}
      </div>
      {loading && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center"><p className="font-bold text-slate-900">Loading schedules…</p><p className="mt-1 text-sm text-slate-600">Please wait while the sample schedules load.</p></div>}
      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-10 text-center"><h2 className="font-bold text-red-900">Unable to load schedules</h2><p className="mt-1 text-sm text-red-800">{error}</p></div>}
      {!loading && !error && !scheduleItems.length && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Icon name="calendar" className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900">No schedules available</h2><p className="mt-1 text-sm text-slate-600">There are no sample schedules to display.</p></div>}
      {!loading && !error && scheduleItems.length > 0 && !filtered.length && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Icon name="search" className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900">No sample schedule found</h2><p className="mt-1 text-sm text-slate-600">Check the spelling or try another barangay name.</p></div>}
      <div className="mt-6"><Notice>Schedules shown here are fictional and for demonstration only. Always confirm official information with your local office.</Notice></div>
    </>
  )
}

function LookupPage({ sampleSchedules }: { sampleSchedules: ReturnType<typeof publishedContent> }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<'idle' | 'loading' | 'found' | 'notfound' | 'invalid' | 'error'>('idle')
  const [lookupResult, setLookupResult] = useState<BeneficiaryLookupResult>(null)
  const activeRef = useRef(true)
  const requestIdRef = useRef(0)

  useEffect(() => {
    activeRef.current = true

    return () => {
      activeRef.current = false
    }
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const requestId = ++requestIdRef.current

    if (!name.trim() || !code.trim()) {
      setLookupResult(null)
      return setResult('invalid')
    }

    setLookupResult(null)
    setResult('loading')

    try {
      const record = await lookupBeneficiary({ name: name.trim(), referenceCode: code.trim() })
      if (!activeRef.current || requestId !== requestIdRef.current) return
      setLookupResult(record)
      setResult(record ? 'found' : 'notfound')
    } catch {
      if (!activeRef.current || requestId !== requestIdRef.current) return
      setResult('error')
    }
  }
  const updatedSchedule = sampleSchedules.find((item) => item.id === lookupResult?.scheduleId && item.updatedAt)
  const sampleSchedule = updatedSchedule
    ? `${formatDate(updatedSchedule.values.date)} · ${updatedSchedule.values.time}`
    : beneficiaryLookup.sampleSchedule

  return (
    <>
      <PageIntro eyebrow="Beneficiary information" title="Individual lookup" description="Use the fictional sample credentials below to see how a beneficiary record may appear." />
      <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <form onSubmit={submit} noValidate className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-950">Enter your information</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Sample: <strong>{beneficiaryLookup.name}</strong> and <strong>{beneficiaryLookup.referenceCode}</strong></p>
          <div className="mt-6 space-y-5">
            <div><label htmlFor="full-name" className="text-sm font-bold text-slate-800">Full name <span className="text-red-600">*</span></label><input id="full-name" value={name} onChange={(e) => setName(e.target.value)} className="field mt-2" placeholder="e.g., Maria Santos" autoComplete="name" aria-describedby={result === 'invalid' && !name.trim() ? 'name-error' : undefined} />{result === 'invalid' && !name.trim() && <p id="name-error" className="mt-2 text-sm font-semibold text-red-700">Please enter your full name.</p>}</div>
            <div><label htmlFor="reference" className="text-sm font-bold text-slate-800">Reference code <span className="text-red-600">*</span></label><input id="reference" value={code} onChange={(e) => setCode(e.target.value)} className="field mt-2 uppercase" placeholder="e.g., HBD-2025-0142" aria-describedby={result === 'invalid' && !code.trim() ? 'code-error' : undefined} />{result === 'invalid' && !code.trim() && <p id="code-error" className="mt-2 text-sm font-semibold text-red-700">Please enter your reference code.</p>}</div>
          </div>
          <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#54358B] px-6 py-3 font-bold text-white transition hover:bg-[#452A73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]"><Icon name="search" /> Search sample record</button>
          <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500"><Icon name="shield" className="h-4 w-4 shrink-0" /> Do not enter real personal information. This is a college prototype.</p>
        </form>
        <div aria-live="polite">
           {result === 'loading' ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center"><h2 className="font-bold text-slate-900">Checking sample record…</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Please wait while we look up the fictional record.</p></div> : result === 'error' ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><h2 className="font-bold text-red-900">Lookup unavailable</h2><p className="mt-2 text-sm leading-relaxed text-red-800">We could not check the sample record. Please try again later.</p></div> : result === 'idle' || result === 'invalid' ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-400 shadow-sm"><Icon name="id" className="h-7 w-7" /></span><h2 className="mt-4 font-bold text-slate-900">Your sample result will appear here</h2><p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">Enter both fields, then select “Search sample record.”</p></div> : result === 'found' && lookupResult ? <div className="rounded-2xl border border-[#8BAF93] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3 text-[#3F5A45]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#8BAF93] text-[#26382A]"><Icon name="check" /></span><div><p className="text-xs font-bold uppercase tracking-wide">Sample record found</p><h2 className="text-xl font-bold text-slate-950">{lookupResult.name}</h2></div></div><dl className="mt-6 space-y-4 border-t border-slate-100 pt-5"><div><dt className="text-xs font-bold uppercase text-slate-500">Reference code</dt><dd className="mt-1 font-semibold">{lookupResult.referenceCode}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Barangay</dt><dd className="mt-1 font-semibold">Barangay {lookupResult.barangay}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Sample schedule</dt><dd className="mt-1 font-semibold">{sampleSchedule}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Status</dt><dd className="mt-1"><span className="rounded-full bg-[#E3ECE5] px-3 py-1 text-xs font-bold text-[#3F5A45]">{beneficiaryLookup.status}</span></dd></div></dl></div> : <div className="rounded-2xl border border-[#D8CCE9] bg-[#F7F4FB] p-6 sm:p-8"><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#6F4FA8]"><Icon name="info" /></span><h2 className="mt-4 text-xl font-bold text-slate-950">No matching sample record</h2><p className="mt-2 text-sm leading-relaxed text-slate-700">Check the name and reference code. For this demo, use <strong>{beneficiaryLookup.name}</strong> and <strong>{beneficiaryLookup.referenceCode}</strong>.</p></div>}
        </div>
      </div>
    </>
  )
}

function RequirementsPage({ items, preparationReminders }: { items: typeof requirements; preparationReminders: string[] }) {
  return <><PageIntro eyebrow="Before you visit" title="Document checklist" description="Prepare these sample requirements ahead of time for a smoother visit to the distribution site." /><div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><figure className="overflow-hidden rounded-2xl border border-[#D8CCE9] bg-[#EDE7F6] shadow-sm"><img src={requirementsChecklist} alt="Senior beneficiary organizing an identification card and required documents" className="h-full min-h-64 w-full object-cover" /></figure><div className="grid gap-4 sm:grid-cols-2">{items.map((item, i) => <article key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EDE7F6] font-bold text-[#54358B]">{i + 1}</span><div><h2 className="font-bold text-slate-950">{item.title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p></div></article>)}</div></div><div className="mt-8 grid overflow-hidden rounded-2xl bg-[#54358B] text-white sm:grid-cols-[1fr_220px]"><div className="p-6 sm:p-8"><h2 className="flex items-center gap-3 text-xl font-bold"><Icon name="bell" /> Important reminders</h2><ul className="mt-5 grid gap-3 text-sm leading-relaxed text-[#F3EFF9]">{preparationReminders.map((x, i) => <li key={i} className="flex gap-3"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-[#C5B6DE]" />{x}</li>)}</ul></div><img src={requirementsDocuments} alt="Prepared identification card, document folder, checklist, and pen" className="hidden h-full w-full object-cover sm:block" /></div><div className="mt-6"><Notice>Requirements may vary in a real program. This checklist is fictional and does not verify or determine eligibility.</Notice></div></>
}

const processSteps = [
  { icon: 'calendar' as IconName, image: processSchedule, alt: 'Senior beneficiary checking a distribution schedule on a phone' },
  { icon: 'map' as IconName, image: processVenue, alt: 'Senior beneficiary arriving at a barangay multipurpose hall reception' },
  { icon: 'file' as IconName, image: processDocuments, alt: 'Senior beneficiary presenting documents to a service staff member' },
  { icon: 'users' as IconName, image: processGuidance, alt: 'Public-service staff member giving clear guidance to a senior beneficiary' },
  { icon: 'check' as IconName, image: processComplete, alt: 'Senior beneficiary reviewing an acknowledgement at a service counter' },
]

function ProcessPage({ steps }: { steps: typeof processInstructions }) {
  const illustratedSteps = processSteps.map((visual, index) => ({ ...visual, ...steps[index] }))
  return <><PageIntro eyebrow="What to expect" title="Distribution process guide" description="Follow these simple steps during your scheduled visit. On-site staff remain responsible for all official decisions." /><div className="relative space-y-4 lg:space-y-6"><div className="absolute bottom-8 left-6 top-8 w-0.5 bg-[#D8CCE9] lg:left-1/2 lg:-translate-x-1/2" aria-hidden="true" />{illustratedSteps.map((step, i) => <article key={i} className="relative grid gap-4 pl-16 lg:grid-cols-[1fr_64px_1fr] lg:items-center lg:gap-6 lg:pl-0"><div className={`overflow-hidden rounded-2xl border border-[#D8CCE9] bg-[#EDE7F6] shadow-sm ${i % 2 ? 'lg:order-3' : 'lg:order-1'}`}><img src={step.image} alt={step.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" /></div><div className="absolute left-0 top-5 z-10 grid h-12 w-12 place-items-center rounded-full border-4 border-[#F7F8FA] bg-[#54358B] text-white shadow-md lg:static lg:order-2 lg:h-14 lg:w-14 lg:justify-self-center"><Icon name={step.icon} /></div><div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${i % 2 ? 'lg:order-1 lg:text-right' : 'lg:order-3'}`}><p className="text-xs font-bold uppercase tracking-widest text-[#6F4FA8]">Step {i + 1}</p><h2 className="mt-2 text-xl font-bold text-slate-950">{step.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p></div></article>)}</div><div className="mt-8"><Notice>This guide does not assign a queue number, verify documents, or approve benefits. Follow authorized personnel at the site.</Notice></div></>
}

function ServicePage() {
  const counters = [{ n: '01', title: 'Reception', text: 'Schedule check and general directions' }, { n: '02', title: 'Document Review', text: 'Manual checking by authorized staff' }, { n: '03', title: 'Assistance Desk', text: 'Senior citizen, PWD, and general help' }, { n: '04', title: 'Release Area', text: 'Final on-site processing and exit' }]
  return <><PageIntro eyebrow="On-site guidance" title="Service area and counters" description="Use this sample layout to understand where to go and how to move through the venue." /><figure className="mb-6 overflow-hidden rounded-2xl border border-[#D8CCE9] bg-[#EDE7F6] shadow-sm"><img src={serviceArea} alt="Organized barangay service area with reception, assistance desk, seating, and directional guidance" className="h-56 w-full object-cover object-center sm:h-72" /></figure><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold text-slate-950">Sample service counters</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{counters.map((c) => <div key={c.n} className="rounded-xl bg-slate-50 p-5"><span className="text-3xl font-bold text-[#D8CCE9]">{c.n}</span><h3 className="mt-2 font-bold text-slate-950">{c.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{c.text}</p></div>)}</div></div><aside className="rounded-2xl bg-[#EDE7F6] p-6 sm:p-8"><Icon name="pin" className="h-8 w-8 text-[#54358B]" /><h2 className="mt-4 text-xl font-bold text-slate-950">Queue instructions</h2><ol className="mt-5 space-y-4">{['Enter through the marked reception entrance.','Have your documents ready, but keep them secure.','Use priority seating if directed by staff.','Approach a counter only when called.'].map((x, i) => <li key={x} className="flex gap-3 text-sm leading-relaxed text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[#452A73]">{i + 1}</span>{x}</li>)}</ol></aside></div><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold text-slate-950">Accessibility and safety</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Senior citizens, persons with disabilities, pregnant visitors, and those needing assistance may approach the help desk. Priority support is handled by on-site staff; this website does not assign queue positions.</p></div></>
}

function WaitingPage() {
  return <><PageIntro eyebrow="Planning your visit" title="Estimated waiting time" description="Wait estimates may be shown only when enough reliable historical information is available." /><div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="clock" className="h-8 w-8" /></span><p className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-500">Current estimate</p><h2 className="mt-2 text-3xl font-bold text-slate-950">Estimate unavailable</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">There is not enough historical sample data to provide a responsible estimate. Actual waiting times can change based on attendance and manual processing.</p><div className="mt-8 rounded-xl bg-[#F7F4FB] p-5 text-left"><h3 className="font-bold text-[#352054]">Helpful planning tips</h3><ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">{['Arrive within your assigned time window, not hours early.','Prepare documents before entering the reception line.','Allow extra time for travel and accessibility needs.'].map((x) => <li key={x} className="flex gap-2"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-[#6F4FA8]" />{x}</li>)}</ul></div></div><p className="mx-auto mt-5 max-w-2xl text-center text-sm text-slate-500">This prototype does not provide live monitoring, queue assignment, or real-time crowd counts.</p></>
}

function AnnouncementsPage({ updatedAt }: { updatedAt?: string }) {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getAnnouncements()
      .then((announcements) => {
        if (active) setItems(announcements)
      })
      .catch(() => {
        if (active) setError('Announcements are temporarily unavailable. Please try again later.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [updatedAt])

  return <><PageIntro eyebrow="Public notices" title="Announcements and reminders" description="Review recent fictional updates before visiting a distribution site." />{loading && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><p className="font-bold text-slate-900">Loading announcements…</p><p className="mt-1 text-sm text-slate-600">Please wait while the sample announcements load.</p></div>}{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center"><h2 className="font-bold text-red-900">Unable to load announcements</h2><p className="mt-1 text-sm text-red-800">{error}</p></div>}{!loading && !error && !items.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Icon name="bell" className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900">No announcements available</h2><p className="mt-1 text-sm text-slate-600">There are no sample announcements to display.</p></div>}{!loading && !error && items.length > 0 && <><div className="space-y-4">{items.map((item, i) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${i === 0 ? 'bg-[#EDE7F6] text-[#54358B]' : i === 1 ? 'bg-[#EDE7F6] text-[#54358B]' : 'bg-[#8BAF93] text-[#26382A]'}`}><Icon name={i === 0 ? 'calendar' : i === 1 ? 'bell' : 'shield'} /></span><div className="flex-1"><div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#6F4FA8]"><span>{item.type}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><time className="text-slate-500">{item.date}</time></div><h2 className="mt-2 break-words text-xl font-bold text-slate-950">{item.title}</h2><p className="mt-2 whitespace-pre-wrap break-words leading-7 text-slate-600">{item.text}</p></div></div></article>)}</div><div className="mt-6"><Notice>All names, dates, locations, and announcements on this website are fictional sample data for a BSIT-3 project.</Notice></div></>}
  </>
}

function AssistancePage() {
  return <><PageIntro eyebrow="We are here to guide you" title="Assistance and contact guidance" description="Know where to ask for help and what information to prepare before speaking with a help desk representative." /><div className="mb-6 grid overflow-hidden rounded-2xl border border-[#D8CCE9] bg-[#EDE7F6] shadow-sm sm:grid-cols-[1fr_1.2fr]"><img src={assistanceDesk} alt="Helpful public-service staff member assisting a senior beneficiary at a help desk" className="h-64 w-full object-cover sm:h-full" /><div className="flex items-center p-6 sm:p-8"><div><span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[#54358B] shadow-sm"><Icon name="help" /></span><h2 className="mt-4 text-xl font-bold text-slate-950">On-site help is available</h2><p className="mt-2 text-sm leading-relaxed text-slate-700">Approach the assistance desk for clear directions and accessibility support during your visit.</p></div></div></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#EDE7F6] text-[#54358B]"><Icon name="phone" /></span><h2 className="mt-5 font-bold text-slate-950">Sample hotline</h2><p className="mt-2 text-2xl font-bold text-[#54358B]">(02) 8000-1234</p><p className="mt-2 text-sm text-slate-600">Monday–Friday, 8:00 AM–5:00 PM</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#EDE7F6] text-[#54358B]"><Icon name="mail" /></span><h2 className="mt-5 font-bold text-slate-950">Sample email</h2><p className="mt-2 break-all text-lg font-bold text-[#54358B]">help@hbd-demo.example</p><p className="mt-2 text-sm text-slate-600">Replies within two sample working days</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#EDE7F6] text-[#54358B]"><Icon name="map" /></span><h2 className="mt-5 font-bold text-slate-950">On-site help desk</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Located near the reception entrance at each sample venue. Look for the blue Assistance Desk sign.</p></article></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl bg-[#54358B] p-6 text-white sm:p-8"><h2 className="text-xl font-bold">Prepare before contacting us</h2><ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#F3EFF9]">{['Your fictional reference code','Your listed barangay','The date and venue you are asking about','A short, clear description of your concern'].map((x) => <li key={x} className="flex gap-3"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-[#C5B6DE]" />{x}</li>)}</ul></div><div className="rounded-2xl border border-[#D8CCE9] bg-[#F7F4FB] p-6 sm:p-8"><Icon name="shield" className="h-7 w-7 text-[#54358B]" /><h2 className="mt-4 text-xl font-bold text-slate-950">Protect your information</h2><p className="mt-2 text-sm leading-relaxed text-slate-700">Do not share passwords, PINs, or banking details. Authorized help desk staff should never ask for payment to check a schedule or provide general guidance.</p></div></div></>
}

function pageFromHash(): Page | undefined {
  const hash = window.location.hash
  if (!hash || hash === '#/') return 'home'
  const page = hash.startsWith('#/') ? hash.slice(2) : undefined
  return page === 'staff' ? page : navItems.find((item) => item.id === page)?.id
}

function App() {
  const [page, setPage] = useState<Page>(() => pageFromHash() ?? 'home')
  const contentSnapshot = useSyncExternalStore(subscribeToContent, getContentSnapshot)
  const content = API_CONFIG.USE_MOCK_DATA ? readContent(contentSnapshot) : readContent(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const sync = () => {
      const next = pageFromHash()
      if (next) {
        setPage(next)
        setMenuOpen(false)
      }
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  function goTo(next: Page) {
    setPage(next)
    setMenuOpen(false)
    window.location.hash = `/${next}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updatedAt = (module: Parameters<typeof publishedContent>[0]) =>
    publishedContent(module, content).reduce<string | undefined>((latest, item) =>
      item.updatedAt && (!latest || item.updatedAt > latest) ? item.updatedAt : latest, undefined)

  const announcementUpdate = updatedAt('announcements')
  const scheduleUpdate = updatedAt('schedules')
  const requirementsUpdate = [updatedAt('requirements'), updatedAt('reminders')].sort().filter(Boolean).pop()
  const publicationTimes: Partial<Record<Page, string | undefined>> = {
    schedules: scheduleUpdate, requirements: requirementsUpdate, process: updatedAt('process'), announcements: announcementUpdate,
  }
  const publicationTime = publicationTimes[page]
  const isStaff = page === 'staff'
  const contentWidth = isStaff ? 'max-w-[100rem]' : 'max-w-[96rem]'

  const pages: Record<Page, ReactNode> = {
    home: <HomePage goTo={goTo} updatedAt={announcementUpdate} />,
    schedules: <SchedulesPage updatedAt={scheduleUpdate} />,
    lookup: <LookupPage sampleSchedules={publishedContent('schedules', content)} />,
    requirements: <RequirementsPage
      items={publishedContent('requirements', content).map(({ values }) => ({ title: values.title, text: values.text }))}
      preparationReminders={publishedContent('reminders', content).map(({ values }) => values.text)} />,
    process: <ProcessPage steps={publishedContent('process', content).map(({ values }) => ({ title: values.title, text: values.text }))} />,
    service: <ServicePage />, waiting: <WaitingPage />, announcements: <AnnouncementsPage updatedAt={announcementUpdate} />,
    assistance: <AssistancePage />, staff: <StaffArea />,
  }

  return (
    <div className="distribution-portal flex min-h-dvh flex-col bg-[#F7F8FA] text-slate-800">
      <a href="#main-content" className="sr-only z-[100] bg-white p-3 font-bold focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className={`mx-auto flex ${contentWidth} items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8`}>
          <button onClick={() => goTo('home')} className="flex min-w-0 items-center gap-2 text-left sm:gap-3" aria-label="KAAGAPAY home">
            <img src={kaagapayLogo} alt="" className="size-10 shrink-0 object-contain sm:size-12" />
            <span className="text-sm font-bold leading-tight text-[#530266] sm:text-base">KAAGAPAY</span>
          </button>
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
            {navItems.slice(0, 5).map((item) => <button key={item.id} onClick={() => goTo(item.id)} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${page === item.id ? 'bg-[#EDE7F6] text-[#452A73]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>{item.label}</button>)}
            <div className="group relative"><button className={`rounded-lg px-3 py-2 text-sm font-bold transition ${navItems.slice(5).some((x) => x.id === page) ? 'bg-[#EDE7F6] text-[#452A73]' : 'text-slate-600 hover:bg-slate-100'}`}>More</button><div className="invisible absolute right-0 top-full w-52 translate-y-1 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">{navItems.slice(5).map((item) => <button key={item.id} onClick={() => goTo(item.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-[#F7F4FB] hover:text-[#452A73]"><Icon name={item.icon} className="h-4 w-4" />{item.label}</button>)}</div></div>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {!isStaff && <a href="#/staff"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#54358B] px-3 text-sm font-bold whitespace-nowrap text-white hover:bg-[#452A73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]"
              onClick={(event) => {
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                goTo('staff')
              }}>Staff sign in</a>}
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-800 xl:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
          </div>
        </div>
        {menuOpen && <nav className="max-h-[70vh] overflow-auto border-t border-slate-200 bg-white px-4 py-3 xl:hidden" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} onClick={() => goTo(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${page === item.id ? 'bg-[#EDE7F6] text-[#452A73]' : 'text-slate-700'}`}><Icon name={item.icon} className="h-5 w-5" />{item.label}</button>)}</nav>}
      </header>

      <main id="main-content" className={`mx-auto w-full ${contentWidth} px-4 sm:px-6 lg:px-8 ${isStaff ? 'flex-1 py-10 sm:py-14' : 'py-5 sm:py-7'}`}>
        {publicationTime && <p className="mb-4 text-sm font-semibold text-[#452A73]">Published information · Last updated <time dateTime={publicationTime}>{formatTimestamp(publicationTime)}</time></p>}
        {pages[page]}
      </main>

      <footer className={`bg-[#54358B] text-[#F3EFF9] ${isStaff ? "mt-8" : "flex flex-1 flex-col"}`}>
        <div className={`mx-auto grid w-full ${contentWidth} gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8 ${isStaff ? "py-10" : "py-6 sm:py-8"}`}>
          <div><div className="flex items-center gap-3"><img src={kaagapayLogo} alt="" className="size-10 shrink-0 object-contain" /><p className="font-bold text-[#E9D5FF]">KAAGAPAY</p></div><p className="mt-4 text-sm leading-relaxed text-[#DED4ED]">A fictional BSIT-3 project prototype designed to make benefit distribution information easier to access.</p></div>
          <div><h2 className="font-bold text-white">Useful links</h2><div className="mt-4 grid gap-2 text-sm"><button onClick={() => goTo('requirements')} className="w-fit hover:text-white hover:underline">Document checklist</button><button onClick={() => goTo('process')} className="w-fit hover:text-white hover:underline">Process guide</button><button onClick={() => goTo('assistance')} className="w-fit hover:text-white hover:underline">Contact assistance</button></div></div>
          <div><h2 className="font-bold text-white">Prototype disclaimer</h2><p className="mt-4 text-sm leading-relaxed text-[#DED4ED]">This website does not determine eligibility, verify documents, assign queues, monitor live attendance, or approve benefits.</p></div>
        </div>
        <div className="mt-auto border-t border-white/10"><div className={`mx-auto flex ${contentWidth} flex-col gap-2 px-4 py-4 text-xs text-[#C9BCE0] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8`}><p>© 2025 KAAGAPAY Student Project</p><p>All data shown is fictional.</p></div></div>
      </footer>
    </div>
  )
}

export default App
