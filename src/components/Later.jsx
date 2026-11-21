import { Component, Suspense } from 'react'
import { ArrowClockwise } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { EmptyMessage } from './EmptyState.jsx'
import { retryLater } from '../lib/later.js'

// Where something whose code loads later (lib/later.js) shows: `fallback` while its code is fetched (a Suspense), and,
// when it can't be fetched, a line saying why (offline: not on this device yet; else it couldn't load) with Try again,
// which fetches it anew; the rest of the app stays as it is. `compact`: the line alone, smaller (in a popover).
// Custom: React catches a render's error only in a class component (an error boundary), and shadcn has none.
export default class Later extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    const { fallback = null, compact, children } = this.props
    if (!this.state.failed) return <Suspense fallback={fallback}>{children}</Suspense>
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    return (
      <div className="flex flex-col items-center gap-space-sm p-space">
        <EmptyMessage size={compact ? 'sm' : 'md'} className="py-0">
          {offline ? "This part of Folio isn't saved on this device yet. Connect to the internet to open it." : "This part of Folio couldn't load."}
        </EmptyMessage>
        <Button variant="secondary" size={compact ? 'md' : 'default'} onClick={() => { retryLater(); this.setState({ failed: false }) }}><ArrowClockwise /> Try again</Button>
      </div>
    )
  }
}
