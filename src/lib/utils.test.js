import { describe, it, expect } from 'vitest'
import { cn } from './utils.js'

describe('cn', () => {
  it('merges the app spacing tokens like built-in ones', () => {
    expect(cn('h-control px-4', 'h-auto px-3')).toBe('h-auto px-3')
    expect(cn('gap-space-sm', 'gap-space')).toBe('gap-space')
    expect(cn('size-control', 'size-control-md')).toBe('size-control-md')
  })
})
