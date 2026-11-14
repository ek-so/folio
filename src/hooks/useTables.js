import { createContext, useContext } from 'react'
import { TABLES_PATH, parseTables, serializeTables, withColumnType, withValueColor, movedTables, removedTables } from '../lib/tables.js'
import { useConfigFile } from './useConfigFile.js'

// The types and value colors picked for notes' table columns (lib/tables.js), from the config (hooks/useConfig.js):
// `of(path)` ({ column: { type, colors } }), `canEdit` (read and readable, so it's never overwritten), `key` (changes
// with them), and changes (ch => ch) for `update`: `setType(path, column, type)`, `setColor(path, column, value, color,
// from)`, `moved(from, to, isDir)`, `removed(path, isDir)`.
export function useTables(config) {
  const { value: tables, key, change } = useConfigFile(config, TABLES_PATH, parseTables, serializeTables)
  return {
    of: path => tables?.[path] ?? {},
    canEdit: !!tables,
    key,
    setType: (path, column, type) => change(t => withColumnType(t, path, column, type)),
    setColor: (path, column, value, color, from) => change(t => withValueColor(t, path, column, value, color, from)),
    moved: (from, to, isDir) => change(t => movedTables(t, from, to, isDir)),
    removed: (path, isDir) => change(t => removedTables(t, path, isDir)),
  }
}

// What App shares with the note preview: `of(path)`, and `onType(path, column, type)` / `onColor(path, column, value,
// color, from)` (undefined while they can't be saved)
export const TablesContext = createContext({ of: () => ({}) })
export const useTablesContext = () => useContext(TablesContext)
