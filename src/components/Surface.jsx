// The open folder's or file's content: an outlined box under Header, lined
// up with its buttons, down to the bottom of the screen. Fills the space; `title` (TitleBar)
// stays on top while the content scrolls inside.
export default function Surface({ title, children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-[1032px] mx-auto px-4" style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}>
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border overflow-hidden">
        {title}
        {children}
      </div>
    </div>
  )
}
