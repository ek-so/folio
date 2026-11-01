import { Folder, FileText, FilePdf, FileImage, File } from '@phosphor-icons/react'
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
export default function FileIcon({ path, dir, emoji }) {
  if (emoji) return <span className="flex size-5 shrink-0 items-center justify-center text-lg">{emoji}</span>
  const [Icon, color] = dir ? [Folder, 'text-primary'] : ICONS[fileKind(path)]
  return <Icon className={cn('size-5 shrink-0', color)} />
}
