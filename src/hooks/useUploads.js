import { useEffect, useState } from 'react'
import { blobShaOf, toBase64 } from '../lib/github.js'
import { cache } from '../lib/cache.js'
import { nameError, freePath, virtualFiles, upload, replaceUpload, MAX_UPLOAD_BYTES } from '../lib/changes.js'

// Files dropped or picked on this device, added to a folder as local changes (synced with everything else), for `repo`
// (useRepo) and `assets` (useAssets: when each was added). `add(fileList, folder)`: each file's bytes are stored in the
// offline cache first, and only then is the change recorded, placed against the changes and GitHub's files as they are
// then (a sync may have run meanwhile): the file it replaces if it's still there, else the first free name. A taken name
// asks first: `clash` ({ name, folder, resolve(choice) }: 'replace', 'keep' or 'skip') while it does; what couldn't be
// added is listed in `errors` ([name, reason]) until `clearErrors()`. A file dropped anywhere else never opens in place
// of the app.
export function useUploads(repo, assets) {
  const [clash, setClash] = useState(null)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const block = e => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault() }
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  async function add(fileList, folder) {
    if (!repo.remote) {
      setErrors([...fileList].map(f => [f.name, 'Files are still loading. Try again in a moment.']))
      return
    }
    const failed = []
    for (const file of fileList) {
      const reason = nameError(file.name)
        || (file.size > MAX_UPLOAD_BYTES ? 'Larger than 25 MB, the most a phone can reliably handle.' : null)
      if (reason) { failed.push([file.name, reason]); continue }
      const path = folder ? `${folder}/${file.name}` : file.name
      let replace = false
      if (virtualFiles(repo.remoteFiles(), repo.latest())[path]) {
        const choice = await new Promise(resolve => setClash({ name: file.name, folder, resolve }))
        setClash(null)
        if (choice === 'skip') continue
        if (choice === 'replace') replace = true
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const sha = await blobShaOf(bytes)
        await cache.setBlob(sha, toBase64(bytes))
        if (await cache.getBlob(sha) === undefined) throw new Error()
        repo.update(c => {
          const remoteFiles = repo.remoteFiles()
          const now = virtualFiles(remoteFiles, c)
          const target = replace && now[path] ? path : freePath(c, now, path)
          return assets.record(target)(replace && now[path] ? replaceUpload(c, now[path], sha) : upload(c, remoteFiles, target, sha))
        })
      } catch {
        failed.push([file.name, 'Couldn\'t store it on this device (storage full or unavailable).'])
      }
    }
    setErrors(failed)
  }

  return { add, clash, errors, clearErrors: () => setErrors([]) }
}
