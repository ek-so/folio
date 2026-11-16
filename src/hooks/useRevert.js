import { commitFiles, commitParent, fileOn, getBlobBase64, getBlob } from '../lib/github.js'
import { virtualFiles } from '../lib/changes.js'
import { isConfigPath } from '../lib/viewsConfig.js'
import { reverted, sides } from '../lib/revert.js'

// Text files, whose undo merges line by line: notes and the app's settings
const isText = path => path.endsWith('.md') || isConfigPath(path)

// Undo of an update from Recent updates (lib/revert.js) for `repo` (useRepo): `revert(sha)` reads from GitHub how each
// file the commit `sha` changed was before and after it, with the bytes of both (so they're on this device), and then
// records the undo as local changes through `repo.update`, typing in an open note saved first. Resolves to
// { kept, left } (lib/revert.js); rejects when GitHub can't be reached (offline) or fails.
export function useRevert(repo) {
  return async function revert(sha) {
    const [list, parent] = await Promise.all([commitFiles(sha), commitParent(sha)])
    const files = repo.remote?.files ?? {}
    const texts = new Map()
    // A version's bytes, on this device from now on; its text too when it's a text file
    const load = async (path, version) => {
      if (!version) return null
      if (isText(path)) texts.set(version.sha, await getBlob(version.sha))
      else await getBlobBase64(version.sha)
      return { path, sha: version.sha }
    }
    const steps = []
    for (const f of list) {
      const { before, after } = sides(f)
      const [was, is] = await Promise.all([
        before && parent ? fileOn(before, parent) : null,
        after ? fileOn(after, sha) : null,
      ])
      if (was || is) steps.push({ before: await load(before, was), after: await load(after, is) })
    }
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    // The text of what's at the update's files now, as GitHub has it (the local changes' own text is in them)
    const now = virtualFiles(files, repo.latest())
    for (const { after } of steps) {
      const entry = after && now[after.path]
      if (!entry || !isText(after.path)) continue
      for (const s of new Set([entry.sha, files[entry.orig]?.sha])) if (s) texts.set(s, await getBlob(s))
    }
    let result
    repo.update(ch => {
      result = reverted(ch, files, steps, s => texts.get(s))
      return result.changes
    })
    return { kept: result.kept, left: result.left }
  }
}
