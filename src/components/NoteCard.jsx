import { forwardRef } from 'react'
import { cn, isPortaled } from '@/lib/utils.js'
import { openLink } from '@/lib/previewLinks.js'
import PropertyBadges from '@/components/PropertyBadges.jsx'
import { displayName } from '@/lib/files.js'
import { frontMatter, noteTitle, DESCRIPTION } from '@/lib/frontmatter.js'
import { taskProgress } from '@/lib/markdown.js'

// A long press on iPhones mustn't open the text or link callout instead of the drag
export const NO_CALLOUT = '[-webkit-touch-callout:none]'

// The drag's listeners, ignoring presses in a dialog opened from the card (React passes them up through the portal)
export const ownListeners = listeners => listeners && Object.fromEntries(Object.entries(listeners).map(([k, f]) => [k, e => { if (!isPortaled(e)) f(e) }]))

// A click on a card: a link in its description opens what it points to, anything else opens the card
// (`files`: the repo's paths as keys); a click in a dialog opened from the card is the dialog's
export const cardClick = (path, files, onOpen, onOpenFolder) => e => {
  if (isPortaled(e)) return
  const link = e.target.closest('a[href]')
  if (!link) return onOpen(path)
  e.preventDefault()
  openLink(link.getAttribute('href'), { path, files, onOpenFile: onOpen, onNavigate: onOpenFolder })
}

// What a card of a board or a planner shows: the note's title, its description, the chosen `properties`' values. A div, not a button:
// the badges in it are buttons
const NoteCard = forwardRef(function NoteCard({ path, text, properties, always = [], scopeName, files, menu, onChange, options, onRemoveValue, valueCount, chosen, onEditValue, dateKeys, badges, className, ...props }, ref) {
  const fm = text === undefined ? [] : frontMatter(text)?.props ?? []
  // With `always` (a planner's date and repeat): the description first, then those in that order (shown empty when the
  // note lacks one), then the rest in the file's order; without, all in the file's order
  const description = always.length ? fm.filter(p => p.key === DESCRIPTION) : []
  const first = text === undefined ? [] : always.map(key => fm.find(p => p.key === key) ?? { key, value: '' })
  const rest = fm.filter(p => !always.includes(p.key) && !description.includes(p) && (p.key === DESCRIPTION || properties.includes(p.key)))
  const shown = [...description, ...first, ...rest]
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); props.onClick?.(e) } }}
      className={cn('group flex w-full cursor-pointer touch-manipulation select-none flex-col gap-1 rounded-lg border border-border bg-card p-space text-left outline-none hover-lift focus-visible:ring-1 focus-visible:ring-ring', NO_CALLOUT, className)}
      {...props}
    >
      <div className="flex items-start gap-1">
        <span className="min-w-0 flex-1 break-words text-sm font-medium">{text === undefined ? displayName(path) : noteTitle(text, displayName(path))}</span>
        {menu}
      </div>
      <PropertyBadges props={shown} path={path} files={files} clamp className="pt-1" onChange={onChange} options={options} onRemoveValue={onRemoveValue} valueCount={valueCount} scopeName={scopeName} chosen={chosen} onEditValue={onEditValue} dateKeys={dateKeys} badges={badges} />
      {text !== undefined && <TaskProgress {...taskProgress(text)} />}
    </div>
  )
})

// How many of the note's checklist items are ticked: a thin bar and "N/X", green once all are; nothing without any
function TaskProgress({ done, total }) {
  if (!total) return null
  return (
    <div className="flex items-center gap-2 pt-1" aria-label={`${done} of ${total} tasks done`}>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width]', done === total ? 'bg-success' : 'bg-primary')} style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{done}/{total}</span>
    </div>
  )
}

export default NoteCard
