import { ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

// Top bar shared by every screen, with the same padding everywhere. With
// onBack the left starts with ← (out of app pages like Settings). File and
// folder screens show ☰ (`lead`) and the title "File manager"; Home and Graph
// show ☰ too. With onSearch, Search and Sync (`syncButton`) sit on the right.
export default function Header({ title, changed, onBack, lead, onSearch, syncButton }) {
  return (
    <div className="flex items-center gap-2 p-2 shrink-0">
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
      {onSearch && (
        <Button variant="ghost-outline" size="icon" aria-label="Search" className="shrink-0 border-muted-foreground/50" onClick={onSearch}>
          <MagnifyingGlass />
        </Button>
      )}
      {syncButton}
    </div>
  )
}
