// The note editor's undo history: { past, present, future, at }, each state the note's text. Typing in one burst (each
// change less than MERGE_MS after the last) is one step. At most MAX steps back.

const MERGE_MS = 1000
const MAX = 200

export const startHistory = text => ({ past: [], present: text, future: [], at: 0 })

// `history` after the text became `text` at `now`
export function recorded(history, text, now) {
  if (text === history.present) return history
  const fold = history.past.length > 0 && now - history.at < MERGE_MS
  return {
    past: fold ? history.past : [...history.past, history.present].slice(-MAX),
    present: text,
    future: [],
    at: now,
  }
}

// One step back or forward (the same history when there's none); `at` 0, so the next change starts a step
export function undone(history) {
  if (!history.past.length) return history
  return { past: history.past.slice(0, -1), present: history.past.at(-1), future: [history.present, ...history.future], at: 0 }
}

export function redone(history) {
  if (!history.future.length) return history
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1), at: 0 }
}

// Where the cursor goes once `from` became `to` (an undo or redo): at the end of what changed
export function changedAt(from, to) {
  let start = 0
  while (start < from.length && start < to.length && from[start] === to[start]) start++
  let end = 0
  while (end < from.length - start && end < to.length - start && from[from.length - 1 - end] === to[to.length - 1 - end]) end++
  return to.length - end
}
