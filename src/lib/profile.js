// The user's profile for this repo, kept beside the email job (not in .folio, which only says how Folio shows notes):
// `.github/folio/profile.json`, { "email": "me@example.com",
// "timeZone": "Europe/Berlin", "appUrl": "https://…/folio/" }: where reminders marked for email go, the time zone their
// dates are in (a note's date has none; the email job runs in UTC) and where Folio is (the email's link to the note). The
// email job reads it (src/job/reminders-job.js; lib/reminders.js). Folio's setting, not a note's content:
// deleting .folio only forgets the address.
export const PROFILE_PATH = '.github/folio/profile.json'

// An email address as typed: trimmed, or '' when it doesn't look like one (something@something.something)
export const cleanEmail = text => {
  const email = typeof text === 'string' ? text.trim() : ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
}

const text = v => typeof v === 'string' ? v.trim() : ''

// The profile a file's text holds ({ email, timeZone, appUrl }: '' for each not set), null for text that can't be read
// (never saved over)
export function parseProfile(raw) {
  if (raw === undefined) return { email: '', timeZone: '', appUrl: '' }
  try {
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return { email: cleanEmail(data.email), timeZone: text(data.timeZone), appUrl: /^https?:\/\//.test(text(data.appUrl)) ? text(data.appUrl) : '' }
  } catch {
    return null
  }
}

export const serializeProfile = ({ email, timeZone, appUrl }) =>
  JSON.stringify({ email, ...(timeZone && { timeZone }), ...(appUrl && { appUrl }) }, null, 2) + '\n'
