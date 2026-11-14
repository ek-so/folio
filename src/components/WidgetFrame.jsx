import { createContext, useContext, useState } from 'react'
import { Trash, FolderOpen, PencilSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import Loading from './Loading.jsx'
import EmptyState from './EmptyState.jsx'
import FolderSheet from './FolderSheet.jsx'
import MoreMenu from './MoreMenu.jsx'
import { EmptyMessage } from './EmptyState.jsx'

// What the view (ViewPage) tells each widget's frame: its own `name` (Rename in its ⋯; none: the kind's title) and
// `onRename()` (null while the view can't be saved)
export const WidgetContext = createContext(null)

// What every widget on a view is framed by (board, planner, pinned): its title row, then its body in one of its states.
// Title row: its name (WidgetContext's, else `title`; bold) with `subtitle` under it (muted: a widget's folder), then
// `controls` (the widget's own, such as the planner's calendar / list) and ⋯ (MoreMenu): the widget's
// own `menu` items, then Rename (WidgetContext's `onRename`), then Remove widget (red, Trash; `onRemove`, disabled
// without `canEdit`). Body: a spinner until `ready`; "This `noun`'s settings can't be read."
// when not `readable`; with `folder` ({ name, missing, folders, sheetTitle, sheetText, onPick }) gone, "Its folder … is gone."
// and Select folder (FolderSheet: another folder for it); else `children()` (only called then: it may rely on the
// settings). `className` goes on the frame.
export default function WidgetFrame({ title, subtitle, noun, controls, menu, onRemove, canEdit, ready, readable, folder, className, children }) {
  const [relocating, setRelocating] = useState(false) // picking another folder, its own being gone
  const own = useContext(WidgetContext)
  const body = !ready ? <Loading rows={3} className="p-0" />
    : !readable ? <EmptyMessage>This {noun}'s settings can't be read.</EmptyMessage>
    : folder?.missing ? <EmptyState message={`Its folder “${folder.name}” is gone.`} action={{ label: 'Select folder', icon: <FolderOpen />, onClick: () => setRelocating(true), disabled: !canEdit }} />
    : children()
  return (
    <section className={cn('flex shrink-0 flex-col gap-space-sm', className)}>
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="flex min-w-0 flex-1 flex-col px-space-xs">
          <span className="truncate text-base font-bold">{own?.name ?? title}</span>
          {subtitle !== undefined && <span className="truncate text-sm text-muted-foreground">{subtitle}</span>}
        </h2>
        {controls}
        <MoreMenu
          label={`${noun[0].toUpperCase()}${noun.slice(1)} actions`}
          sections={[
            menu,
            own && <DropdownMenuItem disabled={!own.onRename} onSelect={own.onRename}><PencilSimple /> Rename</DropdownMenuItem>,
            <DropdownMenuItem variant="destructive" disabled={!canEdit} onSelect={onRemove}><Trash /> Remove widget</DropdownMenuItem>,
          ]}
        />
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
