import { useState } from 'react'
import { clampWidth } from '../lib/resize.js'

// A panel width kept within `limits`, read from and saved to storage (`get` / `set`)
export function useResizableWidth(limits, get, set) {
  const [width, setWidth] = useState(() => clampWidth(get(), limits))
  const resize = w => { const next = clampWidth(w, limits); setWidth(next); set(next) }
  return [width, resize]
}
