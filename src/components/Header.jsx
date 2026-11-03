import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

// Top bar shared by every screen, with the same padding everywhere. With
// onBack the left starts with ← (out of app pages like Settings). File and
// folder screens show ☰ (`lead`) and the title "Home", wherever you are.
export default function Header({ title, changed, onBack, lead, children }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 shrink-0">
      {onBack && (
        <Button variant="ghost-outline" size="icon" onClick={onBack} aria-label="Back" className="shrink-0 border-muted-foreground/50">
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
