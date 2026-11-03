import { Folder, FileText, FilePdf, FileImage, File, ArrowUpRight } from '@phosphor-icons/react'
import { fileKind } from '../lib/files.js'
import { cn } from '@/lib/utils.js'

const ICONS = {
  note: [FileText, 'text-muted-foreground'],
  pdf: [FilePdf, 'text-destructive'],
  image: [FileImage, 'text-file-image'],
  file: [File, 'text-muted-foreground'],
}

// Icon for a list row: blue folder, or the file's type (grey note or file,
// red PDF, green image). A note whose heading starts with an emoji shows it.
// `link`: a symlink — the icon of what it points to (`path` / `dir`), with a
// small ↗ in the corner, like an alias on a Mac.
export default function FileIcon({ path, dir, emoji, link }) {
  if (emoji && !link) return <span className="flex size-5 shrink-0 items-center justify-center text-lg">{emoji}</span>
  const [Icon, color] = dir ? [Folder, 'text-primary'] : ICONS[fileKind(path)]
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
