import { createContext, useContext } from 'react'
import { TABLES_PATH, parseTables, serializeTables, withColumnType, withValueColor, withTableSort, sortOf, movedTables, removedTables } from '../lib/tables.js'
import { useConfigFile } from './useConfigFile.js'

// The types and value colors picked for notes' table columns and the tables' sorts (lib/tables.js), from the config
// (hooks/useConfig.js): `of(path)` ({ column: { type, colors } }), `sortOf(path, header)` ({ col, dir } or null), `canEdit` (read and readable, so it's never overwritten), `key` (changes
// with them), and changes (ch => ch) for `update`: `setType(path, column, type)`, `setColor(path, column, value, color)`, `setSort(path, header, sort)`, `moved(from, to, isDir)`, `removed(path, isDir)`.
export function useTables(config) {
  const { value: tables, key, change } = useConfigFile(config, TABLES_PATH, parseTables, serializeTables)
  return {
    of: path => tables?.columns[path] ?? {},
    sortOf: (path, header) => sortOf(tables, path, header),
    canEdit: !!tables,
    key,
    setType: (path, column, type) => change(t => withColumnType(t, path, column, type)),
    setColor: (path, column, value, color) => change(t => withValueColor(t, path, column, value, color)),
    setSort: (path, header, sort) => change(t => withTableSort(t, path, header, sort)),
    moved: (from, to, isDir) => change(t => movedTables(t, from, to, isDir)),
    removed: (path, isDir) => change(t => removedTables(t, path, isDir)),
  }
}

// What App shares with the note preview: `of(path)`, `sortOf(path, header)`, and `onType(path, column, type)` /
// `onColor(path, column, value, color)` / `onSort(path, header, sort)` (undefined while they can't be saved)
export const TablesContext = createContext({ of: () => ({}), sortOf: () => null })
export const useTablesContext = () => useContext(TablesContext)
