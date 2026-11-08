import { describe, it, expect } from 'vitest'
import { parseViews, serializeViews, addView, renameView, removeView, isConfigPath, DEFAULT_VIEWS, addWidget, removeWidget, moveWidget, moveView } from './viewsConfig.js'

describe('viewsConfig', () => {
  it('has Home alone without a file, and nothing from text it can\'t read', () => {
    expect(parseViews(undefined)).toEqual(DEFAULT_VIEWS)
    expect(parseViews('not json')).toBeNull()
    expect(parseViews('{"views": 3}')).toBeNull()
  })

  it('keeps an emptied list empty and unnamed views, and drops bad or reserved entries', () => {
    expect(parseViews(serializeViews([]))).toEqual([])
    const text = JSON.stringify({ views: [{ id: 'a', name: 'A' }, { id: 'a', name: 'again' }, { id: 'files', name: 'X' }, { id: 'b', name: '' }, { id: 'c' }, 4] })
    expect(parseViews(text)).toEqual([{ id: 'a', name: 'A' }, { id: 'b', name: '' }])
  })

  it('round-trips, adds, renames and removes', () => {
    const { views, id } = addView(DEFAULT_VIEWS)
    expect(views).toHaveLength(2)
    expect(views[1]).toEqual({ id, name: '' })
    expect(addView(DEFAULT_VIEWS, '  Work ').views[1].name).toBe('Work')
    expect(parseViews(serializeViews(views))).toEqual(views)
    expect(renameView(views, id, '  Work ')[1].name).toBe('Work')
    expect(removeView(views, 'home')).toEqual([views[1]])
  })

  it('adds and removes widgets, keeping kinds it doesn\'t know', () => {
    const { views, id } = addWidget(DEFAULT_VIEWS, 'home', 'board')
    expect(views[0].widgets).toEqual([{ id, type: 'board' }])
    expect(parseViews(serializeViews(views))).toEqual(views)
    expect(parseViews(JSON.stringify({ views: [{ id: 'a', name: 'A', widgets: [{ id: 'w', type: 'chart' }, 3, { id: 'x' }] }] }))).toEqual([{ id: 'a', name: 'A', widgets: [{ id: 'w', type: 'chart' }] }])
    expect(removeWidget(views, 'home', id)).toEqual(DEFAULT_VIEWS)
  })

  it('knows the config folder', () => {
    expect(isConfigPath('.folio/views.json')).toBe(true)
    expect(isConfigPath('.folio')).toBe(true)
    expect(isConfigPath('.folios/x')).toBe(false)
    expect(isConfigPath('notes/.folio/x')).toBe(false)
  })

  it('moves a widget within its view', () => {
    const views = [{ id: 'a', name: 'A', widgets: [{ id: 'w1', type: 'board' }, { id: 'w2', type: 'note' }, { id: 'w3', type: 'note' }] }, { id: 'b', name: 'B' }]
    expect(moveWidget(views, 'a', 0, 2)[0].widgets.map(w => w.id)).toEqual(['w2', 'w3', 'w1'])
    expect(moveWidget(views, 'a', 2, 0)[0].widgets.map(w => w.id)).toEqual(['w3', 'w1', 'w2'])
    expect(moveWidget(views, 'b', 0, 1)[1]).toBe(views[1])
  })
  it('moves a view', () => {
    const views = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }]
    expect(moveView(views, 2, 0).map(v => v.id)).toEqual(['c', 'a', 'b'])
  })
})
