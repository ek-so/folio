// The open folder's or file's content: a card-colored box under Header (a sheet
// edge to edge on phones, lined up with its buttons from 640px; outlined on both),
// down to the bottom of the screen. Fills the space; `title` (TitleBar)
// stays on top while the content scrolls inside.
export default function Surface({ title, children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-[1032px] mx-auto sm:px-4 sm:pb-[calc(0.5rem+var(--safe-bottom))]">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-card rounded-t-xl border border-border pb-[var(--safe-bottom)] sm:rounded-xl sm:pb-0">
        {title}
        {children}
      </div>
    </div>
  )
}
