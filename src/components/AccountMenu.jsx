import { useState } from 'react'
import { Gear, SignOut, LinkBreak, BookOpen, Images, ClockCounterClockwise } from '@phosphor-icons/react'
import { PAGE } from '../lib/pages.js'
import ViewMenu, { ViewsTitle } from './ViewMenu.jsx'
import PageTitle from './PageTitle.jsx'
import PageIcon from './PageIcon.jsx'
import AppLogo from './AppLogo.jsx'
import BrandName from './BrandName.jsx'
import BottomSheet from './BottomSheet.jsx'
import { Button } from './ui/button.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Separator } from './ui/separator.jsx'

// The phone navigation: the app's logo and name in an outlined button (on the top bar) opens a `BottomSheet` like every
// other prompt, titled with the same logo and name. First the views under their title (`ViewsTitle`: "Views" and its ⋯), each with its ⋯ (`ViewMenu`,
// `viewActions`), then the other main pages (`pages`): File manager, Assets and Graph; then Recent updates, Broken
// links (count), Documentation, Settings and Sign out. `current` is the open page, highlighted. Choosing a page closes it.
export default function AccountMenu({ current, pages, viewActions, onNavigate, brokenCount, onSignOut }) {
  const [open, setOpen] = useState(false)
  const go = fn => () => { setOpen(false); fn() }
  const page = p => (
    <li key={p.id}>
      <ListRow
        icon={<PageIcon page={p} />} title={<PageTitle page={p} />} active={current === p.id} onClick={go(() => onNavigate(p.id))}
        trailing={p.view && <ViewMenu view={p} actions={viewActions} inRow onPick={() => setOpen(false)} />}
      />
    </li>
  )
  const fixed = (id, Icon, title, extra) => (
    <li><ListRow icon={<Icon />} title={title} active={current === id} onClick={go(() => onNavigate(id))} trailing={extra} /></li>
  )
  const separator = <Separator className="my-space-sm" />
  return (
    <>
      <Button variant="outline" aria-label="Menu" aria-haspopup="dialog" className="px-space-sm" onClick={() => setOpen(true)}>
        <span className="flex items-center gap-space-sm"><AppLogo className="size-6 shrink-0" /><BrandName /></span>
      </Button>
      {open && (
        <BottomSheet
          title={<span className="flex items-center gap-space-sm"><AppLogo className="size-6 shrink-0" /><BrandName /></span>}
          onClose={() => setOpen(false)}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <nav aria-label="Main" className="-mx-space-xs max-h-[70dvh] overflow-y-auto overscroll-y-contain" data-no-pull>
            <ViewsTitle actions={viewActions} onPick={() => setOpen(false)} className="pr-2" />
            <ul>
              {pages.filter(p => p.view).map(page)}
            </ul>
            {separator}
            <ul>
              {pages.filter(p => p.id === PAGE.FILES).map(page)}
              {fixed(PAGE.ASSETS, Images, 'Assets')}
              {pages.filter(p => p.id === PAGE.GRAPH).map(page)}
            </ul>
            {separator}
            <ul>
              {fixed(PAGE.HISTORY, ClockCounterClockwise, 'Recent updates')}
              {fixed(PAGE.LINKS, LinkBreak, 'Broken links', brokenCount > 0 && <span className="px-space-sm text-sm text-muted-foreground">{brokenCount}</span>)}
              {fixed(PAGE.DOCS, BookOpen, 'Documentation')}
              {fixed(PAGE.SETTINGS, Gear, 'Settings')}
              <li><ListRow icon={<SignOut className="text-destructive-ink" />} title={<span className="text-destructive-ink">Sign out</span>} onClick={go(onSignOut)} /></li>
            </ul>
          </nav>
        </BottomSheet>
      )}
    </>
  )
}
