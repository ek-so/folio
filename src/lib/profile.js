// The user's profile for this repo, kept beside the views: `.folio/profile.json`, { "email": "me@example.com" }: where
// reminders marked for email go (the email job reads it; lib/reminders.js). Folio's setting, not a note's content:
// deleting .folio only forgets the address.
export const PROFILE_PATH = '.folio/profile.json'

// An email address as typed: trimmed, or '' when it doesn't look like one (something@something.something)
export const cleanEmail = text => {
  const email = typeof text === 'string' ? text.trim() : ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
}

// The profile a file's text holds ({ email }: '' for none), {} for no file, null for text that can't be read (never saved over)
export function parseProfile(text) {
  if (text === undefined) return { email: '' }
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return { email: cleanEmail(data.email) }
  } catch {
    return null
  }
}

export const serializeProfile = profile => JSON.stringify({ email: profile.email }, null, 2) + '\n'
