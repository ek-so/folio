// Bottom bar shared by every screen with actions (+, ✓, Sync), right-aligned.
// It stays at the bottom of the page, behind the on-screen keyboard.
export default function Footer({ children }) {
  return (
    <div
      className="flex items-center justify-end gap-2 px-4 pt-2 border-t border-border bg-background shrink-0"
      style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}
    >
      {children}
    </div>
  )
}
