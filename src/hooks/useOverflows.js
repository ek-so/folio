import { useLayoutEffect, useState } from 'react'

// Whether `el` (null until it's on the page: false) cuts off its content, its height being capped, kept up to date as
// it or its content resizes
export function useOverflows(el) {
  const [overflows, setOverflows] = useState(false)
  useLayoutEffect(() => {
    if (!el) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [el])
  return overflows
}
