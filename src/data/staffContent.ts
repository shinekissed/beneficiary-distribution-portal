import { announcements, schedules } from './mockData'
import { processInstructions, reminders, requirements } from './guidance'

export type Module = 'schedules' | 'requirements' | 'reminders' | 'announcements' | 'process' | 'history'
export type Role = 'editor' | 'approver'
export type Values = Record<string, string>
export type Stage = 'Draft' | 'Pending review' | 'Returned for correction' | 'Approved'
export type Entry = {
  id: number
  published?: { values: Values; updatedAt?: string }
  revision?: { values: Values; stage: Stage; updatedAt: string; note?: string }
}
type Content = Record<Module, Entry[]>

const storageKey = 'hbdis-staff-content-v1'
const changeEvent = 'hbdis-content-change'

function publishedEntries(items: Values[]): Entry[] {
  return items.map((values, index) => ({ id: index + 1, published: { values } }))
}

const initialContent: Content = {
  schedules: schedules.map(({ id, day, date, ...values }) => ({
    id,
    published: { values: { ...values, date: new Date(`${date} UTC`).toISOString().slice(0, 10) } },
  })),
  requirements: publishedEntries(requirements),
  reminders: publishedEntries(reminders.map((text) => ({ text }))),
  announcements: announcements.map(({ id, date, ...values }) => ({
    id,
    published: { values: { ...values, date: new Date(`${date} UTC`).toISOString().slice(0, 10) } },
  })),
  process: publishedEntries(processInstructions),
  history: publishedEntries([
    { barangay: 'Barangay Maligaya', date: '2025-04-10', venue: 'Maligaya Covered Court', minutes: '', notes: 'Fictional sample event. No waiting time was recorded.' },
  ]),
}

export function getContentSnapshot() {
  try {
    return localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

export function subscribeToContent(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(changeEvent, listener)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(changeEvent, listener)
  }
}

export function readContent(snapshot = getContentSnapshot()): Content {
  return snapshot === null ? initialContent : JSON.parse(snapshot)
}

export function publishedContent(module: Module, content = readContent()) {
  return content[module].flatMap(({ id, published }) => published ? [{ id, ...published }] : [])
}

type Command =
  | { action: 'save'; values: Values; submit: boolean }
  | { action: 'return'; note: string }
  | { action: 'approve' | 'publish' }

export function updateContent(module: Module, role: Role, expected: Entry | undefined, command: Command) {
  // Read the latest stored copy, so an editor cannot overwrite a change already made in another tab.
  const content = readContent(localStorage.getItem(storageKey))
  const items = content[module]
  const current = items.find((item) => item.id === expected?.id)
  if (JSON.stringify(current) !== JSON.stringify(expected)) {
    throw new Error('This item changed in another tab. Reopen it before making changes.')
  }
  const id = current?.id ?? Math.max(0, ...items.map((item) => item.id)) + 1
  const entry: Entry = { ...current, id }
  const updatedAt = new Date().toISOString()
  const revision = entry.revision

  if (command.action === 'save') {
    if (revision && revision.stage !== 'Draft' && revision.stage !== 'Returned for correction') {
      throw new Error('Return this update for correction before editing it.')
    }
    if (module === 'history') {
      entry.published = { values: command.values, updatedAt }
    } else {
      entry.revision = {
        values: command.values,
        stage: command.submit ? 'Pending review' : 'Draft',
        updatedAt,
        note: command.submit ? undefined : revision?.note,
      }
    }
  } else {
    if (role !== 'approver' || module === 'history' || !revision) {
      throw new Error('An approver account is required for this action.')
    }
    if (command.action === 'return' && ['Pending review', 'Approved'].includes(revision.stage)) {
      const note = command.note.trim()
      if (!note) throw new Error('Enter a correction note before returning this update.')
      entry.revision = { ...revision, stage: 'Returned for correction', note, updatedAt }
    } else if (command.action === 'approve' && revision.stage === 'Pending review') {
      entry.revision = { ...revision, stage: 'Approved', updatedAt }
    } else if (command.action === 'publish' && revision.stage === 'Approved') {
      entry.published = { values: revision.values, updatedAt }
      delete entry.revision
    } else {
      throw new Error('This action is unavailable for the current status.')
    }
  }

  content[module] = current ? items.map((item) => item.id === id ? entry : item) : [...items, entry]
  localStorage.setItem(storageKey, JSON.stringify(content))
  window.dispatchEvent(new Event(changeEvent))
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila',
  }).format(new Date(value)) + ' PHT'
}
