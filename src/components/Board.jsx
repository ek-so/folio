import { DotsThree, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import PropertyBadges from './PropertyBadges.jsx'
import Spinner from './Spinner.jsx'
import { displayName } from '../lib/files.js'
import { frontMatter, valueList } from '../lib/frontmatter.js'
import { DESCRIPTION } from '../lib/board.js'

// A board widget (lib/board.js): its folder's name and ⋯ on top, then its
// columns side by side, scrolling sideways; No status first while it has
// cards. A card shows the file's name, its description and the values of the
// board's chosen properties; tapping it opens the file. `board` its settings,
// `data` what it shows (boardColumns); `ready` false while its settings load.
export default function Board({ ready, board, data, title, notes, canEdit, actions, onRemove }) {
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" aria-label="Board actions" className="shrink-0 border-muted-foreground/50">
          <DotsThree weight="bold" size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
        <DropdownMenuItem variant="destructive" disabled={!canEdit} onSelect={onRemove}><Trash /> Remove board</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return (
    <section className="flex shrink-0 flex-col gap-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        <h2 className="min-w-0 flex-1 truncate px-space-xs text-base font-bold">{title}</h2>
        {menu}
      </div>
      {!ready ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !board ? (
        <p className="py-6 text-center text-sm text-muted-foreground">This board's settings can't be read.</p>
      ) : data.missing ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Its folder “{board.folder}” is gone.</p>
      ) : (
        <div className="-mx-space flex items-start gap-space-sm overflow-x-auto px-space pb-space-sm">
          {data.loose.length > 0 && <Column name="No status" cards={data.loose} notes={notes} board={board} onOpen={actions.onOpenFile} />}
          {data.columns.map(c => <Column key={c.path} name={c.name} cards={c.cards} notes={notes} board={board} onOpen={actions.onOpenFile} />)}
          {!data.columns.length && !data.loose.length && (
            <p className="py-6 text-sm text-muted-foreground">No columns yet: its subfolders become columns.</p>
          )}
        </div>
      )}
    </section>
  )
}

function Column({ name, cards, notes, board, onOpen }) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-space-sm rounded-lg bg-secondary/60 p-space-sm">
      <div className="flex min-h-control-md items-center gap-space-sm px-space-xs">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</h3>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>
      {cards.map(c => <Card key={c.path} path={c.path} text={notes[c.path]} board={board} onOpen={onOpen} />)}
    </div>
  )
}

function Card({ path, text, board, onOpen }) {
  const props = text === undefined ? [] : frontMatter(text)?.props ?? []
  const description = valueList(props.find(p => p.key === DESCRIPTION)?.value ?? '').join(', ')
  const shown = board.properties.flatMap(key => props.filter(p => p.key === key))
  return (
    <button
      type="button"
      onClick={() => onOpen(path)}
      className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left shadow-sm outline-none transition-colors hover:bg-secondary/40 focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span className="break-words text-sm font-medium">{displayName(path)}</span>
      {description && <span className="line-clamp-3 break-words text-xs text-muted-foreground">{description}</span>}
      <PropertyBadges props={shown} className="pt-1" />
    </button>
  )
}
