import { describe, it, expect } from 'vitest'
import { splitTitle, withTitle } from './files.js'

describe('note titles', () => {
  it('splits the first-line heading from the body', () => {
    expect(splitTitle('\n# 🔮 How AI works\n\nBody\n# Other')).toEqual({
      emoji: '🔮', title: 'How AI works', head: '\n# 🔮 How AI works\n\n', body: 'Body\n# Other',
    })
    expect(splitTitle('Intro\n# Later')).toEqual({ emoji: null, title: null, head: '', body: 'Intro\n# Later' })
    expect(splitTitle('# Only')).toMatchObject({ title: 'Only', body: '' })
  })

  it('sets the title, keeping its emoji, or adds one on top', () => {
    expect(withTitle('# 🔮 Old\n\nBody', 'New')).toBe('# 🔮 New\n\nBody')
    expect(withTitle('# Old ##\nBody', 'New')).toBe('# New\nBody')
    expect(withTitle('Body', 'New')).toBe('# New\n\nBody')
    expect(withTitle('', 'New')).toBe('# New\n')
  })
})
