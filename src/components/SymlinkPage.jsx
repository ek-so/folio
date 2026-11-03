import { LinkSimple } from '@phosphor-icons/react'
import FilePage from './FilePage.jsx'

// A symlinked file, opened: not editable; its content is the link to the
// source, which opens the source itself.
export default function SymlinkPage({ path, source, onOpenFile, ...page }) {
  return (
    <FilePage path={path} name={path.split('/').pop()} {...page}>
      <div className="flex items-center gap-2 px-5 py-4 text-base">
        <LinkSimple className="shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">symlink →</span>
        <button type="button" onClick={() => onOpenFile(source)} className="min-w-0 truncate text-primary hover:underline">
          {source}
        </button>
      </div>
    </FilePage>
  )
}
