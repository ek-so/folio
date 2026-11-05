import { Folder, FileText, FilePdf, FileImage, File, ArrowUpRight } from '@phosphor-icons/react'
import { fileKind } from '../lib/files.js'
import { cn } from '@/lib/utils.js'

const ICONS = {
  note: [FileText, 'text-primary'],
  pdf: [FilePdf, 'text-destructive'],
  image: [FileImage, 'text-file-image'],
  file: [File, 'text-primary'],
}

// Text color of an item's icon
const iconColor = (path, dir) => dir ? 'text-folder' : ICONS[fileKind(path)][1]

// Icon for a list row: yellowish folder, or the file's type (blue note or file,
// red PDF, green image).
// `link`: a symlink — the icon of what it points to (`path` / `dir`), with a
// small ↗ in the corner, like an alias on a Mac.
// `large`: 48px, for cards.
export default function FileIcon({ path, dir, link, large }) {
  const Icon = dir ? Folder : ICONS[fileKind(path)][0]
  const color = iconColor(path, dir)
  const size = large ? 'size-12' : 'size-5'
  if (!link) return <Icon className={cn(size, 'shrink-0', color)} />
  return (
    <span className={cn('relative flex shrink-0', size)}>
      <Icon className={cn(size, color)} />
      <span className="absolute -bottom-0.5 -left-0.5 flex size-2.5 items-center justify-center rounded-[3px] bg-background text-foreground">
        <ArrowUpRight weight="bold" className="size-2" />
      </span>
    </span>
  )
}
