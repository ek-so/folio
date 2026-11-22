import { useEffect } from 'react'
import { ArrowLeft, X } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { Separator } from './ui/separator.jsx'
import { cn } from '@/lib/utils.js'
import { Sheet, SheetContent } from './ui/sheet.jsx'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog.jsx'
import { useVisualViewport } from '../hooks/useKeyboardInset.js'
import { useIsDesktop } from '../hooks/useIsDesktop.js'

// Radix locks the page while a dialog is open. If a lock outlives every open
// dialog (overlapping menus/dialogs can cause that), nothing reacts until a
// reload, so clear it once this sheet is gone and no other dialog is open.
function releaseStalePageLock() {
  setTimeout(() => {
    if (document.querySelector('[role=dialog][data-state=open]')) return
    if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = ''
  }, 0)
}

// Every sheet's and dialog's header, one row: ← (`onBack`, optional), the title with the `description` under it
// (optional), and ✕ on the right, all three centered on each other. The buttons reach 8px into the padding around, so
// the row is no taller than its text and their icons sit near the content's edges. (Sheet and Dialog are the same Radix
// dialog, so its Title, Description and Close serve both.)
function OverlayHeader({ title, description, onBack }) {
  return (
    <div className="flex items-center gap-space-sm">
      {onBack && (
        <Button variant="ghost" size="icon" aria-label="Back" tooltip="Back" className="-my-space-sm -ml-space-sm shrink-0" onClick={onBack}>
          <ArrowLeft />
        </Button>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <DialogTitle className="truncate text-lg font-bold leading-tight">{title}</DialogTitle>
        {description && <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>}
      </div>
      <DialogClose asChild>
        <Button variant="ghost" size="icon" aria-label="Close" className="-my-space-sm -mr-space-sm shrink-0 text-muted-foreground hover:text-foreground">
          <X />
        </Button>
      </DialogClose>
    </div>
  )
}

// A sheet's buttons (Cancel, Save…), its last row, split from what's above by a separator from edge to edge (reaching
// over the sheet's 24px sides: so put it in no box with sides of its own, or the sheet scrolls sideways): they stay at the bottom while
// the rest scrolls (sticky in the sheet's scrolling body, so they can sit inside a form and still submit it). `className`
// for the buttons' own row (their alignment)
export function SheetActions({ className, children }) {
  return (
    <div className="sticky -bottom-1 z-10 -mb-1 flex flex-col gap-space bg-card pb-1">
      <Separator className="-mx-space-lg data-[orientation=horizontal]:w-auto" />
      <div className={cn('flex justify-end gap-space-sm', className)}>{children}</div>
    </div>
  )
}

// Every prompt: a sheet from the bottom on phones, a centered dialog from 768px, with the same header (`OverlayHeader`:
// `title`, `description`, `onBack`). `onBack`: a ← before the title, back to where the sheet came from (a step inside
// it); `wide`: a wider dialog, for content to read (a note). It reaches no higher than 24px from the screen's top on a
// phone (above the keyboard), and keeps 64px clear above and below as a dialog: the header stays put and the rest
// scrolls under it, its buttons (`SheetActions`) staying at the bottom
export default function BottomSheet({ title, description, onBack, wide, onClose, onOpenAutoFocus, children }) {
  const isDesktop = useIsDesktop()
  const { keyboard, height: seen } = useVisualViewport()
  useEffect(() => releaseStalePageLock, [])
  const header = <div className="shrink-0"><OverlayHeader title={title} description={description} onBack={onBack} /></div>
  // The scrolling body reaches into the sheet's 24px sides (and 4px above and below) so rows that do, and focus rings, aren't cut off
  const body = (
    <div data-no-pull className="-mx-space-lg -my-1 flex min-h-0 flex-1 flex-col gap-space overflow-y-auto overflow-x-hidden overscroll-contain px-space-lg py-1">
      {children}
    </div>
  )
  const describedBy = description ? {} : { 'aria-describedby': undefined }

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={open => !open && onClose()}>
        <DialogContent className={cn('max-h-[calc(100dvh-2*4rem)]', wide && 'max-w-3xl')} showCloseButton={false} onOpenAutoFocus={onOpenAutoFocus} {...describedBy}>
          {header}
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto w-full max-w-[680px] gap-space rounded-t-2xl bg-card p-space-lg"
        style={{
          bottom: keyboard,
          // Up to 24px from the top of what's seen: with the keyboard open, the part of the screen above it (iOS also
          // shifts that part down the page to show the field, so the screen's own height would take the top off)
          maxHeight: `calc(${keyboard ? `${seen}px` : '100dvh'} - var(--safe-top) - var(--space-lg))`,
          paddingBottom: keyboard ? '1.5rem' : 'calc(1.5rem + var(--safe-bottom))',
        }}
        onOpenAutoFocus={onOpenAutoFocus}
        {...describedBy}
      >
        {header}
        {body}
      </SheetContent>
    </Sheet>
  )
}
