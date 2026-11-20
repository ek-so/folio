import { useEffect } from 'react'
import { ArrowLeft, X } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'
import { Sheet, SheetContent } from './ui/sheet.jsx'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog.jsx'
import { useKeyboardInset } from '../hooks/useKeyboardInset.js'
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

// Every prompt: a sheet from the bottom on phones, a centered dialog from 768px, with the same header (`OverlayHeader`:
// `title`, `description`, `onBack`). `onBack`: a ← before the title, back to where the sheet came from (a step inside
// it); `wide`: a wider dialog, for content to read (a note)
export default function BottomSheet({ title, description, onBack, wide, onClose, onOpenAutoFocus, children }) {
  const isDesktop = useIsDesktop()
  const keyboard = useKeyboardInset()
  useEffect(() => releaseStalePageLock, [])
  const header = <OverlayHeader title={title} description={description} onBack={onBack} />
  const describedBy = description ? {} : { 'aria-describedby': undefined }

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={open => !open && onClose()}>
        <DialogContent className={cn(wide && 'max-w-3xl')} showCloseButton={false} onOpenAutoFocus={onOpenAutoFocus} {...describedBy}>
          {header}
          {children}
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
          paddingBottom: keyboard ? '1.5rem' : 'calc(1.5rem + var(--safe-bottom))',
        }}
        onOpenAutoFocus={onOpenAutoFocus}
        {...describedBy}
      >
        {header}
        {children}
      </SheetContent>
    </Sheet>
  )
}
