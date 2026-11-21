import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { remindersIn } from '../lib/reminders.js'
import { dateLabel } from '../lib/dates.js'

const FIRED_KEY = 'folio_reminders_fired' // the reminders already shown on this device (localStorage), by id
const SEEN_KEY = 'folio_reminders_seen' // when Folio was last open on this device (localStorage, ms)
const MISSED_DAYS = 7 // missed reminders shown on opening reach back at most this far
const GRACE_MS = 5 * 60_000 // one that came due while the app was closed still shows, this long after
const AHEAD_MS = 60 * 60_000 // timers are set for this far ahead; the rest are looked at again then

const readSeen = () => { try { return Number(localStorage.getItem(SEEN_KEY)) || null } catch { return null } }
const writeSeen = () => { try { localStorage.setItem(SEEN_KEY, String(Date.now())) } catch { /* the next opening shows none missed */ } }

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

const readFired = () => { try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY)) ?? []) } catch { return new Set() } }
const writeFired = ids => { try { localStorage.setItem(FIRED_KEY, JSON.stringify([...ids].slice(-500))) } catch { /* shown again next time */ } }

// Asks the browser once to let Folio notify (in the tap that sets a reminder: browsers only ask then)
export function askToNotify() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
}

// Reminders (lib/reminders.js) shown while Folio is open: when one is due, a notification from the browser (allowed:
// askToNotify) with the note's title and its date, a tap on it opening the note (`onOpen(path)`); without that
// permission, an inverted toast with Open. Those that came due while Folio was closed on this device (since it was
// last open, up to MISSED_DAYS back; none on a device's first opening) show on opening, as inverted toasts, stacked,
// each with Open and ✕. Each shows once on this device. Nothing reminds while Folio is closed: that's for the email job
// (the reminders set to email) and, later, push.
export function useReminderAlerts(notes, onOpen) {
  const reminders = useMemo(() => remindersIn(notes), [notes])
  const since = useRef(null) // when Folio was last open here, read once as it opens (null: never)
  if (since.current === null) since.current = readSeen() ?? Date.now()
  // Open now: noted every minute and as the page is left
  useEffect(() => {
    writeSeen()
    const every = setInterval(writeSeen, 60_000)
    const leave = () => { if (document.visibilityState === 'hidden') writeSeen() }
    document.addEventListener('visibilitychange', leave)
    window.addEventListener('pagehide', writeSeen)
    return () => { clearInterval(every); document.removeEventListener('visibilitychange', leave); window.removeEventListener('pagehide', writeSeen) }
  }, [])
  // Missed while closed: as the notes arrive, oldest first, so the latest is on top of the stack
  useEffect(() => {
    const now = Date.now()
    const from = Math.max(since.current, now - MISSED_DAYS * 24 * 60 * 60_000)
    const fired = readFired()
    const missed = reminders.filter(r => r.at >= from && r.at < now - GRACE_MS && !fired.has(r.id))
    if (!missed.length) return
    for (const r of missed) {
      fired.add(r.id)
      toast(r.title, { ...REMINDER_TOAST, id: r.id, description: `Missed · ${dateLabel(r.date)}`, action: { label: 'Open', onClick: () => onOpen(r.path) } })
    }
    writeFired(fired)
  }, [reminders])
  useEffect(() => {
    let timers = []
    const show = reminder => {
      const fired = readFired()
      if (fired.has(reminder.id)) return
      fired.add(reminder.id)
      writeFired(fired)
      const body = dateLabel(reminder.date)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const note = new Notification(reminder.title, { body, tag: reminder.id })
          note.onclick = () => { window.focus(); onOpen(reminder.path); note.close() }
          return
        } catch {
          // Android's browsers only notify through the service worker
          navigator.serviceWorker?.ready.then(reg => reg.showNotification(reminder.title, { body, tag: reminder.id })).catch(() => {})
          return
        }
      }
      toast(reminder.title, { ...REMINDER_TOAST, id: reminder.id, description: body, action: { label: 'Open', onClick: () => onOpen(reminder.path) } })
    }
    const plan = () => {
      timers.forEach(clearTimeout)
      timers = []
      const now = Date.now()
      const fired = readFired()
      for (const r of reminders) {
        if (fired.has(r.id) || r.at < now - GRACE_MS) continue
        if (r.at > now + AHEAD_MS) break // soonest first: the rest are later
        timers.push(setTimeout(() => show(r), Math.max(0, r.at - now)))
      }
    }
    plan()
    const again = setInterval(plan, AHEAD_MS / 2)
    return () => { timers.forEach(clearTimeout); clearInterval(again) }
  }, [reminders])
}

