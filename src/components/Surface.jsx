// The open folder's or file's content: an outlined box between Header and
// Footer, lined up with their buttons. Fills the space; content scrolls inside.
export default function Surface({ children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-[1032px] mx-auto px-4 pb-2">
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border overflow-hidden">
        {children}
      </div>
    </div>
  )
}
