import { useLayoutEffect, useState } from 'react'

// How many columns the CSS grid `el` (null until it's on the page: 1) lays out, kept up to date as it resizes.
// Measured before the page is painted, so what depends on it doesn't flash a first guess
export function useGridColumns(el) {
  const [columns, setColumns] = useState(1)
  useLayoutEffect(() => {
    if (!el) return
    const measure = () => setColumns(Math.max(1, getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])
  return columns
}
