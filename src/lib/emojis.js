// The emojis the picker offers (components/EmojiPicker.jsx), each with the words its search matches; any other emoji
// can be pasted into the field
export const EMOJIS = [
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

// The emojis whose words start a word of `query` (every word of it), all of them for an empty query
export function searchEmojis(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return EMOJIS.filter(([, text]) => words.every(w => text.split(' ').some(t => t.startsWith(w)))).map(([emoji]) => emoji)
}
