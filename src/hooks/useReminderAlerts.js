import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { remindersIn } from '../lib/reminders.js'
import { dateLabel } from '../lib/dates.js'

const FIRED_KEY = 'folio_reminders_fired' // the reminders already shown on this device (localStorage), by id
const GRACE_MS = 5 * 60_000 // one that came due while the app was closed still shows, this long after
const AHEAD_MS = 60 * 60_000 // timers are set for this far ahead; the rest are looked at again then

const readFired = () => { try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY)) ?? []) } catch { return new Set() } }
const writeFired = ids => { try { localStorage.setItem(FIRED_KEY, JSON.stringify([...ids].slice(-500))) } catch { /* shown again next time */ } }

// Asks the browser once to let Folio notify (in the tap that sets a reminder: browsers only ask then)
export function askToNotify() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
}

// Reminders (lib/reminders.js) shown while Folio is open: when one is due, a notification from the browser (allowed:
// askToNotify) with the note's title and its date, a tap on it opening the note (`onOpen(path)`); without that
// permission, a toast in the app with Open. Each shows once on this device. Nothing reminds while Folio is closed:
// that's for the email job (the reminders set to email) and, later, push.
export function useReminderAlerts(notes, onOpen) {
  const reminders = useMemo(() => remindersIn(notes), [notes])
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
      toast(reminder.title, { description: body, duration: Infinity, action: { label: 'Open', onClick: () => onOpen(reminder.path) } })
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

