import { useState } from 'react'
import { clampWidth } from '../lib/resize.js'

// A panel width kept within `limits`, read from `get`. `resize(px, save = true)`
// sets it; it is saved with `set` unless `save` is false (mid-drag).
export function useResizableWidth(limits, get, set) {
  const [width, setWidth] = useState(() => clampWidth(get(), limits))
  const resize = (w, save = true) => {
    const next = clampWidth(w, limits)
    setWidth(next)
    if (save) set(next)
  }
  return [width, resize]
}
