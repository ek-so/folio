const SETTLE_MS = 100

// iOS scrolls the whole page up to keep a focused field above the keyboard and
// sometimes leaves it there after the keyboard closes. The app doesn't scroll
// as a page, so taps then land off from where buttons are drawn. Snap back.
export function resetScrollAfterKeyboard() {
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      if (document.activeElement?.matches('input, textarea')) return
      if (window.scrollY || document.documentElement.scrollTop) window.scrollTo(0, 0)
    }, SETTLE_MS)
  })
}
