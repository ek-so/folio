import { describe, it, expect } from 'vitest'
import { shownCards, hiddenCards, shownLimit } from './trayCards.js'

const paths = Array.from({ length: 10 }, (_, i) => `n${i}`)

describe('tray cards', () => {
  it('shows the first seven and hides the rest, unless all are shown', () => {
    expect(shownCards(paths, false)).toEqual(paths.slice(0, 7))
    expect(hiddenCards(paths)).toEqual(['n7', 'n8', 'n9'])
    expect(shownCards(paths, true)).toEqual(paths)
  })

  it('keeps the dragged card shown wherever it is', () => {
    expect(shownCards(paths, false, 'n9')).toEqual([...paths.slice(0, 7), 'n9'])
    expect(hiddenCards(paths, 'n9')).toEqual(['n7', 'n8'])
  })

  it('shows whole rows in a grid of several columns, seven cards in one', () => {
    expect(shownLimit(1)).toBe(7)
    expect(shownLimit(3)).toBe(9)
    expect(shownCards(paths, false, undefined, shownLimit(2))).toEqual(paths.slice(0, 6))
    expect(hiddenCards(paths, undefined, shownLimit(2))).toEqual(['n6', 'n7', 'n8', 'n9'])
  })
})
