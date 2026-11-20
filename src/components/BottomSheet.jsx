import { useEffect } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
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

// `onBack`: a ← before the title, back to where the sheet came from (a step inside it); `wide`: a wider dialog from 768px,
// for content to read (a note)
export default function BottomSheet({ title, description, onBack, wide, onClose, onOpenAutoFocus, children }) {
  const isDesktop = useIsDesktop()
  const keyboard = useKeyboardInset()
  useEffect(() => releaseStalePageLock, [])
  const back = onBack && (
    <Button variant="ghost" size="icon" aria-label="Back" tooltip="Back" className="-my-space-xs -ml-space-sm shrink-0" onClick={onBack}>
      <ArrowLeft />
    </Button>
  )
  const heading = text => back ? <span className="flex min-w-0 items-center gap-space-xs">{back}<span className="min-w-0 truncate">{text}</span></span> : text

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={open => !open && onClose()}>
        <DialogContent
          className={cn(wide && 'max-w-3xl')}
          onOpenAutoFocus={onOpenAutoFocus}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>{heading(title)}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-[680px] gap-space rounded-t-2xl bg-card p-space-lg"
        style={{
          bottom: keyboard,
          paddingBottom: keyboard ? '1.5rem' : 'calc(1.5rem + var(--safe-bottom))',
        }}
        {...(description ? {} : { 'aria-describedby': undefined })}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <SheetHeader className="p-0 pr-8">
          <SheetTitle className="text-lg font-bold truncate">{heading(title)}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
