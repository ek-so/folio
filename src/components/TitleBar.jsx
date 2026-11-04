import FileIcon, { iconColor } from './FileIcon.jsx'
import { pageInfo } from '../lib/pages.js'
import { NavDrawerButton } from './NavTree.jsx'
import { cn } from '@/lib/utils.js'

// Top of the content box: with `tree`, on phones the file-tree button; then the
// item's icon (a file or folder's in a 32px tinted tile; a page's alone) and its name (`changed`:
// unsaved dot). An app page (`page`: Home, Settings…) has its own icon and title;
// `badge` right after; `children`: the item's actions on the right (⋯, then +,
// ✏️ or ✓). A border sets it apart from the content below.
export default function TitleBar({ tree, page, path, dir, name, changed, badge, children }) {
  const info = page && pageInfo(page)
  return (
    <div className="shrink-0 border-b border-border p-space-sm">
      <div className="flex min-h-control items-center gap-3">
        {tree && <NavDrawerButton />}
        <span className={cn('flex shrink-0', info ? 'text-primary' : cn('size-control-md items-center justify-center rounded-sm bg-current/15', iconColor(path, dir)))}>
          {info ? <info.icon className="size-5" /> : <FileIcon path={path} dir={dir} />}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="min-w-0 truncate text-base font-bold">{info ? info.title : name}</h1>
          {changed && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          {badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
