import { LinkSimple } from '@phosphor-icons/react'

// Above a symlinked note or file: "🔗 symlink → path/to/source", the path an
// inner link that opens the source.
export default function SymlinkNotice({ source, onOpen }) {
  return (
    <div className="flex items-center gap-1.5 px-5 pt-3 text-sm text-muted-foreground">
      <LinkSimple className="size-4 shrink-0" />
      <span>symlink →</span>
      <button type="button" onClick={() => onOpen(source)} className="min-w-0 truncate text-primary hover:underline">
        {source}
      </button>
    </div>
  )
}
