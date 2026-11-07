// A tray of cards (a board's column, a planner's day) shows its first `limit` cards until "Show N more"
// (and the dragged card, wherever it is)
export const SHOWN = 7
// Cards in a grid of more than one column (a planner's day on desktop) show by whole rows: ROWS of them
export const ROWS = 3
export const shownLimit = columns => columns > 1 ? columns * ROWS : SHOWN
export const shownCards = (paths, all, dragged, limit = SHOWN) => all ? paths : paths.filter((p, i) => i < limit || p === dragged)
export const hiddenCards = (paths, dragged, limit = SHOWN) => paths.filter((p, i) => i >= limit && p !== dragged)
