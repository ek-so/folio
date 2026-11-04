import FileIcon, { iconColor } from './FileIcon.jsx'
import { NavDrawerButton } from './NavTree.jsx'
import { cn } from '@/lib/utils.js'

// Top of the content box: on phones the file-tree button, then the item's icon
// in a tile tinted with the icon's color and its name (`changed`: unsaved dot),
// `badge` right after; `children`: the item's actions on the right (⋯, then +,
// ✏️ or ✓). A border sets it apart from the content below.
export default function TitleBar({ path, dir, name, changed, badge, children }) {
  return (
    <div className="shrink-0 border-b border-border p-2">
      <div className="flex items-center gap-3">
        <NavDrawerButton />
        <span className={cn('flex size-control shrink-0 items-center justify-center rounded-sm bg-current/15', iconColor(path, dir))}>
          <FileIcon path={path} dir={dir} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="min-w-0 truncate text-base font-bold">{name}</h1>
          {changed && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          {badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
