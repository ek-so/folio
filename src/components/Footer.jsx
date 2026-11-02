// Bottom bar shared by every file screen: Sync always on the left, the
// screen's actions (+, ✏️, ✓) on the right. It stays at the bottom of the
// page, behind the on-screen keyboard.
export default function Footer({ sync, children }) {
  return (
    <div
      className="flex items-center gap-2 px-4 pt-2 border-t border-border bg-background shrink-0"
      style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}
    >
      {sync}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}
