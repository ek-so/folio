// Keyboard shortcuts (desktop). Search: ⌘K on a Mac, Ctrl+K elsewhere, even while typing in a note

// Whether the keyboard is a Mac's (⌘ in place of Ctrl), from the browser's `platform` text
export const isMacPlatform = platform => /Mac|iPhone|iPad|iPod/.test(platform ?? '')

// The keys of the Search shortcut as shown, one per key: ['⌘', 'K'] or ['Ctrl', 'K']
export const searchKeys = mac => [mac ? '⌘' : 'Ctrl', 'K']

// Whether a keydown event is the Search shortcut
export const isSearchShortcut = (e, mac) =>
  e.key?.toLowerCase() === 'k' && (mac ? !!e.metaKey && !e.ctrlKey : !!e.ctrlKey && !e.metaKey) && !e.altKey && !e.shiftKey

const platform = typeof navigator === 'undefined' ? '' : navigator.userAgentData?.platform ?? navigator.platform
export const IS_MAC = isMacPlatform(platform)
