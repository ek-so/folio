import { ArrowDownRight } from '@phosphor-icons/react'
import { Badge } from './ui/badge.jsx'
import { Tip } from './ui/tooltip.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

// In the title bar of a file or folder that symlinks point to: a grey badge (`Badge` as a button) with ↘.
// One link shows ↘ and its name and opens it directly; several show a count and open a list of their paths.
// Choosing one calls onOpen with the link's path.
const nameOf = path => path.split('/').pop()
const badgeClass = 'shrink-0 cursor-pointer text-muted-foreground hover:bg-muted-foreground/15 data-[state=open]:bg-muted-foreground/15 [&_svg]:size-4 [&_svg]:shrink-0'

export default function SymlinkedBy({ links, onOpen }) {
  if (!links?.length) return null
  if (links.length === 1) {
    return (
      <Tip content={`Symlink: ${links[0]}`}>
        <Badge as="button" type="button" aria-label={`Symlink: ${links[0]}`} onClick={() => onOpen(links[0])} className={`${badgeClass} min-w-0`}>
          <ArrowDownRight />
          <span className="truncate">{nameOf(links[0])}</span>
        </Badge>
      </Tip>
    )
  }
  return (
    <DropdownMenu>
      <Tip content={`${links.length} symlinks point here`}>
        <DropdownMenuTrigger asChild>
          <Badge as="button" type="button" aria-label={`${links.length} symlinks point here`} className={badgeClass}>
            <ArrowDownRight />
            {links.length}
          </Badge>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" className="max-w-[calc(100vw-2rem)]" onCloseAutoFocus={e => e.preventDefault()}>
        {links.map(link => (
          <DropdownMenuItem key={link} onSelect={() => onOpen(link)}>
            <ArrowDownRight />
            <span className="truncate">{link}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
