import { useMemo, useState } from 'react'
import { PencilSimple, Plus, ListBullets, Trash } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'
import RenameModal from '@/components/RenameModal.jsx'
import ConfirmModal from '@/components/ConfirmModal.jsx'
import EditListModal from '@/components/EditListModal.jsx'
import FileIcon from '@/components/FileIcon.jsx'
import NoteCard, { ownListeners, cardClick } from '@/components/NoteCard.jsx'
import { EmojiSubmenu } from '@/components/EmojiPicker.jsx'
import CopyLinkItem from '@/components/CopyLinkItem.jsx'
import { repoLink } from '@/lib/markdown.js'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDragSensors } from '@/hooks/useDragSensors.js'
import { cn, own, isPortaled } from '@/lib/utils.js'
import { displayName, itemsIn } from '@/lib/files.js'
import { fileItem } from '@/lib/folderNotes.js'
import { plural } from '@/lib/plural.js'
import { parsePinned, settingsOf, settingsWrite, addedItem, removedItem, replacedItem, reorderedItem, isPinnedFolder } from './pinned.js'
import { PinPicker } from './PinnedSetup.jsx'
import WidgetFrame from '@/components/WidgetFrame.jsx'
import MoreButton from '@/components/MoreButton.jsx'
import { EmptyMessage } from '@/components/EmptyState.jsx'

// The Pinned widget (pinned.js): "Pinned" and its ⋯ (Pin note or folder…, Edit pinned…: order them and take them out,
// Remove widget) on top, then a card for each pinned note or folder, in a grid like a planner day's (as many columns as
// fit, each at least 16rem; the cards of a row one height). Every card shows its icon (FileIcon: its emoji, else a note's or folder's
// icon); a note's is a board's card (NoteCard: title and description), a folder's has its name and how many items it holds
// where a description sits. A tap opens the note or folder; a card is dragged
// into another's place (when the widget can be saved). Its ⋯: Rename, Emoji, Copy link, Remove from widget (confirmed; the
// note or folder stays). One that's gone is dashed: a tap picks another in its place.
export default function PinnedWidget({ id, services, onRemove }) {
  const file = settingsOf(services.config.read, id)
  const settings = file.ready && file.text !== undefined ? parsePinned(file.text) : null
  const canEdit = services.canEdit && !!settings
  const change = next => ch => settingsWrite(services.config, id, next)(ch)
  const save = next => services.update(change(next))
  const [adding, setAdding] = useState(false)
  const [listing, setListing] = useState(false) // Edit pinned is open
  const [removing, setRemoving] = useState(null) // the index of the item whose removal is being confirmed
  const sensors = useDragSensors()
  const files = useMemo(() => Object.fromEntries(services.files.map(f => [f, true])), [services.files]) // as card links want them
  const folders = useMemo(() => new Set(services.folders), [services.folders])

  // A card dropped on another takes its place
  const onDragEnd = ({ active, over }) => {
    const paths = settings.items.map(n => n.path)
    const from = paths.indexOf(active.id)
    const to = over ? paths.indexOf(over.id) : -1
    if (from >= 0 && to >= 0 && from !== to) save(reorderedItem(settings, from, to))
  }

  // Only when its settings are read (WidgetFrame shows the other states)
  const body = () => !settings.items.length ? <EmptyMessage>Nothing pinned yet. Pin a note or folder from ⋯.</EmptyMessage>
    : (
      <DndContext sensors={canEdit ? sensors : []} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-space-sm">
          <SortableContext items={settings.items.map(n => n.path)} strategy={rectSortingStrategy}>
            {settings.items.map((entry, i) => (
              <PinnedCard
                key={entry.path} path={entry.path} services={services} files={files} canMove={canEdit}
                dir={isPinnedFolder(entry.path)} found={isPinnedFolder(entry.path) ? folders.has(entry.path) : !!files[entry.path]}
                onTakeOut={canEdit ? () => setRemoving(i) : null}
                onReplace={canEdit ? (to, first = ch => ch) => services.update(ch => change(replacedItem(settings, entry.path, to))(first(ch))) : null}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    )

  const menu = <>
    <DropdownMenuItem disabled={!canEdit} onSelect={() => setAdding(true)}><Plus /> Pin note or folder…</DropdownMenuItem>
    <DropdownMenuItem disabled={!canEdit || !settings.items.length} onSelect={() => setListing(true)}><ListBullets /> Edit pinned…</DropdownMenuItem>
  </>

  // Its dialogs sit beside its frame
  return <>
    <WidgetFrame
      title="Pinned" noun="Pinned widget" menu={menu} removeLabel="Remove widget" onRemove={onRemove} canEdit={services.canEdit}
      ready={file.ready} readable={!!settings}
    >{body}</WidgetFrame>
    {adding && (
      <PinPicker
        services={services}
        onPick={(path, first = ch => ch) => {
          setAdding(false)
          services.update(ch => change(addedItem(settings, path))(first(ch)))
        }}
        onClose={() => setAdding(false)}
      />
    )}
    {listing && settings && (
      <EditListModal
        title="Edit pinned"
        description="Drag them into order. Taking one out keeps the note or folder."
        items={settings.items.map(n => ({ id: n.path, icon: <FileIcon path={n.path} dir={isPinnedFolder(n.path)} />, title: displayName(n.path) }))}
        onMove={(from, to) => save(reorderedItem(settings, from, to))}
        onRemove={item => setRemoving(settings.items.findIndex(n => n.path === item.id))}
        empty="Nothing pinned"
        onClose={() => setListing(false)}
      />
    )}
    {removing !== null && settings?.items[removing] && (
      <ConfirmModal
        title={`Remove “${displayName(settings.items[removing].path)}” from this widget?`}
        description={`The ${isPinnedFolder(settings.items[removing].path) ? 'folder' : 'note'} itself stays.`}
        onConfirm={() => { save(removedItem(settings, removing)); setRemoving(null) }}
        onClose={() => setRemoving(null)}
      />
    )}
  </>
}

// One pinned note's or folder's card (`dir`: a folder), dragged into another's place (`canMove`). `found`: it's in the
// repo; a gone one is dashed, and a tap picks another in its place (`onReplace(path, first)`; null when it can't be saved).
// `onTakeOut` (null: it can't be) asks to remove it from the widget
function PinnedCard({ path, dir, found, services, files, canMove, onTakeOut, onReplace }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: path, disabled: !canMove })
  const [renaming, setRenaming] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const item = dir ? { path, name: path.split('/').pop(), type: 'dir' } : fileItem(path)
  // A note's card opens the note (or a link in its description what that points to), a folder's the folder
  const open = !found ? () => { if (onReplace) setReplacing(true) }
    : dir ? e => { if (!isPortaled(e)) services.openFolder(path) }
    : cardClick(path, files, services.openFile, services.openFolder)
  const menu = (
    <div className="contents" {...own}>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <MoreButton inRow reveal aria-label={`Actions for ${displayName(path)}`} className="-my-1.5 -mr-1.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem disabled={!found} onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
          {found && <EmojiSubmenu path={path} onDone={() => setMenuOpen(false)} />}
          <CopyLinkItem link={repoLink(path)} disabled={!found} />
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={!onTakeOut} onSelect={onTakeOut}><Trash /> Remove from widget</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {renaming && (
        <RenameModal
          item={item}
          onRename={(name, title) => {
            const error = services.rename(item, name, title)
            if (!error) setRenaming(false)
            return error
          }}
          onClose={() => setRenaming(false)}
        />
      )}
      {replacing && (
        <PinPicker title={`Select ${dir ? 'folder' : 'note'}`} services={services} onPick={(to, first) => { setReplacing(false); onReplace(to, first) }} onClose={() => setReplacing(false)} />
      )}
    </div>
  )
  const detail = !found ? `This ${dir ? 'folder' : 'note'} is gone.${onReplace ? ' Tap to select another.' : ''}`
    : dir ? plural(itemsIn(path, services.files, services.folders), 'item') : undefined
  return (
    <NoteCard
      ref={setNodeRef}
      path={path} text={dir || !found ? undefined : services.notes[path]} files={files} menu={menu} detail={detail} progress={false}
      icon={<span className="flex h-5 items-center"><FileIcon path={path} dir={dir} /></span>}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(!found && 'border-dashed border-muted-foreground/50', isDragging && 'opacity-40')}
      onClick={open}
      {...attributes} aria-disabled={undefined} {...ownListeners(listeners)}
    />
  )
}
