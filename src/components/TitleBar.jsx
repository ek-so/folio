import FileIcon, { iconColor } from './FileIcon.jsx'
import { cn } from '@/lib/utils.js'

// Top of the content box: the item's file or folder icon in a tile tinted with
// the icon's color, then `crumbs` (PathBreadcrumbs: where the item is; the last
// crumb is the item). `badge` sits right after them; `children`: the item's
// actions on the right (⋯, then +, ✏️ or ✓). A border sets it apart from the
// content below.
export default function TitleBar({ path, dir, crumbs, badge, children }) {
  return (
    <div className="shrink-0 border-b border-border p-2">
      <div className="flex items-center gap-3">
        <span className={cn('flex size-control shrink-0 items-center justify-center rounded-sm bg-current/15', iconColor(path, dir))}>
          <FileIcon path={path} dir={dir} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">{crumbs}</div>
          {badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
