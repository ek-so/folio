import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

// Top bar shared by every screen, with the same padding everywhere. With
// onBack the left starts with ← (one level up in folders and files; out of
// app pages like Settings); `backMobileOnly` hides it on wider screens,
// where folders and files show ☰ instead. Then `start` (☰ and
// PathBreadcrumbs) or, on app pages, the `title`.
export default function Header({ title, changed, onBack, backMobileOnly, start, children }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 mb-2">
      {onBack && (
        <Button variant="ghost-outline" size="icon" onClick={onBack} aria-label="Back" className={cn('shrink-0 border-muted-foreground/50', backMobileOnly && 'sm:hidden')}>
          <ArrowLeft />
        </Button>
      )}
      {start ?? (
        <span className="flex-1 truncate min-w-0 text-lg font-semibold">
          {title}
          {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
        </span>
      )}
      {children}
    </div>
  )
}
