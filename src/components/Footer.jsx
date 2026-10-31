import { useKeyboardInset } from '../hooks/useKeyboardInset.js'

// Bottom bar shared by every screen with actions (+, ✓, Sync), right-aligned.
// While the on-screen keyboard is open it sits on top of it.
export default function Footer({ children }) {
  const keyboard = useKeyboardInset()
  return (
    <div
      className="flex items-center justify-end gap-2 px-4 pt-2 border-t border-border bg-background shrink-0"
      style={{ marginBottom: keyboard, paddingBottom: keyboard ? '0.5rem' : 'calc(0.5rem + var(--safe-bottom))' }}
    >
      {children}
    </div>
  )
}
