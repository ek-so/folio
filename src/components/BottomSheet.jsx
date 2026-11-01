import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { useKeyboardInset } from '../hooks/useKeyboardInset.js'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = e => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

// Radix locks the page while a dialog is open. If a lock outlives every open
// dialog (overlapping menus/dialogs can cause that), nothing reacts until a
// reload, so clear it once this sheet is gone and no other dialog is open.
function releaseStalePageLock() {
  setTimeout(() => {
    if (document.querySelector('[role=dialog][data-state=open]')) return
    if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = ''
  }, 0)
}

export default function BottomSheet({ title, description, onClose, onOpenAutoFocus, children }) {
  const isDesktop = useIsDesktop()
  const keyboard = useKeyboardInset()
  useEffect(() => releaseStalePageLock, [])

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={open => !open && onClose()}>
        <DialogContent
          onOpenAutoFocus={onOpenAutoFocus}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>{title}</DialogTitle>
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
        className="mx-auto w-full max-w-[680px] gap-4 rounded-t-2xl bg-card p-6"
        style={{
          bottom: keyboard,
          paddingBottom: keyboard ? '1.5rem' : 'calc(1.5rem + var(--safe-bottom))',
        }}
        {...(description ? {} : { 'aria-describedby': undefined })}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <SheetHeader className="p-0 pr-8">
          <SheetTitle className="text-lg font-bold truncate">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
