import { useState } from 'react'
import { clampSize } from '../lib/resize.js'

// A panel width kept within `limits`, read from `get`. `resize(px, save = true)`
// sets it; it is saved with `set` unless `save` is false (mid-drag).
export function useResizableWidth(limits, get, set) {
  const [width, setWidth] = useState(() => clampSize(get(), limits))
  const resize = (w, save = true) => {
    const next = clampSize(w, limits)
    setWidth(next)
    if (save) set(next)
  }
  return [width, resize]
}
