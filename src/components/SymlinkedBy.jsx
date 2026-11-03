import { ArrowUpRight } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'

// In the title bar of a file or folder that symlinks point to: a ↗ button styled
// like ⋯. One link opens it directly; several open a list of their paths.
// Choosing one calls onOpen with the link's path.
const buttonClass = 'shrink-0 border-muted-foreground/50'

export default function SymlinkedBy({ links, onOpen }) {
  if (!links?.length) return null
  if (links.length === 1) {
    return (
      <Button variant="ghost-outline" size="icon" title={`Symlink: ${links[0]}`} aria-label={`Symlink: ${links[0]}`} onClick={() => onOpen(links[0])} className={buttonClass}>
        <ArrowUpRight />
      </Button>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-outline" size="icon" title={`${links.length} symlinks point here`} aria-label={`${links.length} symlinks point here`} className={buttonClass}>
          <ArrowUpRight />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-[calc(100vw-2rem)]" onCloseAutoFocus={e => e.preventDefault()}>
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
