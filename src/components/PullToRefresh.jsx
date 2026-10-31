import { useState, useRef } from 'react'
import { cn } from '@/lib/utils.js'
import Spinner from './Spinner.jsx'

// Is the touch inside a scrolled-down area? Then the drag scrolls, not refreshes.
function scrolledAncestor(el, root) {
  for (; el && el !== root; el = el.parentElement) {
    if (el.scrollTop > 0) return true
  }
  return false
}

// Drag down from the top to refresh. The whole screen slides down and a
// spinner shows above it, below the status bar.
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStart = useRef(null)
  const rootRef = useRef()

  function onTouchStart(e) {
    // Not while typing, nor inside areas that opt out (the markdown editor):
    // there a drag scrolls
    const typing = document.activeElement?.matches('textarea, input')
    const optedOut = e.target.closest('[data-no-pull]')
    const blocked = refreshing || typing || optedOut || scrolledAncestor(e.target, rootRef.current)
    pullStart.current = blocked ? null : e.touches[0].clientY
  }

  function onTouchMove(e) {
    if (pullStart.current === null) return
    const dy = e.touches[0].clientY - pullStart.current
    setPull(dy > 0 ? Math.min(dy / 2, 80) : 0)
  }

  async function onTouchEnd() {
    pullStart.current = null
    if (pull >= 60) {
      setRefreshing(true)
      setPull(0)
      await onRefresh()
      setRefreshing(false)
    } else setPull(0)
  }

  const offset = refreshing ? 56 : pull

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ paddingTop: 'var(--safe-top)' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {offset > 0 && (
        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={{ top: 'var(--safe-top)', height: offset }}
        >
          <Spinner
            spinning={refreshing}
            className="size-5"
            style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)`, opacity: refreshing ? 1 : pull / 60 }}
          />
        </div>
      )}
      <div
        className={cn('relative flex flex-col flex-1 min-h-0 bg-background', !pull && 'transition-transform')}
        style={{ transform: offset ? `translateY(${offset}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  )
}
