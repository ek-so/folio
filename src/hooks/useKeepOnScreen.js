import { useCallback, useRef } from 'react'

// A ref for a Radix popover or sub menu's content: when it doesn't fit beside what opened it (a phone), it's shifted
// sideways until it's `pad`px inside the screen, so it overlays its parent instead of running off the edge or shrinking.
// Radix only moves it along its edge, never across, so this measures its wrapper (where Radix put it) and shifts the content
// itself (`translate`), again whenever Radix moves or resizes it. `forwarded`: the ref the caller also needs
export function useKeepOnScreen(forwarded, pad = 8) {
  const watching = useRef([])
  return useCallback(node => {
    watching.current.forEach(o => o.disconnect())
    watching.current = []
    if (typeof forwarded === 'function') forwarded(node)
    else if (forwarded) forwarded.current = node
    const wrapper = node?.parentElement
    if (!wrapper) return
    const fit = () => {
      const left = wrapper.getBoundingClientRect().left
      const room = document.documentElement.clientWidth - 2 * pad
      const wanted = Math.min(Math.max(left, pad), pad + Math.max(0, room - node.offsetWidth)) // where its left edge should be
      node.style.translate = wanted === left ? '' : `${wanted - left}px 0`
    }
    const moved = new MutationObserver(fit)
    moved.observe(wrapper, { attributes: true, attributeFilter: ['style'] })
    const resized = new ResizeObserver(fit)
    resized.observe(node)
    watching.current = [moved, resized]
    fit()
  }, [forwarded, pad])
}
