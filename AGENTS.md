# Folio — Agent Instructions

React + Vite PWA. Reads and writes markdown files from any GitHub repo through the GitHub REST API. Token and repo are always user-supplied at runtime; nothing is hardcoded.

## How to work with me
- **Ask before building.** Clarify scope before writing code. You may suggest, but never implement more than what was explicitly confirmed.
- **Be concise.** Short sentences. No filler. No summaries of what you just did.
- **Always work on `main` and push every commit to it.** No branches, no pull requests. If a push is refused, say so; don't leave commits unpushed.

## Principles
1. **One way to do each thing.** Before adding a component, pattern or helper, look for an existing one and reuse or extend it.
2. **One source of truth; derive the rest.** Store the minimum state and compute everything else from it.
3. **Logic in pure functions, effects in hooks, rendering in components.** Data rules live in plain, testable functions. Hooks own network, storage and timers. Components display and forward user actions.
4. **One path for every write.** All changes go through the same pipeline. Side doors skip its rules.
5. **Never lose the user's work.** Save before acting. After an operation, clear only what you know succeeded. Confirm before destroying. Don't allow editing what can't be saved.
6. **Assume the network can disappear at any moment.** Every remote call has an offline answer. Tell "offline", "rejected" and "broken" apart.
7. **Fail visibly, recover calmly.** Show a clear state for loading, empty, error and offline. Never swallow an error in a way that leaves the screen lying.
8. **Design system first.** Use the shared components and theme tokens. A one-off style or color is a future inconsistency.
9. **Small changes, verified before shipping.** Build, run tests and lint (`npm run lint`), and check the change once in the real app (`npm run local` serves it at localhost:7070). Test logic, not pixels; keep tests few and meaningful.
10. **Replace means remove.** When something new replaces something old, delete the old code in the same change.

## UI rules
Tokens, sizes and component details: [design-system](docs/design-system.md).

- **Components and tokens only.** Interactive elements come from `src/components/ui/` (shadcn). Layout and spacing are Tailwind utilities with the spacing tokens. Never hardcode a color or a pixel height.
- **shadcn and Phosphor first, custom only if really needed.** For any control or pattern, first look for a shadcn/ui component (`npx shadcn@latest add`) and a Phosphor icon. Adapt them through variants, props and tokens before writing anything of our own. Build a custom component only when neither fits, and say why in its header comment. No other icon library, no inline SVG, no text glyphs (→ ↗) used as icons. Dividers are `Separator`, field labels `Label`, one-of-several choices `ToggleGroup`. When you swap something custom for a shadcn component, the look and behavior must stay the same: compare before and after and check it in the browser. If the CLI can't reach the registry, copy the component's source into `ui/` and adapt it to our tokens.
- **Three control sizes** (base 40px, medium 32px, small 24px). Every tappable or input element is base unless a rule says otherwise. Buttons inside something that is itself hoverable or tappable (a list row, a tile, a card) are medium (32px): ⋯, ✏️, 🗑, a color swatch. Icons are 16px.
- **Tooltips** come from the `tooltip` prop of `Button`, `ListRow` and `CardTile`, or `Tip`; never the browser's `title`. Nothing essential may depend on one (none show on a tap).
- **Destructive is always red:** trash icon buttons `ghost-destructive`, menu items and confirm buttons `destructive`. Every destructive action is confirmed by `ConfirmModal`.
- **Confirm and dismiss icon buttons:** the color shows the meaning: a button that confirms or accepts (✓) is green, and one that cancels or dismisses (✕) is red. The prominence follows the context: filled when the button stands alone, light when a confirm and a dismiss stand together, and the same as the button it replaces when it takes that button's place. A ✕ that only closes an overlay is a plain control, not a dismiss action.
- **Wording is consistent:** destructive actions say **Remove** (never Delete; **Discard** only for dropping unsynced changes, **Sign out** for signing out). Changing something says **Edit** (Edit title, Edit values…); **Rename** stays for an item's own name. Internal names (`DeleteModal`, `onDelete`) keep theirs.
- **Placeholders are light:** text that stands in for something not filled in yet (Untitled, No value…) uses `Placeholder` (`ui/placeholder.jsx`), lighter than muted text, until it's filled in.
- **Sub popovers, not nested screens:** what an item inside a popover or menu offers opens as a separate popover or menu on the side of the item (to its right; it flips left only when there's no room), while the parent stays as it is. Never swap the parent's content for another screen with a ← back arrow.
- **Only one popover is open at a time** (`SingleOpenProvider`, `useSingleOpen`).

## Where to look
- [architecture](docs/architecture.md) — app flow and code map
- [design-system](docs/design-system.md) — tokens, controls, components, overlays
- [layout-and-navigation](docs/layout-and-navigation.md) — rail, top bar, surface, file tree, trails, URLs
- [notes-and-properties](docs/notes-and-properties.md) — note preview and editor, properties, values dialog, colors
- [views-and-boards](docs/views-and-boards.md) — views, widgets, the board
- [files-and-sync](docs/files-and-sync.md) — files, symlinks, links, uploads, offline and sync

## Keeping these files true
They are only useful while they match the code. Before relying on a rule or description, check it against the code; whenever a change makes a line wrong or incomplete, fix it in the same commit. If code and docs disagree and it's unclear which is intended, ask.

## Code reviews
Suggest a full code review from time to time: after a larger feature, or after roughly 10 changes since the last review. Review against the principles above, list findings by priority, and fix only what's confirmed.
