import { useState } from 'react'
import { DotsThree, Globe, FileText, File, Folder, LinkBreak, LinkSimple, PencilSimple, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn, own } from '@/lib/utils.js'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { useSingleOpen } from '../hooks/useSingleOpen.jsx'
import { urlForView } from '../lib/url.js'

const REPO_ICONS = { note: FileText, file: File, folder: Folder, missing: LinkBreak }

// A website's favicon (Google's favicon service), a globe while offline or when it has none
function Favicon({ href }) {
  const [failed, setFailed] = useState(false)
  let host = ''
  try { host = new URL(href).hostname } catch { /* not a web address */ }
  if (!host || failed) return <Globe className="size-4 shrink-0 text-muted-foreground" />
  return <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`} alt="" className="size-4 shrink-0 rounded-[3px]" onError={() => setFailed(true)} />
}

// A link in the note preview or a description (InlineMarkdown): a badge with the site's favicon, or what
// it points to in the repo (grey when it's missing), and its text, a bit softer than the note's. A tap
// opens it (whoever shows it handles that). Beside it, split off by a 1px gap, a ⋯ of its own (`own`: a
// click on it never opens a board card) with Copy link address, Edit link and Remove (the last two only
// with `onEdit` / `onRemove`).
export default function LinkBadge({ href, text, kind, path, onEdit, onRemove }) {
  // A link into the repo is copied as the app's address of what it points to (in File manager)
  const address = path ? location.origin + urlForView(import.meta.env.BASE_URL, kind === 'folder' ? { folder: path } : { file: path }) : href
  const copy = () => navigator.clipboard.writeText(address).then(() => toast.success('Link address copied'), () => toast.error("Couldn't copy the link address"))
  const [open, setOpen] = useSingleOpen()
  const Icon = REPO_ICONS[kind]
  return (
    <span className="link-badge inline-flex max-w-full gap-px align-middle">
      <Badge as="a" href={href} data-badge className={cn('gap-1.5 rounded-r-none py-0 pl-2', kind === 'missing' ? 'text-muted-foreground' : 'text-foreground/75')}>
        {Icon ? <Icon className={cn('size-4 shrink-0', kind === 'missing' ? 'text-muted-foreground' : 'text-primary')} /> : <Favicon href={href} />}
        <span className="truncate">{text}</span>
      </Badge>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="Link actions" {...own} className="size-control-sm shrink-0 rounded-l-none rounded-r-full text-muted-foreground shadow-none">
            <DotsThree weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem onSelect={copy}><LinkSimple /> Copy link address</DropdownMenuItem>
          {onEdit && <DropdownMenuItem onSelect={onEdit}><PencilSimple /> Edit link</DropdownMenuItem>}
          {onRemove && <DropdownMenuItem variant="destructive" onSelect={onRemove}><Trash /> Remove</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
