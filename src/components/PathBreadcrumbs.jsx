import { Fragment } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx'

// Breadcrumbs in the fixed header: the repo (bold) is always the first level,
// then the folders. Every level but the last is a link.
// `current` overrides the last crumb's name (used in Editor for the display name).
// `changed` shows an unsaved-changes dot on the last crumb.
// On narrow screens, with 2+ levels below the repo, they collapse into one dropdown
// (current name ▾) listing every level, repo first, as an indented tree, the current one checked.
// Collapsed dropdown tree: item padding and the indent per level (rem)
const TREE_PAD = 0.75
const TREE_STEP = 1.125

export default function PathBreadcrumbs({ root, path, current, changed, onNavigate }) {
  const parts = path.split('/').filter(Boolean)
  const crumbs = [
    { name: root, path: '' },
    ...parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') })),
  ]
  if (current) crumbs[crumbs.length - 1].name = current
  const last = crumbs[crumbs.length - 1]
  const collapsible = crumbs.length >= 3
  const dot = changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
  return (
    <Breadcrumb>
      {collapsible && (
        <div className="flex items-center sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="min-w-0 gap-1.5 px-2 font-normal">
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
                  <span className={cn('truncate', depth === 0 ? 'font-bold' : crumb === last && 'font-medium')}>{crumb.name}</span>
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
                  <BreadcrumbPage className={cn(i === 0 && 'font-bold')}>
                    {crumb.name}
                    {dot}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button onClick={() => onNavigate(crumb.path)}>
                      <span className={cn('truncate max-w-40', i === 0 && 'font-bold')}>{crumb.name}</span>
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
  )
}
