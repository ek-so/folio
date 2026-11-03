import { Fragment } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import FileIcon from './FileIcon.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from './ui/breadcrumb.jsx'

// Breadcrumbs in the title bar: the repo is always the first level, then the
// folders. Every level has its own icon (`dir`: the last one is a folder, not a
// file) and is a button, the current one (last) just text.
// `current` overrides the last crumb's name (used in Editor for the display name).
// `changed` shows an unsaved-changes dot on the last crumb.
// On narrow screens, anywhere below the repo, they collapse into one dropdown
// (current name ▾) listing every level, repo first, as an indented tree, the current one checked.
// Collapsed dropdown tree: item padding and the indent per level (rem)
const TREE_PAD = 0.75
const TREE_STEP = 1.125

export default function PathBreadcrumbs({ root, path, dir, current, changed, onNavigate }) {
  const parts = path.split('/').filter(Boolean)
  const crumbs = [
    { name: root, path: '' },
    ...parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') })),
  ]
  crumbs.forEach((crumb, i) => { crumb.dir = i < crumbs.length - 1 || dir })
  if (current) crumbs[crumbs.length - 1].name = current
  const last = crumbs[crumbs.length - 1]
  const collapsible = crumbs.length >= 2
  const dot = changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
  return (
    <Breadcrumb>
      {collapsible && (
        <div className="flex items-center sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="md" className="min-w-0 font-normal">
                <FileIcon path={last.path} dir={last.dir} />
                <span className="truncate">{last.name}</span>
                {dot}
                <CaretDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-[calc(100vw-2rem)]" onCloseAutoFocus={e => e.preventDefault()}>
              {crumbs.map((crumb, depth) => (
                <DropdownMenuItem
                  key={crumb.path}
                  onSelect={() => crumb !== last && onNavigate(crumb.path)}
                  style={{ paddingLeft: `calc(${TREE_PAD}rem + ${depth * TREE_STEP}rem)` }}
                >
                  {/* └ hanging from the parent's first letter down to this row */}
                  {depth > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-2 h-[calc(50%+0.5rem)] rounded-bl-sm border-b border-l border-muted-foreground/60"
                      style={{ left: `${TREE_PAD + (depth - 1) * TREE_STEP}rem`, width: `${TREE_STEP - 0.375}rem` }}
                    />
                  )}
                  <span className="truncate">{crumb.name}</span>
                  {crumb === last && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
        <BreadcrumbList className={cn('flex-nowrap text-base', collapsible && 'max-sm:hidden')}>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.path}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="flex h-control-md items-center gap-2 px-2 text-foreground">
                    <FileIcon path={crumb.path} dir={crumb.dir} />
                    <span className="truncate max-w-40">{crumb.name}</span>
                    {dot}
                  </span>
                ) : (
                  <Button variant="ghost" size="md" className="font-normal" onClick={() => onNavigate(crumb.path)}>
                    <FileIcon path={crumb.path} dir />
                    <span className="truncate max-w-40">{crumb.name}</span>
                  </Button>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
  )
}
