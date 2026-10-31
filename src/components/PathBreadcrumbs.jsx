import { Fragment } from 'react'
import { House, CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx'

// Breadcrumbs in the fixed header. Every level but the last is a link.
// `current` overrides the last crumb's name (used in Editor for the display name).
// `changed` shows an unsaved-changes dot on the last crumb.
// On narrow screens, with 2+ levels below home, the levels collapse into one dropdown
// (current name ▾) listing every level, the current one checked.
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
  const home = (
    <Button variant="ghost-outline" size="icon" className="shrink-0 border-muted-foreground/50" onClick={() => onNavigate('')}>
      <House />
    </Button>
  )

  return (
    <Breadcrumb>
      {collapsible && (
        <div className="flex items-center gap-1.5 sm:hidden">
          {home}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="min-w-0 gap-1.5 px-2 font-normal">
                <span className="truncate">{last.name}</span>
                {dot}
                <CaretDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-[calc(100vw-2rem)]" onCloseAutoFocus={e => e.preventDefault()}>
              {crumbs.slice(1).map(crumb => (
                <DropdownMenuItem key={crumb.path} onSelect={() => crumb !== last && onNavigate(crumb.path)}>
                  <Check className={crumb === last ? '' : 'invisible'} />
                  <span className="truncate">{crumb.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
        <BreadcrumbList className={cn('flex-nowrap text-base', collapsible && 'max-sm:hidden')}>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.path}>
              {i > 1 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>
                    {i === 0 ? <House className="size-4" /> : crumb.name}
                    {dot}
                  </BreadcrumbPage>
                ) : i === 0 ? home : (
                  <BreadcrumbLink asChild>
                    <button onClick={() => onNavigate(crumb.path)}>
                      <span className="truncate max-w-40">{crumb.name}</span>
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
