import { forwardRef, useState, useRef } from 'react'
import { DotsSixVertical } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Tip } from './tooltip.jsx'
import { Input } from './input.jsx'

// A tinted, rounded box that groups what's inside it under a small title: a board's column, a note widget's note.
// `className` and other props go on the box (a column's drag and drop).
export const Tray = forwardRef(function Tray({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-space-sm rounded-lg bg-secondary/60 p-space-sm', className)} {...props} />
})

// A medium icon button in a tray's title row (a column's ⋯, a note's Edit)
export const TRAY_BUTTON = 'size-control-md shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10'

// A tray's title row: `grip` shows the drag indicator before it (a tray that can be moved); `onClick`: the title
// can be tapped (to edit it), with a light fill on hover
export function TrayTitle({ grip, onClick, disabled, tooltip, children }) {
  const row = 'flex min-h-control-md items-center gap-1 pl-space-sm pr-space-xs'
  const title = <h3 className="min-w-0 flex-1 truncate text-left text-sm font-semibold">{children}</h3>
  if (onClick) return (
    <Tip content={tooltip}>
      <button type="button" disabled={disabled} onClick={onClick} className={cn(row, 'w-full rounded-sm outline-none hover:bg-muted-foreground/10 focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none')}>{title}</button>
    </Tip>
  )
  return (
    <div className={row}>
      {grip && <DotsSixVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      {title}
    </div>
  )
}

// A tray title being edited in place, as tall as the title: Enter or leaving it saves `onSave(value)`, Escape cancels
export function TrayTitleInput({ value, label, onSave, onCancel }) {
  const [text, setText] = useState(value)
  const done = useRef(false) // Enter and Escape end it before the blur that follows
  const end = save => { if (done.current) return; done.current = true; save ? onSave(text.trim()) : onCancel() }
  return (
    <Input
      autoFocus value={text} aria-label={label} autoCorrect="off"
      className="h-control-md bg-card pl-space-sm pr-space-xs text-sm font-semibold"
      onChange={e => setText(e.target.value)}
      onFocus={e => e.target.select()}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); end(true) }
        if (e.key === 'Escape') { e.preventDefault(); end(false) }
      }}
      onBlur={() => end(true)}
    />
  )
}
