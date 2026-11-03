import { Folder, FileText, FilePdf, FileImage, File, ArrowUpRight } from '@phosphor-icons/react'
import { fileKind } from '../lib/files.js'
import { cn } from '@/lib/utils.js'

const ICONS = {
  note: [FileText, 'text-primary'],
  pdf: [FilePdf, 'text-destructive'],
  image: [FileImage, 'text-file-image'],
  file: [File, 'text-primary'],
}

// Color class of an item's icon (the title bar tints its tile with it).
export const iconColor = (path, dir) => (dir ? 'text-folder' : ICONS[fileKind(path)][1])

// Icon for a list row: yellowish folder, or the file's type (blue note or file,
// red PDF, green image).
// `link`: a symlink — the icon of what it points to (`path` / `dir`), with a
// small ↗ in the corner, like an alias on a Mac.
export default function FileIcon({ path, dir, link }) {
  const Icon = dir ? Folder : ICONS[fileKind(path)][0]
  const color = iconColor(path, dir)
  if (!link) return <Icon className={cn('size-5 shrink-0', color)} />
  return (
    <span className="relative flex size-5 shrink-0">
      <Icon className={cn('size-5', color)} />
      <span className="absolute -bottom-0.5 -left-0.5 flex size-2.5 items-center justify-center rounded-[3px] bg-background text-foreground">
        <ArrowUpRight weight="bold" className="size-2" />
      </span>
    </span>
  )
}
