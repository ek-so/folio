// A tray of cards (a board's column, a planner's day) shows its first SHOWN cards until "Show N more"
// (and the dragged card, wherever it is)
export const SHOWN = 7
export const shownCards = (paths, all, dragged) => all ? paths : paths.filter((p, i) => i < SHOWN || p === dragged)
export const hiddenCards = (paths, dragged) => paths.filter((p, i) => i >= SHOWN && p !== dragged)
