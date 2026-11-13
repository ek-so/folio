// The emojis the picker offers (components/EmojiPicker.jsx): Suggested first (SUGGESTED, picked for notes and folders,
// each with extra words its search matches), then every emoji in Unicode's groups (unicode-emoji-json's data-by-group,
// loaded on demand by hooks/useEmojis.js), only those this device can draw. Any other emoji can be pasted into the field.
export const SUGGESTED = [
  ['📝', 'note memo write pencil'], ['📄', 'page document file'], ['📚', 'books library read'], ['📖', 'book open read'],
  ['📓', 'notebook journal'], ['📒', 'ledger notebook'], ['📋', 'clipboard list tasks'], ['📌', 'pin pushpin important'],
  ['📎', 'paperclip attach'], ['🗂️', 'index dividers organize'], ['📁', 'folder directory'], ['🗃️', 'card box archive'],
  ['🗓️', 'calendar schedule date'], ['📅', 'calendar date'], ['⏰', 'alarm clock time'], ['✅', 'check done task'],
  ['🎯', 'target goal focus'], ['💡', 'idea light bulb'], ['🔥', 'fire hot'], ['⭐', 'star favorite'],
  ['❤️', 'heart love red'], ['🎉', 'party celebrate'], ['🚀', 'rocket launch'], ['🏆', 'trophy win'],
  ['💼', 'briefcase work job'], ['💰', 'money bag finance'], ['🧾', 'receipt invoice'], ['📊', 'chart bar stats'],
  ['📈', 'chart growth up'], ['🧮', 'abacus calculate'], ['🔒', 'lock secure private'], ['🔑', 'key'],
  ['🏠', 'house home'], ['🌱', 'seedling plant grow'], ['🌳', 'tree'], ['🌸', 'flower blossom'],
  ['🌍', 'earth world globe'], ['☀️', 'sun sunny'], ['🌙', 'moon night'], ['⚡', 'lightning energy fast'],
  ['🌈', 'rainbow'], ['🍎', 'apple fruit food'], ['🍕', 'pizza food'], ['☕', 'coffee tea drink'],
  ['🍳', 'cooking egg breakfast'], ['🥗', 'salad food healthy'], ['🎂', 'cake birthday'], ['🍷', 'wine drink'],
  ['🏃', 'run running sport'], ['🧘', 'yoga meditate calm'], ['💪', 'muscle strong gym'], ['🩺', 'doctor health stethoscope'],
  ['💊', 'pill medicine health'], ['🛌', 'sleep bed rest'], ['🧠', 'brain mind think'], ['😀', 'smile happy face'],
  ['😎', 'cool sunglasses face'], ['🤔', 'thinking face'], ['😴', 'sleepy tired face'], ['🥳', 'party face'],
  ['🐶', 'dog pet'], ['🐱', 'cat pet'], ['🦊', 'fox animal'], ['🐝', 'bee animal'],
  ['✈️', 'airplane travel flight'], ['🚗', 'car drive'], ['🚲', 'bike bicycle'], ['🗺️', 'map travel'],
  ['🏖️', 'beach holiday vacation'], ['⛰️', 'mountain hike'], ['🏕️', 'camping tent'], ['🎵', 'music note song'],
  ['🎬', 'movie film clapper'], ['🎮', 'game video controller'], ['🎨', 'art paint palette'], ['📷', 'camera photo'],
  ['🎁', 'gift present'], ['🛒', 'cart shopping'], ['🧳', 'luggage trip suitcase'], ['🛠️', 'tools build fix'],
  ['💻', 'laptop computer code'], ['📱', 'phone mobile'], ['🖥️', 'desktop computer'], ['⌨️', 'keyboard'],
  ['🔧', 'wrench tool'], ['🧪', 'test tube experiment science'], ['🔬', 'microscope science'], ['🤖', 'robot ai'],
  ['🧩', 'puzzle piece'], ['📡', 'satellite antenna signal'], ['🔔', 'bell notification'], ['✉️', 'envelope mail email'],
  ['💬', 'speech chat message'], ['👥', 'people team users'], ['🙋', 'person raising hand'], ['🎓', 'graduation school study'],
]

// The picker's groups: [{ name, emojis: [{ emoji, words }] }], Suggested first, then `data`'s groups ([{ name, emojis:
// [{ emoji, name, emoji_version }] }]) without emojis newer than `maxVersion` (what the device draws). An emoji's words:
// its name's, and Suggested's for it
export function emojiGroups(data, maxVersion) {
  const extra = new Map(SUGGESTED)
  const words = (emoji, name = '') => `${name.toLowerCase()} ${extra.get(emoji) ?? ''}`.trim().split(/[\s_:,]+/).filter(Boolean)
  const all = data.map(g => ({
    name: g.name,
    emojis: g.emojis.filter(e => parseFloat(e.emoji_version) <= maxVersion).map(e => ({ emoji: e.emoji, words: words(e.emoji, e.name) })),
  })).filter(g => g.emojis.length)
  const named = new Map(all.flatMap(g => g.emojis.map(e => [e.emoji, e.words])))
  return [{ name: 'Suggested', emojis: SUGGESTED.map(([emoji]) => ({ emoji, words: named.get(emoji) ?? words(emoji) })) }, ...all]
}

// The emojis of `groups` whose words start with every word of `query`, each once, in the groups' order
export function searchEmojis(groups, query) {
  const wanted = query.toLowerCase().split(/\s+/).filter(Boolean)
  const found = new Set()
  for (const g of groups) for (const { emoji, words } of g.emojis) {
    if (wanted.every(w => words.some(t => t.startsWith(w)))) found.add(emoji)
  }
  return [...found]
}
