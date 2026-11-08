import { useContext } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { pageInfo } from '../lib/pages.js'
import { NavContext } from './NavTree.jsx'
import { Button } from './ui/button.jsx'
import PageTitle from './PageTitle.jsx'

// Top of the content box: for a file or folder, ← when its page has a step to go back to (`onBack`
// from App), and the name in bold (`changed`: unsaved dot). An app page
// (`page`: Home, Settings…) shows its title. `badge` right after; `children`:
// the item's actions on the right (⋯, then +, ✏️ or ✓). A border sets it
// apart from the content below.
export default function TitleBar({ page, name, changed, badge, children }) {
  const { onBack, views } = useContext(NavContext) ?? {}
  return (
    <div className="shrink-0 border-b border-border px-space py-space-sm">
      <div className="flex min-h-control items-center gap-space-sm">
        {!page && onBack && (
          <Button variant="ghost-outline" size="icon" aria-label="Back" tooltip="Back" className="shrink-0 border-muted-foreground/50" onClick={onBack}>
            <ArrowLeft />
          </Button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="min-w-0 truncate text-base font-bold">{page ? <PageTitle page={pageInfo(page, views)} /> : name}</h1>
          {changed && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          {badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
