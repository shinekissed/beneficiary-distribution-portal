import { FormEvent, ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import heroWelcome from './assets/illustrations/old-lady-help.jpg'
import kaagapayLogo from './assets/kaagapay-logo.png'
import requirementsPhoto from './assets/illustrations/submit-requirements.avif'
import requirementsReminderPhoto from './assets/illustrations/requirements.jpg'
import serviceArea from './assets/illustrations/service-counter.jpg'
import assistanceDesk from './assets/illustrations/assists.jpg'
import processSchedule from './assets/illustrations/step1.jpg'
import processVenue from './assets/illustrations/step2.jpg'
import processDocuments from './assets/illustrations/step3.jpg'
import processGuidance from './assets/illustrations/step4.jpg'
import processComplete from './assets/illustrations/step5.jpg'
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

function PageIntro({ eyebrow, title, description, titleClassName = 'text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl' }: { eyebrow?: string; title: string; description: string; titleClassName?: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#6F4FA8]">{eyebrow}</p>}
      <h1 className={titleClassName}>{title}</h1>
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

  const visitSteps: { page: Page; label: string; title: string; description: string }[] = [
    { page: 'schedules', label: 'Schedules', title: 'Check your schedule', description: 'Choose your barangay to see the date and place.' },
    { page: 'requirements', label: 'Requirements', title: 'Get your papers ready', description: 'Bring your original valid ID and reference slip. Photocopies may be asked for.' },
    { page: 'process', label: 'Process Guide', title: 'Know the steps', description: 'See what happens from the gate to the last counter.' },
    { page: 'service', label: 'Service Area', title: 'Find your counter', description: 'See where to line up and where to wait.' },
    { page: 'waiting', label: 'Waiting Time', title: 'See how long it takes', description: 'Check the estimated waiting time before your visit.' },
  ]
  const outlineButton = 'inline-flex min-h-12 items-center rounded-lg border-2 border-[#503386] bg-white px-5 py-2.5 text-sm font-bold text-[#40246e] hover:bg-[#f1eaf9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#503386]'

  return (
    <>
      <section className="bg-[#503386] text-white">
        <div className="mx-auto grid max-w-[96rem] items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[2fr_1fr] lg:gap-12 lg:px-8 lg:py-16">
          <div>
            <h1 className="text-[clamp(2.1rem,3.8vw,4.25rem)] leading-[1.15] font-bold">
              Find out when and where to <span className="underline decoration-[#f9c86a] decoration-4 underline-offset-8">claim your benefits.</span>
            </h1>
            <p className="mt-6 max-w-xl leading-relaxed text-[#eee6f7]">Look up your schedule, see which documents to bring, and know what to expect when you get to the site.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button onClick={() => goTo('schedules')} className="min-h-12 rounded-md bg-white px-6 py-3 text-sm font-bold text-[#40246e] hover:bg-[#f1eaf9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Check schedules</button>
              <button onClick={() => goTo('lookup')} className="min-h-12 text-sm font-bold underline underline-offset-4 hover:text-[#f9c86a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Look up a record</button>
            </div>
          </div>
          <img src={heroWelcome} alt="An older woman receiving assistance" className="hidden aspect-[9/7] w-full rounded-lg object-cover sm:block sm:max-lg:max-w-md" />
        </div>
      </section>

      <div className="mx-auto grid max-w-[96rem] items-start gap-10 px-4 py-10 text-[#201a2d] sm:px-6 sm:py-14 lg:grid-cols-[1.55fr_1fr] lg:gap-12 lg:px-8">
        <div>
          <section aria-labelledby="visit-heading" className="rounded-lg bg-white p-5 shadow-[0_12px_36px_#3520541a] sm:p-9">
            <h2 id="visit-heading" className="text-2xl font-bold sm:text-4xl">Your visit, step by step</h2>
            <p className="mt-3 leading-relaxed text-[#433b4d]">This is the order most people follow on the day. You can open any step.</p>
            <ol role="list" className="relative mt-8 grid gap-8 before:absolute before:top-6 before:bottom-0 before:left-[1.375rem] before:w-0.5 before:bg-[#d3c3e8]">
              {visitSteps.map((step, index) => (
                <li key={step.page} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3 sm:gap-5">
                  <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-[#503386] text-xl font-bold text-white">{index + 1}</span>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-[#433b4d]">{step.description}</p>
                    <button onClick={() => goTo(step.page)} className={`mt-3 ${outlineButton}`}>Open {step.label}</button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <p className="mt-7 text-[#433b4d] sm:px-5">Already registered? <button onClick={() => goTo('lookup')} className="font-bold text-[#503386] underline underline-offset-2">Look up your record</button>.</p>
        </div>

        <aside>
          <section aria-labelledby="news-heading">
            <h2 id="news-heading" className="text-2xl font-bold sm:text-4xl">What’s new</h2>
            <div className="mt-5 divide-y divide-[#dcd2e6]" aria-live="polite">
              {announcementsLoading && <p>Loading announcements…</p>}
              {announcementsError && <p className="text-red-700">{announcementsError}</p>}
              {!announcementsLoading && !announcementsError && !announcementItems.length && <p>No announcements available.</p>}
              {!announcementsLoading && !announcementsError && announcementItems.slice(0, 2).map((item) => (
                <article key={item.id} className="py-5 first:pt-0 last:pb-0">
                  <time className="text-sm font-medium text-[#503386]">{item.date}</time>
                  <h3 className="mt-1 break-words text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 break-words leading-relaxed text-[#433b4d]">{item.text}</p>
                </article>
              ))}
            </div>
            <button onClick={() => goTo('announcements')} className={`mt-5 ${outlineButton}`}>See all announcements</button>
          </section>
          <section className="mt-9 rounded-lg bg-[#e2eae0] p-5 sm:p-7">
            <h2 className="text-xl font-bold">Not sure where to go?</h2>
            <p className="mt-2 leading-relaxed text-[#433b4d]">Ask at the help desk. Our guide tells you who to approach and what to bring.</p>
            <button onClick={() => goTo('assistance')} className={`mt-4 ${outlineButton}`}>Read the help desk guide</button>
          </section>
        </aside>
      </div>
    </>
  )
}


function SchedulesPage({ updatedAt }: { updatedAt?: string }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [scheduleItems, setScheduleItems] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getSchedules()
      .then((items) => {
        if (active) {
          setScheduleItems(items)
          setError(null)
        }
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

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const groups = [
    { label: 'All', value: '' },
    { label: 'Surnames A–L', value: 'surnamesal' },
    { label: 'Surnames M–Z', value: 'surnamesmz' },
    { label: 'Everyone', value: 'alllistedbeneficiaries' },
  ]
  const filtered = scheduleItems.filter((item) =>
    normalize(item.barangay).includes(normalize(query)) &&
    (!group || normalize(item.group) === group || (group === 'alllistedbeneficiaries' && normalize(item.group) === 'everyone')),
  )
  const agenda = new Map<string, Schedule[]>()
  for (const item of filtered) {
    const month = item.date.match(/^([a-z]+) \d{1,2},? (\d{4})$/i)?.slice(1).join(' ') ?? 'Schedule dates'
    const rows = agenda.get(month) ?? []
    rows.push(item)
    agenda.set(month, rows)
  }

  return (
    <div className="mx-auto max-w-[74rem] py-6 text-[18px] leading-relaxed text-[#1c1b22] [font-family:Inter,system-ui,sans-serif] sm:text-[20px]">
      <div className="mb-7">
        <h1 className="font-sans text-[34px] leading-[1.15] font-semibold sm:text-[50px]">When is your barangay’s turn?</h1>
        <p className="mt-3 max-w-[680px] text-[#4b4955]">Search by barangay to see the date, time, and venue. All schedules here are made up for this prototype.</p>
      </div>

      <div className="grid items-start gap-8 pb-12 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[#dedbe6] bg-white p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-sans text-[23px] leading-tight font-semibold">Narrow it down</h2>
          <label htmlFor="barangay" className="mb-1 block text-[18px] font-medium">Barangay name</label>
          <input id="barangay" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Maligaya, Mabini…" className="field mb-5 rounded-lg" />

          <p id="schedule-group" className="mb-2 text-[18px] font-medium">Group</p>
          <div role="group" aria-labelledby="schedule-group" className="flex flex-wrap gap-2">
            {groups.map(({ label, value }) => (
              <button key={label} type="button" onClick={() => setGroup(value)} aria-pressed={group === value}
                className="min-h-11 rounded-full border-2 border-[#dedbe6] px-3 font-sans text-[18px] font-medium hover:border-[#55348a] aria-pressed:border-[#55348a] aria-pressed:bg-[#55348a] aria-pressed:text-white">
                {label}
              </button>
            ))}
          </div>
        </aside>

        <section aria-label="Schedule results" aria-busy={loading} className="min-w-0">
          {!loading && !error && <p role="status" className="mb-3 text-right text-[18px] text-[#4b4955]">{filtered.length} of {scheduleItems.length} schedules</p>}
          {loading && !error && <p role="status" className="rounded-xl border border-[#dedbe6] bg-white p-6">Loading schedules…</p>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900"><h2 className="font-sans font-semibold">Unable to load schedules</h2><p>{error}</p></div>}
          {!loading && !error && !filtered.length && (
            <div className="rounded-xl border border-[#dedbe6] bg-white p-6">
              <h2 className="font-sans text-[25px] leading-tight font-semibold">{scheduleItems.length ? 'Nothing matches that' : 'No schedules available'}</h2>
              <p className="mt-1 text-[#4b4955]">{scheduleItems.length ? 'Try a shorter name, or set the group back to All.' : 'There are no sample schedules to display.'}</p>
            </div>
          )}
          {!loading && !error && Array.from(agenda, ([month, rows]) => (
            <div key={month} className="mb-6">
              <h2 className="mb-3 font-sans text-[28px] leading-tight font-semibold sm:text-[36px]">{month}</h2>
              <div tabIndex={0} role="region" aria-label={`${month} schedule table`} className="overflow-x-auto rounded-xl border border-[#dedbe6] bg-white">
                <table className="w-full min-w-[39rem] text-left text-[18px]">
                  <thead className="border-b border-[#dedbe6] bg-[#faf9fc] font-sans text-[#4b4955]">
                    <tr>{['Date', 'Barangay and venue', 'Time', 'Group'].map((label) => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[#dedbe6]">
                    {rows.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-[#fcfbfe]">
                        <td className="px-4 py-5">
                          <strong className="block font-sans text-[23px] leading-tight font-semibold">{item.date.replace(/,? \d{4}$/, '')}</strong>
                          <span className="text-[#4b4955]">{item.day}</span>
                        </td>
                        <td className="px-4 py-5">
                          <strong className="block font-sans text-[23px] leading-tight font-semibold">{item.barangay}</strong>
                          <span className="block text-[#4b4955]">{item.venue}</span>
                          <span className="mt-1 inline-block rounded bg-[#d5e4d3] px-2 text-[#26502b]">Scheduled</span>
                        </td>
                        <td className="px-4 py-5">{item.time}</td>
                        <td className="px-4 py-5 font-medium">{item.group}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="mt-5 rounded-lg bg-[#ece6f5] px-5 py-4 text-[18px]">These schedules are fictional and for demonstration only. Always confirm real information with your local office.</p>
        </section>
      </div>
    </div>
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
    <div className="mx-auto max-w-[74rem] py-6 text-[#201a2d] [font-family:Inter,system-ui,sans-serif] sm:py-10">
      <h1 className="font-sans text-[34px] leading-tight font-semibold sm:text-[46px]">Find your beneficiary record</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#595367]">Enter your full name and the reference code on your slip to find your beneficiary record.</p>

      <div className="mt-8 grid items-start gap-7 md:grid-cols-[5fr_6fr] lg:gap-10">
        <form onSubmit={submit} noValidate className="min-w-0 border-l-4 border-[#54358B] pl-4 sm:pl-6">
          <h2 className="font-sans text-xl font-semibold">Your details</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium">Full name</label>
              <input id="full-name" required value={name} onChange={(event) => setName(event.target.value)} className="field mt-1 rounded-lg" placeholder={`e.g., ${beneficiaryLookup.name}`} autoComplete="off" aria-invalid={result === 'invalid' && !name.trim()} aria-describedby={result === 'invalid' && !name.trim() ? 'name-error' : undefined} />
              {result === 'invalid' && !name.trim() && <p id="name-error" className="mt-1 text-sm text-red-700">Please enter your full name.</p>}
            </div>
            <div>
              <label htmlFor="reference" className="block text-sm font-medium">Reference code</label>
              <input id="reference" required value={code} onChange={(event) => setCode(event.target.value)} className="field mt-1 rounded-lg" placeholder={`e.g., ${beneficiaryLookup.referenceCode}`} autoComplete="off" aria-invalid={result === 'invalid' && !code.trim()} aria-describedby={result === 'invalid' && !code.trim() ? 'code-error' : undefined} />
              {result === 'invalid' && !code.trim() && <p id="code-error" className="mt-1 text-sm text-red-700">Please enter your reference code.</p>}
            </div>
          </div>

          <button type="submit" className="mt-4 min-h-12 w-full rounded-lg bg-[#54358B] px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-[#452A73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]">Search record</button>
          <p className="mt-3 text-sm leading-relaxed text-[#595367]">Please don’t type real personal information. This is a college prototype.</p>
        </form>

        <section aria-live="polite" aria-label="Record lookup result" className="min-h-64 rounded-xl border border-[#dedbe6] bg-white p-5 sm:p-7">
          {(result === 'idle' || result === 'invalid') && (
            <>
              <h2 className="font-sans text-xl font-semibold">Your record will show up here</h2>
              <p className="mt-2 text-sm text-[#595367]">Fill in both boxes and press Search record.</p>
            </>
          )}
          {result === 'loading' && <h2 className="font-sans text-xl font-semibold">Looking up your record…</h2>}
          {result === 'error' && (
            <>
              <h2 className="font-sans text-xl font-semibold text-red-900">Lookup unavailable</h2>
              <p className="mt-2 text-sm text-red-800">We could not look up your record. Please try again later.</p>
            </>
          )}
          {result === 'notfound' && (
            <>
              <h2 className="font-sans text-xl font-semibold">No matching record found</h2>
              <p className="mt-2 text-sm text-[#595367]">Check that your full name and reference code match the details on your slip.</p>
            </>
          )}
          {result === 'found' && lookupResult && (
            <>
              <p className="text-sm font-bold text-[#3F5A45]">RECORD FOUND</p>
              <h2 className="mt-1 font-sans text-xl font-semibold">{lookupResult.name}</h2>
              <dl className="mt-4 grid gap-4 border-t border-[#dedbe6] pt-4 sm:grid-cols-2">
                <div><dt className="text-sm font-bold text-[#595367]">Reference code</dt><dd className="break-words">{lookupResult.referenceCode}</dd></div>
                <div><dt className="text-sm font-bold text-[#595367]">Barangay</dt><dd>Barangay {lookupResult.barangay}</dd></div>
                <div><dt className="text-sm font-bold text-[#595367]">Distribution schedule</dt><dd>{sampleSchedule}</dd></div>
                <div><dt className="text-sm font-bold text-[#595367]">Status</dt><dd>{beneficiaryLookup.status}</dd></div>
              </dl>
            </>
          )}
        </section>
      </div>
    </div>
  )
}


function RequirementsPage({ items, preparationReminders }: { items: typeof requirements; preparationReminders: string[] }) {
  return <><PageIntro title="Document checklist" titleClassName="font-sans text-[34px] leading-tight font-semibold text-[#201a2d] sm:text-[46px]" description="Prepare these sample requirements ahead of time for a smoother visit to the distribution site." /><div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><figure className="overflow-hidden rounded-2xl border border-[#D8CCE9] bg-[#EDE7F6] shadow-sm"><img src={requirementsPhoto} alt="Application forms, a pen, and a wallet" className="h-full min-h-64 w-full object-cover" /></figure><div className="grid gap-4 sm:grid-cols-2">{items.map((item, i) => <article key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EDE7F6] font-bold text-[#54358B]">{i + 1}</span><div><h2 className="font-bold text-slate-950">{item.title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p></div></article>)}</div></div><div className="mt-8 grid overflow-hidden rounded-2xl bg-[#54358B] text-white sm:grid-cols-[1fr_220px]"><div className="p-6 sm:p-8"><h2 className="flex items-center gap-3 text-xl font-bold"><Icon name="bell" /> Important reminders</h2><ul className="mt-5 grid gap-3 text-sm leading-relaxed text-[#F3EFF9]">{preparationReminders.map((x, i) => <li key={i} className="flex gap-3"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-[#C5B6DE]" />{x}</li>)}</ul></div><img src={requirementsReminderPhoto} alt="" className="hidden h-full w-full object-cover sm:block" /></div><div className="mt-6"><Notice>Requirements may vary in a real program. This checklist is fictional and does not verify or determine eligibility.</Notice></div></>
}

const processSteps = [
  { icon: 'calendar' as IconName, image: processSchedule, alt: 'Senior beneficiary checking a distribution schedule on a phone' },
  { icon: 'map' as IconName, image: processVenue, alt: 'Visitors and staff at a busy distribution venue' },
  { icon: 'file' as IconName, image: processDocuments, alt: 'A visitor and staff member exchanging documents at a service counter' },
  { icon: 'users' as IconName, image: processGuidance, alt: 'Visitors presenting documents at a distribution desk' },
  { icon: 'check' as IconName, image: processComplete, alt: 'A beneficiary counting cash at a distribution counter' },
]

function ProcessPage({ steps }: { steps: typeof processInstructions }) {
  const illustratedSteps = processSteps.map((visual, index) => ({ ...visual, ...steps[index] }))
  return <><PageIntro title="Distribution process guide" titleClassName="font-sans text-[34px] leading-tight font-semibold text-[#201a2d] sm:text-[46px]" description="Follow these simple steps during your scheduled visit. On-site staff remain responsible for all official decisions." /><div className="relative mt-8 space-y-4 sm:mt-10 lg:space-y-6"><div className="absolute bottom-8 left-6 top-8 w-0.5 bg-[#D8CCE9] lg:left-1/2 lg:-translate-x-1/2" aria-hidden="true" />{illustratedSteps.map((step, i) => <article key={i} className="relative grid gap-4 pl-16 lg:grid-cols-[1fr_64px_1fr] lg:items-center lg:gap-6 lg:pl-0"><div className={`overflow-hidden rounded-2xl border border-[#D8CCE9] bg-[#EDE7F6] shadow-sm ${i % 2 ? 'lg:order-3' : 'lg:order-1'}`}><img src={step.image} alt={step.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" /></div><div className="absolute left-0 top-5 z-10 grid h-12 w-12 place-items-center rounded-full border-4 border-[#F7F8FA] bg-[#54358B] text-white shadow-md lg:static lg:order-2 lg:h-14 lg:w-14 lg:justify-self-center"><Icon name={step.icon} /></div><div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${i % 2 ? 'lg:order-1 lg:text-right' : 'lg:order-3'}`}><p className="text-xs font-bold uppercase tracking-widest text-[#6F4FA8]">Step {i + 1}</p><h2 className="mt-2 text-xl font-bold text-slate-950">{step.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p></div></article>)}</div><div className="mt-8"><Notice>This guide does not assign a queue number, verify documents, or approve benefits. Follow authorized personnel at the site.</Notice></div></>
}

function ServicePage() {
  const counters = [
    { title: 'Reception', text: 'Schedule check and general directions' },
    { title: 'Document review', text: 'Manual checking by authorized staff' },
    { title: 'Assistance desk', text: 'Help for seniors, persons with disabilities, and anyone needing assistance' },
    { title: 'Release area', text: 'Final on-site processing and exit' },
  ]
  const arrivalInstructions = [
    'Enter through the marked reception entrance.',
    'Have your documents ready, but keep them secure.',
    'Use priority seating if directed by staff.',
    'Approach a counter only when called.',
  ]

  return (
    <div className="mx-auto max-w-[74rem] space-y-10 pb-10 pt-6 text-[#201a2d] [font-family:Inter,system-ui,sans-serif] sm:space-y-14 sm:pt-10">
      <div className="grid items-center gap-6 md:grid-cols-[4fr_5fr] md:gap-10">
        <div>
          <h1 className="max-w-md font-sans text-[34px] leading-tight font-semibold sm:text-[46px]">Service area and counters</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#595367]">A sample layout to show where to go and how to move through the venue.</p>
        </div>
        <img src={serviceArea} alt="A visitor signs paperwork at a distribution counter while others wait" className="aspect-[2.35] w-full rounded-xl object-cover" />
      </div>

      <section aria-labelledby="venue-path">
        <h2 id="venue-path" className="font-sans text-[28px] leading-tight font-semibold sm:text-[34px]">Your path through the venue</h2>
        <p className="mt-1 text-sm text-[#595367]">Four sample counters, in the order you’ll usually visit them.</p>
        <ol role="list" className="mt-6 grid gap-5 md:grid-cols-4 md:gap-0">
          {counters.map((counter, index) => (
            <li key={counter.title} className="group grid grid-cols-[2.5rem_1fr] gap-x-3 md:block">
              <div className="flex items-center md:mb-3">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#54358B] font-sans text-sm font-semibold text-white">{index + 1}</span>
                <span aria-hidden="true" className="mx-1 hidden flex-1 border-t-2 border-dashed border-[#c7b5e1] md:block md:group-last:hidden" />
              </div>
              <div className="md:pr-5">
                <h3 className="font-sans text-lg leading-tight font-semibold">{counter.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#595367]">{counter.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid items-start gap-7 md:grid-cols-2 md:gap-10">
        <section aria-labelledby="venue-arrival">
          <h2 id="venue-arrival" className="font-sans text-[28px] leading-tight font-semibold sm:text-[34px]">When you arrive</h2>
          <ol role="list" className="mt-4 divide-y divide-[#dedbe6] border-t-2 border-[#595367]">
            {arrivalInstructions.map((instruction, index) => (
              <li key={instruction} className="flex gap-4 py-3 text-sm last:border-b last:border-[#dedbe6]">
                <span aria-hidden="true" className="shrink-0 font-semibold text-[#54358B]">{index + 1}</span>
                {instruction}
              </li>
            ))}
          </ol>
        </section>
        <aside className="rounded-xl bg-[#ece6f5] p-5 sm:p-7" aria-labelledby="venue-accessibility">
          <h2 id="venue-accessibility" className="font-sans text-xl leading-tight font-semibold">Accessibility and safety</h2>
          <p className="mt-2 text-sm leading-relaxed">Senior citizens, persons with disabilities, pregnant visitors, and anyone needing assistance may go to the help desk. On-site staff handle priority support.</p>
          <p className="mt-3 text-sm text-[#54358B]">This website does not assign queue positions.</p>
        </aside>
      </div>
    </div>
  )
}


function WaitingPage() {
  const tips = [
    { title: 'Come in your time window', text: 'Turning up hours early rarely gets you seen sooner. Aim for the slot you were given.' },
    { title: 'Get your documents ready', text: 'Organize them before you join the reception line so they’re easy to find at the counter.' },
    { title: 'Leave extra time to get here', text: 'Allow extra time for travel, especially if you need step-free access or other support.' },
  ]

  return (
    <div className="mx-auto max-w-[69rem] py-6 text-[18px] leading-relaxed text-[#465166] [font-family:Inter,system-ui,sans-serif] sm:py-10 sm:text-[20px]">
      <div className="max-w-3xl">
        <h1 className="font-sans text-[34px] leading-[1.15] font-semibold text-[#100f20] sm:text-[50px]">How long will I wait?</h1>
        <p className="mt-5">We show a wait time when we have enough data from past visits to make a reliable estimate.</p>
      </div>

      <div className="mt-10 grid items-start gap-9 md:grid-cols-[5fr_6fr] lg:mt-14 lg:gap-14">
        <section aria-labelledby="wait-status" className="rounded-[1.25rem] border border-slate-200 bg-white p-6 lg:p-9">
          <span className="grid size-14 place-items-center rounded-xl bg-[#ebeff4] text-[#596984]"><Icon name="clock" className="size-7" /></span>
          <p className="mt-6 text-[18px] font-medium text-[#596984]">Right now</p>
          <h2 id="wait-status" className="mt-2 font-sans text-[28px] leading-tight font-semibold text-[#100f20] sm:text-[36px]">We don’t have a wait time yet</h2>
          <p className="mt-5">There haven’t been enough recorded visits to give a reliable number.</p>
          <p className="mt-5">Actual waits depend on how many people arrive and how long staff take to process each visit.</p>
        </section>

        <section aria-labelledby="wait-tips">
          <h2 id="wait-tips" className="font-sans text-[28px] leading-tight font-semibold text-[#301c60] sm:text-[36px]">Make your visit easier</h2>
          <p className="mt-3">A few things that help, whatever the queue looks like.</p>
          <ol role="list" className="mt-6 divide-y divide-[#ded6e7] border-y border-[#ded6e7]">
            {tips.map((tip, index) => (
              <li key={tip.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 sm:gap-6 sm:py-7">
                <span aria-hidden="true" className="font-sans text-[32px] leading-tight font-semibold text-[#6a469f]">{index + 1}</span>
                <div>
                  <h3 className="font-sans text-[24px] leading-tight font-semibold text-[#100f20]">{tip.title}</h3>
                  <p className="mt-2">{tip.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="mt-10 text-[18px] text-[#596984] sm:mt-14">Wait estimates are based on past visits and may differ from what you experience on the day.</p>
    </div>
  )
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

  return (
    <div className="max-w-[74rem] py-6 text-[#201a2d] [font-family:Inter,system-ui,sans-serif] sm:py-10">
      <h1 className="font-sans text-[34px] leading-tight font-semibold sm:text-[46px]">Announcements and reminders</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">Please read these before you go to a distribution site.</p>

      <div className="mt-8 space-y-4" aria-live="polite">
        {loading && <p className="text-sm text-slate-600">Loading announcements…</p>}
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</p>}
        {!loading && !error && !items.length && <p className="text-sm text-slate-600">No announcements available.</p>}
        {!loading && !error && items.map((item) => (
          <article key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] sm:gap-6 sm:p-7">
            <div className="text-sm">
              <p className={`font-semibold ${item.type.toLowerCase() === 'advisory' ? 'text-[#286044]' : 'text-[#6a469f]'}`}>{item.type}</p>
              <time className="mt-1 block text-slate-600">{item.date}</time>
            </div>
            <div className="min-w-0">
              <h2 className="break-words font-sans text-xl leading-tight font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}


function AssistancePage() {
  const preparationItems = [
    'Your fictional reference code',
    'Your listed barangay',
    'The date and venue you are asking about',
    'A short, clear description of your concern',
  ]

  return (
    <div className="mx-auto max-w-[74rem] py-6 text-[#201a2d] [font-family:Inter,system-ui,sans-serif] sm:py-10">
      <div className="grid items-center gap-7 md:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <h1 className="max-w-xl font-sans text-[34px] leading-tight font-semibold sm:text-[46px]">Assistance and contact guidance</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600">Know where to ask for help and what information to prepare before speaking with a help desk representative.</p>

          <dl className="mt-7 divide-y divide-[#ded6e7] border-t-2 border-b border-t-[#54358B] border-b-[#ded6e7] text-sm">
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="font-semibold">Call</dt>
              <dd>
                <p className="font-sans text-2xl leading-tight font-semibold text-[#54358B] sm:text-3xl">(02) 8000-1234</p>
                <p className="mt-1 text-slate-600">Sample hotline, Monday–Friday, 8:00 AM–5:00 PM</p>
              </dd>
            </div>
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="font-semibold">Email</dt>
              <dd>
                <p className="break-words font-sans text-lg font-semibold text-[#54358B] underline underline-offset-4">help@hbd-demo.example</p>
                <p className="mt-1 text-slate-600">Sample address. Replies within two sample working days.</p>
              </dd>
            </div>
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="font-semibold">Visit</dt>
              <dd className="leading-relaxed text-slate-600">The help desk is near the reception entrance at each sample venue. <strong className="text-[#201a2d]">Look for the blue Assistance Desk sign.</strong> Staff there can give you clear directions and accessibility support.</dd>
            </div>
          </dl>
        </div>

        <img src={assistanceDesk} alt="A staff member helps older visitors with paperwork at a table" className="aspect-[8/9] w-full max-w-sm rounded-xl object-cover md:max-w-none" />
      </div>

      <div className="mt-9 grid gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-[#ded6e7] bg-white p-5 sm:p-7">
          <h2 className="font-sans text-2xl leading-tight font-semibold sm:text-[30px]">Prepare before contacting us</h2>
          <ul role="list" className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
            {preparationItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1.5 size-3.5 shrink-0 border border-slate-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="rounded-xl bg-[#ece6f5] p-5 text-sm leading-relaxed sm:p-7">
          <h2 className="font-sans text-lg leading-tight font-semibold text-[#352054]">Protect your information</h2>
          <p className="mt-3"><strong>Do not share passwords, PINs, or banking details.</strong> Authorized help desk staff should never ask for payment to check a schedule or provide general guidance.</p>
        </aside>
      </div>
    </div>
  )
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
    <div className={`distribution-portal flex min-h-dvh flex-col bg-[#F7F8FA] text-slate-800 ${page === 'home' ? 'portal-home' : ''}`}>
      <a href="#main-content" className="sr-only z-[100] bg-white p-3 font-bold focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>
      <header className="portal-header sticky top-0 z-50 bg-[#f4f5f7]">
        <div className={`mx-auto flex max-w-[96rem] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8`}>
          <button onClick={() => goTo('home')} className="flex min-w-0 items-center gap-2 text-left sm:gap-3" aria-label="KAAGAPAY home">
            <img src={kaagapayLogo} alt="" className="size-10 shrink-0 object-contain sm:size-12" />
            <span className="text-sm font-bold leading-tight text-[#530266] sm:text-base">KAAGAPAY</span>
          </button>
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
            {navItems.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => goTo(item.id)} aria-current={page === item.id ? 'page' : undefined}
                className="rounded-lg px-3 py-2 text-sm text-[#503386] underline-offset-8 transition hover:underline aria-[current=page]:underline aria-[current=page]:decoration-2">
                {item.label}
              </button>
            ))}
            <div className="group relative"><button className={`rounded-lg px-3 py-2 text-sm font-bold transition ${navItems.slice(5).some((x) => x.id === page) ? 'text-[#503386] underline decoration-2 underline-offset-8' : 'text-slate-600 hover:text-[#503386]'}`}>More</button><div className="invisible absolute left-0 top-full w-max min-w-56 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">{navItems.slice(5).map((item) => <button key={item.id} onClick={() => goTo(item.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-[#F7F4FB] hover:text-[#452A73]"><Icon name={item.icon} className="size-4 shrink-0" />{item.label}</button>)}</div></div>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {!isStaff && <a href="#/staff"
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[#54358B] px-3 text-sm font-bold text-white hover:bg-[#452A73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]"
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

      <main id="main-content" className={page === 'home' ? 'w-full flex-1 bg-[#f4f5f7]' : `mx-auto w-full ${contentWidth} px-4 sm:px-6 lg:px-8 ${isStaff ? 'flex-1 py-10 sm:py-14' : page === 'process' || page === 'requirements' ? 'flex-1 pt-11 pb-5 sm:pt-[4.25rem] sm:pb-7' : 'flex-1 py-5 sm:py-7'}`}>
        {publicationTime && <p className="mb-4 text-sm font-semibold text-[#452A73]">Published information · Last updated <time dateTime={publicationTime}>{formatTimestamp(publicationTime)}</time></p>}
        {pages[page]}
      </main>

      <footer className="shrink-0 bg-[#54358B] font-sans text-base text-[#F3EFF9]">
        <div className={`mx-auto grid w-full ${contentWidth} gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8 ${isStaff ? "py-10" : "py-6 sm:py-8"}`}>
          <div><div className="flex items-center gap-3"><img src={kaagapayLogo} alt="" className="size-10 shrink-0 object-contain" /><p className="font-bold text-[#E9D5FF]">KAAGAPAY</p></div><p className="mt-4 text-sm leading-relaxed text-[#DED4ED]">A fictional project prototype designed to make benefit distribution information easier to access.</p></div>
          <div><h2 className="font-bold text-white">Useful links</h2><div className="mt-4 grid gap-2 text-sm"><button onClick={() => goTo('requirements')} className="w-fit hover:text-white hover:underline">Document checklist</button><button onClick={() => goTo('process')} className="w-fit hover:text-white hover:underline">Process guide</button><button onClick={() => goTo('assistance')} className="w-fit hover:text-white hover:underline">Contact assistance</button></div></div>
          <div><h2 className="font-bold text-white">Prototype disclaimer</h2><p className="mt-4 text-sm leading-relaxed text-[#DED4ED]">This website does not determine eligibility, verify documents, assign queues, monitor live attendance, or approve benefits.</p></div>
        </div>
        <div className="mt-auto border-t border-white/10"><div className={`mx-auto flex ${contentWidth} flex-col gap-2 px-4 py-4 text-xs text-[#C9BCE0] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8`}><p>© 2026 KAAGAPAY </p><p>All data shown is fictional.</p></div></div>
      </footer>
    </div>
  )
}

export default App
