// Bottom bar of file screens: ⋯ for the open folder or file (`start`) on the
// left, the screen's actions (+, ✏️, ✓) on the right. It stays at the bottom of the
// page, behind the on-screen keyboard.
export default function Footer({ start, children }) {
  return (
    <div
      className="flex items-center gap-2 px-4 pt-2 border-t border-border bg-background shrink-0"
      style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}
    >
      {start}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}
