import { ArrowUpRight, CaretDown } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

const nameOf = path => path.split('/').pop()

// In the header of a file or folder that symlinks point to: ↗ and the link's
// name, or ↗ and how many links, opening a list of them. Choosing one calls
// onOpen with the link's path.
export default function SymlinkedBy({ links, onOpen }) {
  if (!links?.length) return null
  if (links.length === 1) {
    return (
      <Button variant="ghost" title={`Symlink: ${links[0]}`} onClick={() => onOpen(links[0])} className="min-w-0 gap-1.5 px-2 font-normal text-muted-foreground">
        <ArrowUpRight />
        <span className="truncate">{nameOf(links[0])}</span>
      </Button>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={`${links.length} symlinks point here`} className="shrink-0 gap-1.5 px-2 font-normal text-muted-foreground">
          <ArrowUpRight />
          {links.length}
          <CaretDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-[calc(100vw-2rem)]" onCloseAutoFocus={e => e.preventDefault()}>
        {links.map(link => (
          <DropdownMenuItem key={link} onSelect={() => onOpen(link)}>
            <ArrowUpRight />
            <span className="truncate">{link}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
