import { describe, it, expect } from 'vitest'
import { parseProfile, serializeProfile, cleanEmail } from './profile.js'

describe('profile', () => {
  it('reads and writes the reminder email, nothing from bad text', () => {
    expect(parseProfile(undefined)).toEqual({ email: '', timeZone: '', appUrl: '' })
    expect(parseProfile('nope')).toBeNull()
    expect(parseProfile('[]')).toBeNull()
    const p = { email: 'me@example.com', timeZone: 'Europe/Berlin', appUrl: 'https://x.github.io/folio/' }
    expect(parseProfile(serializeProfile(p))).toEqual(p)
    expect(parseProfile('{"email":"not an email","appUrl":"javascript:x"}')).toEqual({ email: '', timeZone: '', appUrl: '' })
  })
  it('takes only what looks like an email address', () => {
    expect(cleanEmail(' me@example.com ')).toBe('me@example.com')
    expect(['me@example', 'me example.com', '', null].map(cleanEmail)).toEqual(['', '', '', ''])
  })
})
