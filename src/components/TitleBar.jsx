import { useContext } from 'react'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { pageInfo } from '../lib/pages.js'
import { cn } from '@/lib/utils.js'
import { FolderTreeMenu } from './NavTree.jsx'
import { NavContext } from '../hooks/useNav.js'
import { Button } from './ui/button.jsx'
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group.jsx'
import PageTitle from './PageTitle.jsx'

// Top of the content box, on every page: Back | Forward as one split button (ButtonGroup, light; the browser's history, only the app's own steps: `history`
// from App, useAddressBar; off when there's none that way), then for a file or folder its name as an outlined button with ▾ that opens the tree of the folder you're in
// (FolderTreeMenu; `nameMenu` in its place: File manager's root has RepoMenu); `changed`: unsaved dot, inside the name button after the name. An app page
// (`page`: Home, Graph…) shows its title in bold. `badge` (symlinks pointing here) inside the name button's outline, after ▾ (right after the title when there's no name button); `children`:
// the item's actions on the right (⋯, then +, ✏️ or ✓). A border sets it
// apart from the content below.
export default function TitleBar({ page, name, nameMenu, changed, badge, children }) {
  const { history, views } = useContext(NavContext) ?? {}
  return (
    <div className="shrink-0 border-b border-border p-space">
      <div className="flex min-h-control items-center gap-space-sm">
        {history && (
          <ButtonGroup aria-label="History">
            <Button variant="ghost-outline" size="icon" aria-label="Back" tooltip="Back" disabled={!history.canBack} onClick={history.back}><ArrowLeft /></Button>
            <ButtonGroupSeparator />
            <Button variant="ghost-outline" size="icon" aria-label="Forward" tooltip="Forward" disabled={!history.canForward} onClick={history.forward}><ArrowRight /></Button>
          </ButtonGroup>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-space-sm">
          <h1 className={cn('min-w-0 truncate text-base font-bold', !page && 'flex')}>{page ? <PageTitle page={pageInfo(page, views)} /> : nameMenu ?? <FolderTreeMenu name={name} changed={changed} badge={badge} />}</h1>
          {(page || nameMenu) && badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-space-sm">{children}</div>}
      </div>
    </div>
  )
}
