import { createPortal } from 'react-dom'
import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { API_CONFIG } from './api/config'
import {
  formatDate, formatTimestamp, getContentSnapshot, readContent, subscribeToContent, updateContent,
  type Entry, type Module, type Role,
} from './data/staffContent'

type Field = { name: string; label: string; type?: 'date' | 'number' | 'textarea'; optional?: boolean }

const modules: Record<Module, { label: string; title: string; add?: string; print?: string; fields: Field[] }> = {
  schedules: {
    label: 'Distribution schedules', title: 'barangay', add: 'Add a schedule', print: 'schedule boards and printed schedules',
    fields: [
      { name: 'barangay', label: 'Barangay' }, { name: 'date', label: 'Distribution date', type: 'date' },
      { name: 'time', label: 'Time window (e.g., 8:00 AM to 12:00 PM)' },
      { name: 'venue', label: 'Place' }, { name: 'group', label: 'Who should come' },
      { name: 'aidType', label: 'Type of aid', optional: true },
      { name: 'notes', label: 'Note for beneficiaries', type: 'textarea', optional: true },
    ],
  },
  requirements: {
    label: 'Document requirements', title: 'title', print: 'requirements checklists',
    fields: [{ name: 'title', label: 'Document name' }, { name: 'text', label: 'Preparation instructions', type: 'textarea' }],
  },
  reminders: {
    label: 'Preparation reminders', title: 'text', print: 'requirements checklists and printed reminders',
    fields: [{ name: 'text', label: 'Reminder', type: 'textarea' }],
  },
  announcements: {
    label: 'Announcements', title: 'title', add: 'Add announcement', print: 'physical notices and announcement boards',
    fields: [
      { name: 'title', label: 'Title' }, { name: 'type', label: 'Category (e.g., Schedule update or Reminder)' },
      { name: 'date', label: 'Announcement date', type: 'date' }, { name: 'text', label: 'Message', type: 'textarea' },
    ],
  },
  process: {
    label: 'Process instructions', title: 'title', print: 'printed process guides',
    fields: [{ name: 'title', label: 'Step title' }, { name: 'text', label: 'Instructions', type: 'textarea' }],
  },
  history: {
    label: 'Historical records', title: 'barangay', add: 'Add historical record',
    fields: [
      { name: 'barangay', label: 'Barangay' }, { name: 'date', label: 'Past distribution date', type: 'date' },
      { name: 'venue', label: 'Venue' }, { name: 'minutes', label: 'Recorded wait in minutes (optional)', type: 'number', optional: true },
      { name: 'notes', label: 'Record notes', type: 'textarea' },
    ],
  },
}

const moduleKeys = Object.keys(modules) as Module[]
const primary = 'min-h-11 rounded-xl bg-[#54358B] px-4 py-2 font-bold text-white hover:bg-[#452A73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]'
const secondary = 'min-h-11 rounded-xl border border-[#D8CCE9] bg-white px-4 py-2 font-bold text-[#452A73] hover:bg-[#F7F4FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#54358B]'
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'

function StaffLogin({ onLogin }: { onLogin: (role: Role) => void }) {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const username = String(data.get('username')).trim().toLowerCase()
    if ((username === 'editor' || username === 'approver') && data.get('password') === 'hci-demo') {
      onLogin(username)
    } else {
      setError('The username or password is incorrect. Please try again.')
    }
  }

  return (
    <section aria-labelledby="staff-sign-in" className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <header className="mb-7">
        <h1 id="staff-sign-in" className="text-[1.75rem] leading-tight font-bold text-[#352054] sm:text-[2rem]">Staff sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Sign in to manage schedules, requirements, announcements, and process instructions.
        </p>
      </header>
      <div className="min-w-0">
        <form className="space-y-4" onSubmit={login} onChange={() => { if (error) setError('') }}>
          <div>
            <label htmlFor="staff-username" className="block text-base font-semibold text-slate-900">Username</label>
            <input id="staff-username" className="field mt-2 rounded-lg text-lg" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
          </div>
          <div>
            <label htmlFor="staff-password" className="block text-base font-semibold text-slate-900">Password</label>
            <div className="relative mt-2">
              <input id="staff-password" className="field rounded-lg pr-[4.5rem] text-lg" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required />
              <button type="button" aria-controls="staff-password" aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 min-w-14 rounded-lg px-3 text-base font-semibold text-[#452A73] hover:underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#54358B]"
                onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          {error && <p role="alert" className="text-base leading-relaxed text-red-800">{error}</p>}
          <button type="submit" className={`w-full text-lg ${primary}`}>Sign in</button>
        </form>
      </div>
    </section>
  )
}

function statusFor(module: Module, entry: Entry) {
  return entry.revision?.stage ?? (module === 'history' ? 'Staff record' : 'Published')
}

function ContentCard({ module, entry, role, onEdit, onUpdate }: {
  module: Module; entry: Entry; role: Role; onEdit: () => void;
  onUpdate: (command: Parameters<typeof updateContent>[3]) => boolean;
}) {
  const config = modules[module]
  const { published, revision } = entry
  const current = revision ?? published
  const status = statusFor(module, entry)
  const reviewable = role === 'approver' && (status === 'Pending review' || status === 'Approved')
  const [returning, setReturning] = useState(false)
  const [publishing, setPublishing] = useState(false)

  function showValues(values: NonNullable<Entry['published']>['values']) {
    return (
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {config.fields.map(({ name, label, type }) => (
          <div key={name} className={type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <dt className="text-sm font-semibold text-slate-600">{label}</dt>
            <dd className="whitespace-pre-wrap break-words">{values[name] ? (type === 'date' ? formatDate(values[name]) : values[name]) : 'Unavailable'}</dd>
          </div>
        ))}
      </dl>
    )
  }

  if (!current) return null
  return (
    <article className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-lg font-bold text-slate-950">
          {module === 'process' && `Step ${entry.id} · `}{current.values[config.title]}
        </h3>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${status === 'Published' || status === 'Approved' ? 'bg-[#E3ECE5] text-[#304935]' : 'bg-[#EDE7F6] text-[#452A73]'}`}>{status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{current.updatedAt ? <>Last updated <time dateTime={current.updatedAt}>{formatTimestamp(current.updatedAt)}</time></> : 'Original sample · update time unavailable'}</p>
      {revision && <p className="mt-1 text-sm font-semibold text-slate-700">{published ? 'An earlier version is still public.' : 'This item is awaiting its first publication.'}</p>}
      {showValues(current.values)}
      {revision && published && (
        <details className="mt-4 rounded-xl bg-slate-50 p-3">
          <summary className="cursor-pointer font-semibold text-[#452A73]">View currently published version</summary>
          {published.updatedAt && <p className="mt-2 text-sm text-slate-600">Published <time dateTime={published.updatedAt}>{formatTimestamp(published.updatedAt)}</time></p>}
          {showValues(published.values)}
        </details>
      )}
      {revision?.note && <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-amber-50 p-3 text-amber-950"><strong>Correction requested</strong><br />{revision.note}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {(!revision || status === 'Draft' || status === 'Returned for correction') && <button className={secondary} onClick={onEdit}>{revision ? 'Edit working copy' : 'Edit'}</button>}
        {reviewable && !returning && !publishing && <>
          <button className={secondary} onClick={() => setReturning(true)}>Return for correction</button>
          {status === 'Pending review' && <button className={primary} onClick={() => onUpdate({ action: 'approve' })}>Approve</button>}
          {status === 'Approved' && <button className={primary} onClick={() => setPublishing(true)}>Publish update</button>}
        </>}
      </div>
      {reviewable && returning && <form className="mt-3 space-y-3" onSubmit={(event) => {
        event.preventDefault()
        const note = String(new FormData(event.currentTarget).get('note'))
        if (onUpdate({ action: 'return', note })) setReturning(false)
      }}>
        <label className="block font-semibold">What should the editor correct?<textarea name="note" className="field mt-1" required maxLength={500} /></label>
        <div className="flex flex-wrap gap-2">
          <button className={primary}>Send back to editor</button>
          <button type="button" className={secondary} onClick={() => setReturning(false)}>Cancel</button>
        </div>
      </form>}
      {reviewable && status === 'Approved' && publishing && <div className="mt-3 rounded-xl bg-[#F7F4FB] p-4">
        <p>This update will become visible on the beneficiary website in this browser.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={primary} onClick={() => { if (onUpdate({ action: 'publish' })) setPublishing(false) }}>Confirm publication</button>
          <button className={secondary} onClick={() => setPublishing(false)}>Cancel</button>
        </div>
      </div>}
    </article>
  )
}

function StaffDashboard({ role, onLogout, headerTarget }: { role: Role; onLogout: () => void; headerTarget: HTMLDivElement | null }) {
  const snapshot = useSyncExternalStore(subscribeToContent, getContentSnapshot)
  const content = readContent(snapshot)
  const [module, setModule] = useState<Module | null>(null)
  const [editing, setEditing] = useState<{ entry?: Entry } | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  function navigate(next: Module | null) {
    setEditing(null)
    setFeedback(null)
    setModule(next)
    heading.current?.focus()
  }

  function save(next: Module, entry: Entry | undefined, command: Parameters<typeof updateContent>[3]) {
    try {
      updateContent(next, role, entry, command)
      const messages = {
        save: next === 'history' ? 'Historical record saved.' : command.action === 'save' && command.submit ? 'Submitted for review.' : 'Draft saved.',
        return: 'Returned to the editor for correction.',
        approve: 'Approved and ready to publish.',
        publish: `Published to the beneficiary website. Please update the corresponding ${modules[next].print}.`,
      }
      setFeedback({ text: messages[command.action] })
      return true
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : 'The change could not be saved.', error: true })
      return false
    }
  }

  const config = module ? modules[module] : null
  const items = module ? content[module] : []
  const reviewQueue = moduleKeys.flatMap((key) => content[key].flatMap((entry) =>
    entry.revision?.stage === 'Pending review' || entry.revision?.stage === 'Approved'
      ? [{ key, entry, revision: entry.revision }] : []))

  return (
    <div className="mx-auto grid max-w-[77.5rem] min-w-0 gap-7">
      {headerTarget && createPortal(<div className="staff-header-controls flex min-w-0 flex-1 items-center justify-end gap-2">
        <nav aria-label="Staff modules" className="flex items-center gap-1 md:absolute md:left-1/2 md:-translate-x-1/2">
          {([null, 'schedules', 'requirements', 'reminders'] as const).map((key) => (
            <button key={key ?? 'dashboard'} aria-current={key === module ? 'page' : undefined}
              className={`hidden min-h-11 whitespace-nowrap rounded-lg px-3 py-2 text-[#503386] underline-offset-8 hover:underline aria-[current=page]:underline aria-[current=page]:decoration-2 ${key === 'requirements' || key === 'reminders' ? 'lg:block' : 'md:block'}`}
              onClick={() => navigate(key)}>{key === 'schedules' ? 'Schedules' : key ? modules[key].label : 'Dashboard'}</button>
          ))}
          <details className="relative">
            <summary className={`flex min-h-11 cursor-pointer list-none items-center rounded-lg px-3 py-2 text-[18px] font-medium text-slate-600 underline-offset-8 hover:text-[#503386] [&::-webkit-details-marker]:hidden ${module === 'requirements' || module === 'reminders' ? 'text-[#503386] underline decoration-2 lg:no-underline' : module && module !== 'schedules' ? 'text-[#503386] underline decoration-2' : ''}`}>More</summary>
            <div className="absolute right-0 top-full z-10 grid max-h-[70dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg max-md:-right-16">
              {[null, ...moduleKeys].map((key) => (
                <button key={key ?? 'dashboard'} aria-current={key === module ? 'page' : undefined}
                  className={`min-h-11 rounded-lg px-3 py-2 text-left hover:bg-[#F7F4FB] aria-[current=page]:bg-[#EDE7F6] aria-[current=page]:text-[#452A73] ${key === null || key === 'schedules' ? 'md:hidden' : key === 'requirements' || key === 'reminders' ? 'lg:hidden' : ''}`}
                  onClick={(event) => {
                    const details = event.currentTarget.closest('details')
                    details?.querySelector('summary')?.focus()
                    details?.removeAttribute('open')
                    navigate(key)
                  }}>{key === 'schedules' ? 'Schedules' : key === 'history' ? 'Records' : key ? modules[key].label : 'Dashboard'}</button>
              ))}
            </div>
          </details>
        </nav>
        <button className={`shrink-0 whitespace-nowrap ${secondary}`} onClick={onLogout}>Sign out</button>
      </div>, headerTarget)}

      <section className="min-w-0 space-y-5" aria-labelledby="staff-heading">
        {module === 'schedules' && editing && <button className="font-semibold text-[#452A73] underline underline-offset-4" onClick={() => navigate('schedules')}>Back to the list</button>}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id="staff-heading" ref={heading} tabIndex={-1} className="text-3xl font-bold tracking-tight text-slate-950">{config?.label ?? 'Staff dashboard'}</h1>
            <p className="mt-2 max-w-2xl text-slate-700">{module === 'schedules' ? 'Published schedules appear on the public Schedules page. Save changes as a working copy, then send them for review.' : module === 'history' ? 'Staff-only historical records. The public estimate stays unavailable until reliable historical information exists.' : config ? 'Review the sample information here before publishing updates.' : 'Manage distribution information and check what is ready for review or publication.'}</p>
          </div>
          {config?.add && !editing && <button className={primary} onClick={() => { setEditing({}); setFeedback(null) }}>{config.add}</button>}
        </div>
        <div role="status">{feedback && !feedback.error && <p className="rounded-xl bg-[#E3ECE5] p-4 font-semibold text-[#304935]">{feedback.text}</p>}</div>
        {feedback?.error && <p role="alert" className="rounded-xl bg-red-50 p-4 font-semibold text-red-800">{feedback.text}</p>}
        {!module && <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {moduleKeys.map((key) => {
              const entries = content[key]
              const published = entries.filter((entry) => entry.published).length
              return <button key={key} className={`text-left hover:border-[#8B6FC0] ${card}`} onClick={() => navigate(key)}>
                <span className="block font-bold text-[#452A73]">{modules[key].label}</span>
                <span className="mt-2 block text-sm text-slate-700">{published} {key === 'history' ? 'staff records' : `published · ${entries.filter((entry) => entry.revision).length} working copies`}</span>
              </button>
            })}
          </div>
          <div className={card}>
            <h2 className="text-lg font-bold">Review and publication</h2>
            {reviewQueue.length === 0 ? <p className="mt-2 text-slate-600">No updates are waiting for review or publication.</p> :
              <ul className="mt-3 divide-y divide-slate-200">
                {reviewQueue.map(({ key, entry, revision }) => <li key={`${key}-${entry.id}`} className="py-2">
                  <button className="min-h-11 text-left font-bold text-[#452A73] underline" onClick={() => navigate(key)}>{revision.values[modules[key].title]}</button>
                  <p className="text-sm text-slate-600">{modules[key].label} · {revision.stage} · {formatTimestamp(revision.updatedAt)}</p>
                </li>)}
              </ul>}
          </div>
        </>}
        {module && config && editing && (
          <form className={module === 'schedules' ? 'max-w-3xl space-y-4' : `space-y-4 ${card}`} onSubmit={(event) => {
            event.preventDefault()
            const submitter = (event.nativeEvent as SubmitEvent).submitter
            const data = new FormData(event.currentTarget)
            const values = Object.fromEntries(config.fields.map(({ name }) => [name, String(data.get(name) ?? '').trim()]))
            if (config.fields.some(({ name, optional }) => !optional && !values[name])) {
              setFeedback({ text: 'Please complete all required fields.', error: true })
              return
            }
            if (save(module, editing.entry, { action: 'save', values, submit: submitter?.getAttribute('value') === 'review' })) {
              setEditing(null)
              heading.current?.focus()
            }
          }}>
            <h2 className="text-xl font-bold">{editing.entry ? 'Edit information' : config.add}</h2>
            {editing.entry?.revision?.note && <p className="rounded-xl bg-amber-50 p-3 text-amber-950"><strong>Correction requested</strong><br />{editing.entry.revision.note}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map(({ name, label, type, optional }) => {
                const value = editing.entry?.revision?.values[name] ?? editing.entry?.published?.values[name] ?? ''
                return <label key={name} className={`block font-semibold ${type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  {label}{!optional && <span aria-hidden="true"> *</span>}
                  {type === 'textarea' ? <textarea className="field mt-1 min-h-28" name={name} defaultValue={value} required={!optional} maxLength={1500} />
                    : <input className="field mt-1" name={name} type={type ?? 'text'} defaultValue={value} required={!optional}
                        min={type === 'number' ? 0 : type === 'date' ? '1900-01-01' : undefined}
                        max={type === 'date' ? (module === 'history' ? new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Manila' }) : '9999-12-31') : undefined}
                        maxLength={180} />}
                </label>
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={module === 'history' ? primary : secondary}>{module === 'history' ? 'Save historical record' : module === 'schedules' ? 'Save working copy' : 'Save draft'}</button>
              {module !== 'history' && <button type="submit" value="review" className={primary}>{module === 'schedules' ? 'Send for review' : 'Submit for review'}</button>}
              <button type="button" className={secondary} onClick={() => { setEditing(null); setFeedback(null); heading.current?.focus() }}>Cancel</button>
            </div>
          </form>
        )}
        {module === 'schedules' && role === 'editor' && !editing && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{items.length} {items.length === 1 ? 'schedule' : 'schedules'}</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white" role="region" aria-label="Distribution schedules table" tabIndex={0}>
              <table className="w-full min-w-[43rem] text-left text-sm">
                <thead className="border-b-2 border-slate-200 bg-[#faf9fc] text-slate-600">
                  <tr>{['Date', 'Schedule', 'Place and time', 'Status', 'Action'].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((entry) => {
                    const values = (entry.revision ?? entry.published)?.values
                    if (!values) return null
                    const editable = !entry.revision || ['Draft', 'Returned for correction'].includes(entry.revision.stage)
                    return (
                      <tr key={entry.id} className="align-top">
                        <td className="px-4 py-4">{formatDate(values.date)}</td>
                        <td className="px-4 py-4"><strong className="block">{values.barangay}</strong><span className="text-slate-600">{[values.aidType, values.group].filter(Boolean).join(' · ')}</span></td>
                        <td className="px-4 py-4"><span className="block">{values.venue}</span><span className="text-slate-600">{values.time}</span></td>
                        <td className="px-4 py-4 font-semibold text-[#54358B]">{statusFor('schedules', entry)}</td>
                        <td className="px-4 py-4">{editable && <button className="font-semibold text-[#452A73] underline underline-offset-4" onClick={() => { setEditing({ entry }); setFeedback(null); heading.current?.focus() }}>Edit<span className="sr-only"> {values.barangay}</span></button>}</td>
                      </tr>
                    )
                  })}
                  {!items.length && <tr><td colSpan={5} className="px-4 py-4">No schedules are available yet.</td></tr>}
                </tbody>
              </table>
            </div>
            <section className={card}>
              <h2 className="text-lg font-semibold">Review and publication</h2>
              <p className="mt-1 text-sm text-slate-600">An approver reviews and publishes working copies before they appear on the public Schedules page.</p>
            </section>
          </div>
        )}
        {module && !editing && !(module === 'schedules' && role === 'editor') && <div className="space-y-4">
          {items.length === 0 && <p className={card}>No records are available yet.</p>}
          {items.map((entry) => <ContentCard key={`${module}-${entry.id}-${entry.revision?.updatedAt ?? entry.published?.updatedAt ?? 'original'}`} module={module} entry={entry} role={role}
            onEdit={() => { setEditing({ entry }); setFeedback(null); heading.current?.focus() }}
            onUpdate={(command) => save(module, entry, command)} />)}
        </div>}
      </section>
    </div>
  )
}

export default function StaffArea({ headerTarget }: { headerTarget: HTMLDivElement | null }) {
  const [role, setRole] = useState<Role | null>(() => {
    try {
      const saved = sessionStorage.getItem('hbdis-demo-role')
      return saved === 'editor' || saved === 'approver' ? saved : null
    } catch {
      return null
    }
  })

  function changeRole(next: Role | null) {
    try {
      if (next) sessionStorage.setItem('hbdis-demo-role', next)
      else sessionStorage.removeItem('hbdis-demo-role')
    } catch {
      // The demo can still sign in for the current page when session storage is blocked.
    }
    setRole(next)
  }

  if (!API_CONFIG.USE_MOCK_DATA) return <div className={card}><h1 className="text-xl font-bold">Staff demo unavailable</h1><p className="mt-2">The staff demo requires mock data mode. A staff API is needed for server-backed management.</p></div>
  return role ? <StaffDashboard headerTarget={headerTarget} role={role} onLogout={() => changeRole(null)} /> : <StaffLogin onLogin={changeRole} />
}
