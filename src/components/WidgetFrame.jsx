import { useState } from 'react'
import { DotsThree, X, FolderOpen } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.jsx'
import Spinner from './Spinner.jsx'
import EmptyState from './EmptyState.jsx'
import FolderSheet from './FolderSheet.jsx'

// What every widget on a view is framed by (board, planner, notes): its title row, then its body in one of its states.
// Title row: `title` (bold) with `subtitle` under it (muted: a widget's folder), then `controls` (the widget's own, such
// as the planner's calendar / list) and ⋯: the widget's own `menu` items, a separator and `removeLabel` (red, X;
// `onRemove`, disabled without `canEdit`). Body: a spinner until `ready`; "This `noun`'s settings can't be read."
// when not `readable`; with `folder` ({ name, missing, folders, sheetTitle, sheetText, onPick }) gone, "Its folder … is gone."
// and Select folder (FolderSheet: another folder for it); else `children()` (only called then: it may rely on the
// settings). `className` goes on the frame (the Notes widget's container query).
export default function WidgetFrame({ title, subtitle, noun, controls, menu, removeLabel, onRemove, canEdit, ready, readable, folder, className, children }) {
  const [relocating, setRelocating] = useState(false) // picking another folder, its own being gone
  const body = !ready ? <div className="flex justify-center py-12"><Spinner /></div>
    : !readable ? <p className="py-6 text-center text-sm text-muted-foreground">This {noun}'s settings can't be read.</p>
    : folder?.missing ? <EmptyState message={`Its folder “${folder.name}” is gone.`} action={{ label: 'Select folder', icon: <FolderOpen />, onClick: () => setRelocating(true), disabled: !canEdit }} />
    : children()
  return (
    <section className={cn('flex shrink-0 flex-col gap-space-sm', className)}>
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="flex min-w-0 flex-1 flex-col px-space-xs">
          <span className="truncate text-base font-bold">{title}</span>
          {subtitle !== undefined && <span className="truncate text-sm text-muted-foreground">{subtitle}</span>}
        </h2>
        {controls}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost-outline" size="icon" aria-label={`${noun[0].toUpperCase()}${noun.slice(1)} actions`} className="shrink-0 border-muted-foreground/50">
              <DotsThree weight="bold" size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            {menu}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!canEdit} onSelect={onRemove}><X /> {removeLabel}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {body}
      {relocating && folder && (
        <FolderSheet title={folder.sheetTitle} folders={folder.folders} onPick={name => { folder.onPick(name); return null }} onClose={() => setRelocating(false)}>
          <p className="text-muted-foreground text-xs">{folder.sheetText}</p>
        </FolderSheet>
      )}
    </section>
  )
}
