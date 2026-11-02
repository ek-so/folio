import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'

// Top bar shared by every screen, with the same padding everywhere. With
// onBack it's an app page (← title, e.g. Settings). Otherwise `start` fills
// the left: ☰ (AccountMenu) and PathBreadcrumbs, repo first.
export default function Header({ title, changed, onBack, start, children }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 mb-2">
      {onBack ? (
        <>
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="shrink-0">
            <ArrowLeft />
          </Button>
          <span className="flex-1 truncate min-w-0 text-lg font-semibold">
            {title}
            {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
          </span>
        </>
      ) : start}
      {children}
    </div>
  )
}
