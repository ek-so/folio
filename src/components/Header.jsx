import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

// Top bar shared by every screen, with the same padding everywhere. With
// onBack the left starts with ← (one level up in folders and files; out of
// app pages like Settings); `backMobileOnly` hides it on wider screens,
// where folders and files show ☰ instead. Then the `title` ("Home" on file
// screens), after `lead` (☰ on file screens).
export default function Header({ title, changed, onBack, backMobileOnly, lead, children }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 shrink-0">
      {onBack && (
        <Button variant="ghost-outline" size="icon" onClick={onBack} aria-label="Back" className={cn('shrink-0 border-muted-foreground/50', backMobileOnly && 'sm:hidden')}>
          <ArrowLeft />
        </Button>
      )}
      {lead}
      <span className={cn('flex-1 truncate min-w-0 text-lg font-semibold', lead && 'ml-1')}>
        {title}
        {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
      </span>
      {children}
    </div>
  )
}
