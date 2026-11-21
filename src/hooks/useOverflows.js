import { useLayoutEffect, useState } from 'react'

// Whether `el` (null until it's on the page: false) cuts off its content, its height being capped or fixed, kept up to
// date as it resizes, its content resizes, or its content is swapped (a note's text arriving in place of a message)
export function useOverflows(el) {
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    if (!el) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    const resizes = new ResizeObserver(measure)
    const watch = () => {
      resizes.disconnect()
      resizes.observe(el)
      for (const child of el.children) resizes.observe(child)
      measure()
    }
    watch()
    const swaps = new MutationObserver(watch)
    swaps.observe(el, { childList: true })
    return () => { resizes.disconnect(); swaps.disconnect() }
  }, [el])
  return overflows
}
