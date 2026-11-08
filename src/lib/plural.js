// "1 note", "3 notes": `n` and `word`, with an "s" unless it's one
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
