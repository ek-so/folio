import { describe, it, expect } from 'vitest'
import { describeSyncError } from './syncErrors.js'

describe('describeSyncError', () => {
  it('explains common GitHub answers and keeps the raw details', () => {
    const e = Object.assign(new Error('Bad credentials'), { status: 401, step: 'read', response: { data: { message: 'Bad credentials' } } })
    const d = describeSyncError(e)
    expect(d.title).toMatch(/token/)
    expect(d.details).toEqual([['Step', 'Getting the latest version from GitHub'], ['Status', '401'], ['GitHub says', 'Bad credentials']])
    expect(describeSyncError({ status: 403, response: { data: { message: 'API rate limit exceeded' } } }).title).toMatch(/Too many/)
    expect(describeSyncError({ status: 422, step: 'save', message: 'Update is not a fast forward' }).title).toMatch(/changed while syncing/)
    expect(describeSyncError(new Error('boom')).title).toBe('Sync failed')
  })
})
