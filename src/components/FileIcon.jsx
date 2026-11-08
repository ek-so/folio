import { Folder, FileText, FilePdf, FileImage, File, ArrowUpRight } from '@phosphor-icons/react'
import { fileKind } from '../lib/files.js'
import { cn } from '@/lib/utils.js'
import { emojiColor } from '../lib/emojiColor.js'
import { useIconsContext } from '../hooks/useIcons.js'

// kind: [icon, icon color, tint of the square behind a card's icon (light, darker while its card is hovered)]
const ICONS = {
  note: [FileText, 'text-primary', 'bg-primary/10 group-hover:bg-primary/20'],
  pdf: [FilePdf, 'text-destructive', 'bg-destructive/10 group-hover:bg-destructive/20'],
  image: [FileImage, 'text-file-image', 'bg-file-image/10 group-hover:bg-file-image/20'],
  file: [File, 'text-primary', 'bg-primary/10 group-hover:bg-primary/20'],
}
const FOLDER_TINT = 'bg-folder/10 group-hover:bg-folder/20'

// Background of the square behind a card's icon, matching the icon's color: { className, style }. An emoji's square takes
// the emoji's own color (lib/emojiColor.js: a light mix of it, darker while its card is hovered).
export function iconTint(path, dir, emoji) {
  const color = emoji && emojiColor(emoji)
  if (color) return { className: 'bg-[color-mix(in_srgb,var(--tint)_14%,transparent)] group-hover:bg-[color-mix(in_srgb,var(--tint)_26%,transparent)]', style: { '--tint': `rgb(${color})` } }
  return { className: dir ? FOLDER_TINT : ICONS[fileKind(path)][2] }
}

// Text color of an item's icon
const iconColor = (path, dir) => dir ? 'text-folder' : ICONS[fileKind(path)][1]

// Icon for a list row: yellowish folder, or the file's type (accent-colored note or file,
// red PDF, green image).
// `link`: a symlink — the icon of what it points to (`path` / `dir`), with a
// small ↗ in the corner, like an alias on a Mac.
// `large`: 24px, for cards.
// A file or folder with an emoji (lib/icons.js) shows it in place of its type icon (a link's: its source's).
export default function FileIcon({ path, dir, link, large }) {
  const emoji = useIconsContext().iconOf(path)
  const Type = dir ? Folder : ICONS[fileKind(path)][0]
  const size = large ? 'size-6' : 'size-5'
  const icon = emoji
    ? <span aria-hidden className={cn(size, 'flex shrink-0 items-center justify-center leading-none', large ? 'text-xl' : 'text-base')}>{emoji}</span>
    : <Type className={cn(size, 'shrink-0', iconColor(path, dir))} />
  if (!link) return icon
  return (
    <span className={cn('relative flex shrink-0', size)}>
      {icon}
      <span className="absolute -bottom-0.5 -left-0.5 flex size-2.5 items-center justify-center rounded-[3px] bg-background text-foreground">
        <ArrowUpRight weight="bold" className="size-2" />
      </span>
    </span>
  )
}
