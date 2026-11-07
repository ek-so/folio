import { Toaster as Sonner } from 'sonner'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'

// Toasts in theme tokens, at the bottom center: above the floating
// navigation on phones, where they take the full width inside the 16px gutters.
// Success and error toasts are filled (richColors): a 20px icon and the text, 16px padding. An action (Undo) is a small
// button tinted with the toast's own text color, so it sits on the fill.
// Sonner's own styles aren't in a layer, so the overrides are !important. `theme` is the app's preference (light | dark | system).
function Toaster({ theme, ...props }) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-center"
      richColors
      icons={{
        success: <CheckCircle className="size-5" />,
        error: <WarningCircle className="size-5" />,
      }}
      toastOptions={{
        classNames: {
          toast: '!gap-3 !p-space !shadow-lg',
          icon: '!m-0 !size-5',
          title: '!text-sm !font-semibold',
          actionButton: '!h-control-sm !rounded-sm !bg-current/15 !px-2 !text-sm !font-semibold ![color:inherit] hover:!bg-current/25',
        },
      }}
      offset={{ bottom: 'var(--toast-bottom)' }}
      mobileOffset={{ bottom: 'var(--toast-bottom)', left: 'var(--space)', right: 'var(--space)' }}
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--foreground)',
        '--normal-border': 'var(--border)',
        '--success-bg': 'var(--success)',
        '--success-text': 'var(--success-foreground)',
        '--success-border': 'var(--success)',
        '--error-bg': 'var(--destructive)',
        '--error-text': 'var(--destructive-foreground)',
        '--error-border': 'var(--destructive)',
        '--border-radius': 'var(--radius-sm, 8px)',
      }}
      {...props}
    />
  )
}

export { Toaster }
