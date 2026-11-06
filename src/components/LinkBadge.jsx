import { useState } from 'react'
import { DotsThree, Globe, FileText, File, Folder, LinkBreak, LinkSimple, PencilSimple, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'

const REPO_ICONS = { note: FileText, file: File, folder: Folder, missing: LinkBreak }

// A website's favicon (Google's favicon service), a globe while offline or when it has none
function Favicon({ href }) {
  const [failed, setFailed] = useState(false)
  let host = ''
  try { host = new URL(href).hostname } catch { /* not a web address */ }
  if (!host || failed) return <Globe className="size-4 shrink-0 text-muted-foreground" />
  return <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`} alt="" className="size-4 shrink-0 rounded-[3px]" onError={() => setFailed(true)} />
}

// A link in the note preview: a badge with the site's favicon (or what it points to in the repo,
// grey when it's missing) and its text, opening it on a tap (MarkdownPreview's link handler), and
// a ⋯ with Copy link address, Edit link and Remove (the last two only with `onEdit` / `onRemove`).
export default function LinkBadge({ href, text, kind, onCopy, onEdit, onRemove }) {
  const [open, setOpen] = useSingleOpen()
  const Icon = REPO_ICONS[kind]
  return (
    <Badge className={cn('link-badge gap-0 py-0 pr-0 align-middle', kind === 'missing' && 'text-muted-foreground')}>
      <a href={href} data-badge className="flex min-w-0 items-center gap-1.5">
        {Icon ? <Icon className={cn('size-4 shrink-0', kind === 'missing' ? 'text-muted-foreground' : 'text-primary')} /> : <Favicon href={href} />}
        <span className="truncate">{text}</span>
      </a>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Link actions" className="size-control-sm shrink-0 text-muted-foreground hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10">
            <DotsThree weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem onSelect={onCopy}><LinkSimple /> Copy link address</DropdownMenuItem>
          {onEdit && <DropdownMenuItem onSelect={onEdit}><PencilSimple /> Edit link</DropdownMenuItem>}
          {onRemove && <DropdownMenuItem variant="destructive" onSelect={onRemove}><Trash /> Remove</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </Badge>
  )
}
