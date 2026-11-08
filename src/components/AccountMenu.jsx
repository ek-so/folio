import { useState } from 'react'
import { Gear, SignOut, LinkBreak, BookOpen, SlidersHorizontal } from '@phosphor-icons/react'
import { PAGE } from '../lib/pages.js'
import ViewMenu from './ViewMenu.jsx'
import PageTitle from './PageTitle.jsx'
import AppLogo from './AppLogo.jsx'
import { ListRow } from './ui/list-row.jsx'
import { Separator } from './ui/separator.jsx'
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from './ui/sheet.jsx'

// The phone navigation, opened by `trigger` (a Button): a left sheet that floats 8px from the screen's edges,
// titled with the app's name (its ✕ is the sheet's own). The main pages (`pages`): File manager, then the views
// (each with its ⋯: `ViewMenu`, Rename / Remove, `viewActions`) and Views settings, then Graph; then Broken links
// (count), Documentation, Settings and Sign out. `current` is the open page, highlighted. Choosing a page closes it.
export default function AccountMenu({ trigger, current, pages, viewActions, onNavigate, brokenCount, onSignOut }) {
  const [open, setOpen] = useState(false)
  const go = fn => () => { setOpen(false); fn() }
  const page = p => (
    <li key={p.id}>
      <ListRow
        icon={<p.icon />} title={<PageTitle page={p} />} active={current === p.id} onClick={go(() => onNavigate(p.id))}
        trailing={p.view && <ViewMenu view={p} disabled={!viewActions.canEdit} onRename={v => { setOpen(false); viewActions.onRename(v) }} onDelete={v => { setOpen(false); viewActions.onDelete(v) }} />}
      />
    </li>
  )
  const fixed = (id, Icon, title, extra) => (
    <li><ListRow icon={<Icon />} title={title} active={current === id} onClick={go(() => onNavigate(id))} trailing={extra} /></li>
  )
  const separator = <Separator className="my-space-sm" />
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="top-[calc(var(--space-sm)+var(--safe-top))] bottom-[calc(var(--space-sm)+var(--safe-bottom))] left-space-sm h-auto w-[calc(100vw-2*var(--space-sm))] gap-0 min-[500px]:w-[85vw] sm:max-w-none overflow-hidden rounded-xl border bg-card" closeClassName="right-space">
        <SheetDescription className="sr-only">Pages and settings</SheetDescription>
        {/* Like a title bar: base height, 8px above and below, 16px at the sides, level with the sheet's ✕ (16px from
            the right too); the logo centered on the rows' icons and the name lined up with their labels */}
        <div className="shrink-0 border-b border-border py-space-sm pl-space pr-[calc(var(--spacing-space)+var(--spacing-control)+var(--spacing-space-sm))]">
          <div className="flex min-h-control items-center gap-2 px-3">
            <AppLogo className="-ml-1 size-6 shrink-0" />
            <SheetTitle className="text-base font-bold">Folio</SheetTitle>
          </div>
        </div>
        <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-space" data-no-pull>
          <ul>{pages.filter(p => p.id === PAGE.FILES).map(page)}</ul>
          {separator}
          <ul>
            {pages.filter(p => p.view).map(page)}
            <li><ListRow icon={<SlidersHorizontal />} title="Views settings" disabled={!viewActions.canEdit} onClick={go(viewActions.onSettings)} /></li>
          </ul>
          {separator}
          <ul>{pages.filter(p => !p.view && p.id !== PAGE.FILES).map(page)}</ul>
          {separator}
          <ul>
            {fixed(PAGE.LINKS, LinkBreak, 'Broken links', brokenCount > 0 && <span className="px-2 text-sm text-muted-foreground">{brokenCount}</span>)}
            {fixed(PAGE.DOCS, BookOpen, 'Documentation')}
            {fixed(PAGE.SETTINGS, Gear, 'Settings')}
            <li><ListRow icon={<SignOut className="text-destructive-ink" />} title={<span className="text-destructive-ink">Sign out</span>} onClick={go(onSignOut)} /></li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
