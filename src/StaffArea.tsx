import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { API_CONFIG } from './api/config'
import {
  formatDate, formatTimestamp, getContentSnapshot, readContent, subscribeToContent, updateContent,
  type Entry, type Module, type Role,
} from './data/staffContent'

type Field = { name: string; label: string; type?: 'date' | 'number' | 'textarea'; optional?: boolean }

const modules: Record<Module, { label: string; title: string; add?: string; print?: string; fields: Field[] }> = {
  schedules: {
    label: 'Distribution schedules', title: 'barangay', add: 'Add schedule', print: 'schedule boards and printed schedules',
    fields: [
      { name: 'barangay', label: 'Barangay' }, { name: 'date', label: 'Distribution date', type: 'date' },
      { name: 'time', label: 'Time window (e.g., 8:00 AM to 12:00 PM)' },
      { name: 'venue', label: 'Venue' }, { name: 'group', label: 'Beneficiary group' },
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
      { name: 'notes', label: 'Fictional record notes', type: 'textarea' },
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
      setError('The username or password is incorrect. Try again or check the demo accounts below.')
    }
  }

  return (
    <section aria-labelledby="staff-sign-in" className="mx-auto grid max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white md:max-w-5xl md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:max-w-6xl">
      <header className="border-b border-[#D8CCE9] bg-[#F3EFF9] p-5 sm:p-7 md:border-r md:border-b-0 md:p-9">
        <h1 id="staff-sign-in" className="text-[1.75rem] leading-tight font-bold text-[#352054] sm:text-[2rem]">Staff sign in</h1>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-slate-800 sm:text-lg">
          Sign in to manage schedules, requirements, announcements, and process instructions.
        </p>
      </header>
      <div className="min-w-0 p-5 sm:p-7 md:p-9">
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
        <details className="mt-5 border-t border-slate-200 pt-2 text-base leading-relaxed">
          <summary className="min-h-11 cursor-pointer rounded-sm py-3 font-semibold text-[#452A73] focus-visible:outline-2 focus-visible:outline-offset-2">Demo accounts</summary>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 pb-1 text-slate-700">
            <dt>Editor username</dt><dd><code>editor</code></dd>
            <dt>Approver username</dt><dd><code>approver</code></dd>
            <dt>Shared password</dt><dd><code>hci-demo</code></dd>
          </dl>
        </details>
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

function StaffDashboard({ role, onLogout }: { role: Role; onLogout: () => void }) {
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
        save: next === 'history' ? 'Fictional historical record saved.' : command.action === 'save' && command.submit ? 'Submitted for review.' : 'Draft saved.',
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
    <div className="grid min-w-0 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className={`self-start ${card}`}>
        <p className="text-sm font-bold text-[#54358B]">Demonstration account</p>
        <p className="mt-1 text-lg font-bold">{role === 'editor' ? 'Content editor' : 'Content approver'}</p>
        <nav aria-label="Staff modules" className="my-4 flex flex-wrap gap-1 lg:grid">
          {[null, ...moduleKeys].map((key) => <button key={key ?? 'dashboard'} aria-current={key === module ? 'page' : undefined}
            className={`min-h-11 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#F7F4FB] ${key === module ? 'bg-[#EDE7F6] text-[#452A73]' : ''}`}
            onClick={() => navigate(key)}>{key ? modules[key].label : 'Dashboard'}</button>)}
        </nav>
        <button className={secondary} onClick={onLogout}>Sign out</button>
      </aside>
      <section className="min-w-0 space-y-5" aria-labelledby="staff-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id="staff-heading" ref={heading} tabIndex={-1} className="text-3xl font-bold tracking-tight text-slate-950">{config?.label ?? 'Staff dashboard'}</h1>
            <p className="mt-2 max-w-2xl text-slate-700">{module === 'history' ? 'Staff-only fictional records. The public estimate stays unavailable until reliable historical information exists.' : config ? 'Review the sample information here before publishing updates.' : 'Manage fictional distribution information and check what is ready for review or publication.'}</p>
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
          <form className={`space-y-4 ${card}`} onSubmit={(event) => {
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
              <button type="submit" className={module === 'history' ? primary : secondary}>{module === 'history' ? 'Save historical record' : 'Save draft'}</button>
              {module !== 'history' && <button type="submit" value="review" className={primary}>Submit for review</button>}
              <button type="button" className={secondary} onClick={() => { setEditing(null); setFeedback(null); heading.current?.focus() }}>Cancel</button>
            </div>
          </form>
        )}
        {module && !editing && <div className="space-y-4">
          {items.length === 0 && <p className={card}>No records are available yet.</p>}
          {items.map((entry) => <ContentCard key={`${module}-${entry.id}-${entry.revision?.updatedAt ?? entry.published?.updatedAt ?? 'original'}`} module={module} entry={entry} role={role}
            onEdit={() => { setEditing({ entry }); setFeedback(null); heading.current?.focus() }}
            onUpdate={(command) => save(module, entry, command)} />)}
        </div>}
      </section>
    </div>
  )
}

export default function StaffArea() {
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
  return role ? <StaffDashboard role={role} onLogout={() => changeRole(null)} /> : <StaffLogin onLogin={changeRole} />
}
