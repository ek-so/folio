// One of the app's settings files in `.folio/` (hooks/useConfig.js) read through `parse(text)` (the value, or null for text that
// can't be read; `undefined` text, no file yet, is parse's to answer) and written back through `serialize(value)`:
// `value` (null until the file is read, or when it can't be: it's then never saved over), `key` (its text, to tell when it
// changed), and `change(edit)`, a change (ch => ch) for `update`, alone or in the same step as another change: it applies
// `edit(value) => value` to what the changes give the file, and writes only when that differs.
export function useConfigFile(config, path, parse, serialize) {
  const file = config.read(path)
  const value = file.ready ? parse(file.text) : null
  const change = edit => ch => {
    const text = config.readIn(ch, path)
    const now = text === null ? null : parse(text)
    if (!now) return ch
    const next = edit(now)
    return serialize(next) === serialize(now) ? ch : config.write(path, serialize(next))(ch)
  }
  return { value, key: file.ready ? file.text ?? '' : null, change }
}
