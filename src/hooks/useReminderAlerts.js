import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { remindersIn, dueReminders, unseenCount, missedReminders } from '../lib/reminders.js'
import { plural } from '../lib/plural.js'
import { dateLabel } from '../lib/dates.js'

const FIRED_KEY = 'folio_reminders_fired' // the reminders already shown on this device (localStorage), by id
const FROM_KEY = 'folio_reminders_from' // when Folio first told reminders on this device (localStorage, ms)
const MISSED_DAYS = 7 // missed reminders told on opening reach back at most this far
const AHEAD_MS = 60 * 60_000 // timers are set for this far ahead; the rest are looked at again then
const LATE_MS = 60_000 // a timer this late (the app was frozen in the background) leaves its reminder to the missed ones

// Noted on the device's first opening, so what came due before then isn't told as missed
const readFrom = () => {
  try {
    const at = Number(localStorage.getItem(FROM_KEY))
    if (at) return at
    localStorage.setItem(FROM_KEY, String(Date.now()))
  } catch { /* from now */ }
  return Date.now()
}

// A reminder's toast: inverted (the foreground's color as its fill: dark in light mode, light in dark), so it stands
// apart from the app's other toasts; it stays until closed or opened, stacked with the others (Sonner's stack, which
// spreads out on hover or a tap)
const REMINDER_TOAST = {
  duration: Infinity,
  closeButton: true,
  classNames: {
    toast: '!bg-foreground !text-background !border-foreground',
    description: '!text-background/75',
    closeButton: '!bg-foreground !text-background !border-background/30 hover:!bg-foreground',
  },
}

const DISMISSED_KEY = 'folio_reminders_dismissed' // the ones taken out of Notifications on this device, by id
const LIST_SEEN_KEY = 'folio_reminders_list_seen' // when Notifications was last opened on this device (ms)
const readDismissed = () => { try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY)) ?? []) } catch { return new Set() } }
const writeDismissed = ids => { try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids].slice(-500))) } catch { /* back next time */ } }
// Never opened on this device: as of now, so what was due before isn't counted as new
const readListSeen = () => {
  try {
    const at = Number(localStorage.getItem(LIST_SEEN_KEY))
    if (at) return at
    localStorage.setItem(LIST_SEEN_KEY, String(Date.now()))
  } catch { /* counted from now */ }
  return Date.now()
}
const writeListSeen = at => { try { localStorage.setItem(LIST_SEEN_KEY, String(at)) } catch { /* counted again */ } }

const readFired = () => { try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY)) ?? []) } catch { return new Set() } }
const writeFired = ids => { try { localStorage.setItem(FIRED_KEY, JSON.stringify([...ids].slice(-500))) } catch { /* shown again next time */ } }

// Asks the browser once to let Folio notify (in the tap that sets a reminder: browsers only ask then)
export function askToNotify() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') return Notification.requestPermission().catch(() => 'default')
  return Promise.resolve(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
}

// Whether this browser lets Folio notify (Profile → Settings → Notifications): `state` 'granted', 'denied', 'default'
// (not asked yet), 'install' (an iPhone or iPad in Safari: only Folio added to the Home Screen can notify) or
// 'unsupported'; `ask()` asks (in a tap)
export function useNotifyPermission() {
  const read = () => typeof Notification !== 'undefined' ? Notification.permission
    : /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'install' : 'unsupported'
  const [state, setState] = useState(read)
  return { state, ask: () => askToNotify().then(() => setState(read())) }
}

// Reminders (lib/reminders.js) while Folio is open, and Notifications (the page). One that comes due while Folio is on
// screen shows as an inverted toast with the note's title, its date and Open (`onOpen(path)`); while it's in the
// background (another tab or app; iOS stops a Home Screen app's timers there, so it never gets this), as a
// notification from the browser when allowed (askToNotify), a tap on it opening the note. Those that came due while
// Folio wasn't on screen (closed, or in the background, its timers frozen or late: every one not told yet, up to
// MISSED_DAYS back, none from before the device's first opening) are told in one toast on opening or coming back, "N reminders" with View (`onView`: opens
// Notifications). Each is told once on this device. Every one that has come due stays in Notifications (`due`, latest
// first) until it's dismissed (`dismiss(id)`, `dismissAll()`; remembered on this device: nothing's written to the
// notes or `.folio`); `rung`: those as `rungKey`s, for their dates' badges (RungContext); `unseen`: how many came due
// since Notifications was last opened (`markSeen()`, as it is).
// Nothing reminds while Folio is closed.
export function useReminderAlerts(notes, { onOpen: onOpenNow, onView }) {
  const reminders = useMemo(() => remindersIn(notes), [notes])
  // Opened the way the app opens a note now (the page you're on), not as when the reminder was planned
  const actions = useRef()
  actions.current = { onOpen: onOpenNow, onView }
  const onOpen = path => actions.current.onOpen(path)
  const [now, setNow] = useState(Date.now) // what's due is as of this: moved on as reminders come due
  const [dismissed, setDismissed] = useState(readDismissed)
  const [seenAt, setSeenAt] = useState(readListSeen)
  const from = useRef(null)
  if (from.current === null) from.current = readFrom()
  const telling = useRef(true) // opened or back, and what was missed not told yet (once the notes are there)
  const [visits, setVisits] = useState(0)

  // What's due moves on every minute; coming back, what came due meanwhile is told (below)
  useEffect(() => {
    const every = setInterval(() => setNow(Date.now()), 60_000)
    const back = () => {
      if (document.visibilityState === 'hidden') return
      telling.current = true
      setNow(Date.now())
      setVisits(v => v + 1)
    }
    document.addEventListener('visibilitychange', back)
    return () => { clearInterval(every); document.removeEventListener('visibilitychange', back) }
  }, [])

  // Missed while away: one toast for all, on opening (once the notes are there) and on coming back; not as notes change
  // while open (a reminder set for a time just gone isn't one missed)
  useEffect(() => {
    if (!telling.current || !Object.keys(notes).length || document.visibilityState === 'hidden') return
    telling.current = false
    const at = Date.now()
    const fired = readFired()
    const missed = missedReminders(reminders, Math.max(from.current, at - MISSED_DAYS * 24 * 60 * 60_000), at, fired)
    if (!missed.length) return
    missed.forEach(r => fired.add(r.id))
    writeFired(fired)
    toast(`${plural(missed.length, 'reminder')} while you were away`, {
      ...REMINDER_TOAST, id: 'reminders-missed',
      description: missed.length === 1 ? missed[0].title : undefined,
      action: { label: 'View', onClick: () => actions.current.onView() },
    })
  }, [notes, reminders, visits])

  // Coming due while open
  useEffect(() => {
    let timers = []
    const show = reminder => {
      setNow(Date.now())
      if (Date.now() - reminder.at > LATE_MS) return // frozen meanwhile: told with the missed ones as it's back
      const fired = readFired()
      if (fired.has(reminder.id)) return
      fired.add(reminder.id)
      writeFired(fired)
      const body = dateLabel(reminder.date)
      if (document.visibilityState === 'hidden' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const note = new Notification(reminder.title, { body, tag: reminder.id })
          note.onclick = () => { window.focus(); onOpen(reminder.path); note.close() }
        } catch {
          // Android's browsers and iOS only notify through the service worker
          navigator.serviceWorker?.ready.then(reg => reg.showNotification(reminder.title, { body, tag: reminder.id })).catch(() => {})
        }
        return
      }
      toast(reminder.title, { ...REMINDER_TOAST, id: reminder.id, description: body, action: { label: 'Open', onClick: () => onOpen(reminder.path) } })
    }
    const plan = () => {
      timers.forEach(clearTimeout)
      timers = []
      const at = Date.now()
      for (const r of reminders) {
        if (r.at <= at) continue // come due already: told as missed
        if (r.at > at + AHEAD_MS) break // soonest first: the rest are later
        timers.push(setTimeout(() => show(r), r.at - at))
      }
    }
    plan()
    const again = setInterval(plan, AHEAD_MS / 2)
    return () => { timers.forEach(clearTimeout); clearInterval(again) }
  }, [reminders])

  const due = useMemo(() => dueReminders(reminders, now, dismissed), [reminders, now, dismissed])
  const rung = useMemo(() => new Set(due.map(r => rungKey(r.path, r.key))), [due])
  const dismissAll = ids => setDismissed(prev => { const next = new Set([...prev, ...ids]); writeDismissed(next); return next })
  return {
    due,
    rung,
    unseen: unseenCount(due, seenAt),
    dismiss: id => dismissAll([id]),
    dismissAll: () => dismissAll(due.map(r => r.id)),
    markSeen: () => { const at = Date.now(); writeListSeen(at); setSeenAt(at) },
  }
}

// The date property `key` of the note at `path`, as `rung` holds it
export const rungKey = (path, key) => `${path}|${key}`
// The dates whose reminder has come due and is still in Notifications (`rung`): their badge's bell has a dot
export const RungContext = createContext(new Set())
export const useRung = (path, key) => useContext(RungContext).has(rungKey(path, key))
