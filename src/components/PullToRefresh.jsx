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
// spinner shows above it, below the status bar. A drag that starts sideways (a wide table or code block scrolled across)
// is never a pull: the first moves decide, so the screen doesn't slide under a sideways swipe.
const DECIDE_PX = 6 // how far a touch moves before its direction is known
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
    pullStart.current = blocked ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY, down: false }
  }

  function onTouchMove(e) {
    const start = pullStart.current
    if (start === null) return
    const dx = e.touches[0].clientX - start.x
    const dy = e.touches[0].clientY - start.y
    if (!start.down) {
      if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return // too early to tell
      if (Math.abs(dx) >= Math.abs(dy) || dy < 0) { pullStart.current = null; return } // sideways or up: a scroll
      start.down = true
    }
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
