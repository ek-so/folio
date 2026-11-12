import { describe, it, expect } from 'vitest'
import { graphData } from './graph.js'

describe('graph', () => {
  it('joins files to their folders and links files, leaving out config, archive and dot files', () => {
    const files = { 'a.md': 1, 'Notes/b.md': 1, 'Notes/Deep/pic.png': 1, '.folio/views.json': 1, '.archive/2026-11-01/x.md': 1, 'Notes/.gitkeep': 1 }
    const backlinks = { 'Notes/b.md': [{ from: 'a.md' }, { from: 'a.md' }], 'a.md': [{ from: 'Notes/b.md' }], 'Notes/Deep/pic.png': [{ from: 'Notes/b.md' }], 'gone.md': [{ from: 'a.md' }] }
    const { nodes, edges } = graphData(files, backlinks, 'repo')
    expect(nodes.map(n => [n.id, n.kind])).toEqual([
      ['', 'root'], ['Notes/Deep/pic.png', 'file'], ['Notes/Deep', 'folder'], ['Notes', 'folder'], ['Notes/b.md', 'note'], ['a.md', 'note'],
    ])
    expect(nodes.find(n => n.id === 'a.md').name).toBe('a')
    expect(edges.filter(e => e.kind === 'folder').map(e => `${e.source}>${e.target}`).sort())
      .toEqual(['>Notes', '>a.md', 'Notes/Deep>Notes/Deep/pic.png', 'Notes>Notes/Deep', 'Notes>Notes/b.md'])
    expect(edges.filter(e => e.kind === 'link').map(e => `${e.source}>${e.target}`)).toEqual(['a.md>Notes/b.md', 'Notes/b.md>Notes/Deep/pic.png'])
  })
})
