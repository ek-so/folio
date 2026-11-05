import { Folder, FileText, FilePdf, FileImage, File, ArrowUpRight } from '@phosphor-icons/react'
import { fileKind } from '../lib/files.js'
import { cn } from '@/lib/utils.js'

// kind: [icon, icon color, card tint (light, darker on hover)]
const ICONS = {
  note: [FileText, 'text-primary', 'bg-primary/10 hover:bg-primary/20'],
  pdf: [FilePdf, 'text-destructive', 'bg-destructive/10 hover:bg-destructive/20'],
  image: [FileImage, 'text-file-image', 'bg-file-image/10 hover:bg-file-image/20'],
  file: [File, 'text-primary', 'bg-primary/10 hover:bg-primary/20'],
}
const FOLDER_TINT = 'bg-folder/10 hover:bg-folder/20'

// Card background matching the icon's color
export const iconTint = (path, dir) => dir ? FOLDER_TINT : ICONS[fileKind(path)][2]

// Text color of an item's icon
const iconColor = (path, dir) => dir ? 'text-folder' : ICONS[fileKind(path)][1]

// Icon for a list row: yellowish folder, or the file's type (blue note or file,
// red PDF, green image).
// `link`: a symlink — the icon of what it points to (`path` / `dir`), with a
// small ↗ in the corner, like an alias on a Mac.
// `large`: 24px, for cards.
export default function FileIcon({ path, dir, link, large }) {
  const Icon = dir ? Folder : ICONS[fileKind(path)][0]
  const color = iconColor(path, dir)
  const size = large ? 'size-6' : 'size-5'
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
