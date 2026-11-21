// The email reminders job: run by a GitHub Action in the notes repo every 15 minutes (.github/workflows/folio-reminders.yml,
// written there by Folio: Profile → Settings → Email reminders). It reads the notes, finds the reminders set to email
// (lib/reminders.js: `due-reminder: 1h, email`) that came due since a little before the last runs, and sends each to the
// profile's address (.github/folio/profile.json) through Resend (the RESEND_API_KEY secret). What it sent is kept in
// .github/folio/reminders-sent.json (the workflow commits it), so each goes once: written as each is sent and on every
// run, so a failed send (reported at the end, the run failing) never makes the others go again. Built into one file with Folio's own code
// (vite.job.config.js: folio-reminders.mjs beside the app), so it reads dates exactly as Folio does.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PROFILE_PATH, parseProfile } from '../lib/profile.js'
import { remindersIn, emailsDue, keptSent } from '../lib/reminders.js'
import { dateLabel } from '../lib/dates.js'
import { SENT_PATH } from '../lib/emailJob.js'
const WINDOW_MS = 3 * 60 * 60_000 // a run sends what came due this long before it (GitHub's runs can be late)
const KEEP_MS = 7 * 24 * 60 * 60_000
const SKIP = new Set(['.git', '.github', '.folio', '.archive', 'node_modules'])

const read = (path, fallback) => { try { return readFileSync(path, 'utf8') } catch { return fallback } }

// Every note of the repo: { path: text }
function notesIn(dir = '.', out = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const path = dir === '.' ? entry.name : join(dir, entry.name)
    if (entry.isDirectory()) notesIn(path, out)
    else if (entry.name.toLowerCase().endsWith('.md')) out[path] = read(path, '')
  }
  return out
}

async function send(key, to, reminder, appUrl) {
  const link = appUrl ? `${appUrl}${reminder.path.split('/').map(encodeURIComponent).join('/')}` : ''
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Folio <onboarding@resend.dev>',
      to,
      subject: `Reminder: ${reminder.title}`,
      text: `${reminder.title}\n${dateLabel(reminder.date)}${link ? `\n\nOpen in Folio: ${link}` : ''}\n`,
    }),
  })
  if (!res.ok) throw new Error(`Resend answered ${res.status}: ${await res.text()}`)
}

async function main() {
  const key = process.env.RESEND_API_KEY
  const profile = parseProfile(read(PROFILE_PATH, undefined))
  const now = Date.now()
  const sent = keptSent(JSON.parse(read(SENT_PATH, '{}') || '{}'), now, KEEP_MS)
  mkdirSync(dirname(SENT_PATH), { recursive: true })
  const keep = () => writeFileSync(SENT_PATH, JSON.stringify(sent, null, 2) + '\n')
  keep() // always there for the workflow to commit, even when nothing is sent
  if (!profile?.email) return console.log(`No reminder email in ${PROFILE_PATH}: nothing to send.`)
  if (!key) throw new Error('The RESEND_API_KEY secret is missing: add it in the repo\'s Settings → Secrets and variables → Actions.')
  if (profile.timeZone) process.env.TZ = profile.timeZone // a note's dates are in the user's time zone
  const due = emailsDue(remindersIn(notesIn()), sent, now, WINDOW_MS)
  const failed = []
  for (const reminder of due) {
    try {
      await send(key, profile.email, reminder, profile.appUrl)
      sent[reminder.id] = now
      keep()
      console.log(`Sent: ${reminder.title} (${reminder.path})`)
    } catch (e) {
      failed.push(`${reminder.title} (${reminder.path}): ${e.message}`)
    }
  }
  console.log(due.length ? `${due.length - failed.length} of ${due.length} sent.` : 'Nothing due.')
  if (failed.length) throw new Error(`Not sent:\n${failed.join('\n')}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
