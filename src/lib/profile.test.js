import { describe, it, expect } from 'vitest'
import { parseProfile, serializeProfile, cleanEmail } from './profile.js'

describe('profile', () => {
  it('reads and writes the reminder email, nothing from bad text', () => {
    expect(parseProfile(undefined)).toEqual({ email: '' })
    expect(parseProfile('nope')).toBeNull()
    expect(parseProfile('[]')).toBeNull()
    expect(parseProfile(serializeProfile({ email: 'me@example.com' }))).toEqual({ email: 'me@example.com' })
    expect(parseProfile('{"email":"not an email"}')).toEqual({ email: '' })
  })
  it('takes only what looks like an email address', () => {
    expect(cleanEmail(' me@example.com ')).toBe('me@example.com')
    expect(['me@example', 'me example.com', '', null].map(cleanEmail)).toEqual(['', '', '', ''])
  })
})
