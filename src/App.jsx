import { useState, useEffect, useMemo, useRef } from 'react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import FileViewer from './components/FileViewer.jsx'
import { fileKind } from './lib/files.js'
import PullToRefresh from './components/PullToRefresh.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import ConflictModal from './components/ConflictModal.jsx'
import SyncButton from './components/SyncButton.jsx'
import SearchSheet from './components/SearchSheet.jsx'
import SignOutModal from './components/SignOutModal.jsx'
import DiscardModal from './components/DiscardModal.jsx'
import UploadClashModal from './components/UploadClashModal.jsx'
import UploadErrorsModal from './components/UploadErrorsModal.jsx'
import { blobShaOf, toBase64 } from './lib/github.js'
import SyncErrorModal from './components/SyncErrorModal.jsx'
import BrokenLinks from './components/BrokenLinks.jsx'
import SyncCheckModal from './components/SyncCheckModal.jsx'
import { useLinkIndex, LinksContext } from './hooks/useLinkIndex.js'
import { useSymlinks } from './hooks/useSymlinks.js'
import { rewriteLinks, retargetLink, extractLinks } from './lib/links.js'
import { NavContext } from './components/NavTree.jsx'
import { foldersToOpen } from './lib/tree.js'
import { NavRail, FloatingNav } from './components/AppNav.jsx'
import EmptyPage from './components/EmptyPage.jsx'
import Settings from './components/Settings.jsx'
import Spinner from './components/Spinner.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useRepo } from './hooks/useRepo.js'
import { useTheme } from './hooks/useTheme.js'
import { storage } from './lib/storage.js'
import { PAGE, MAIN_PAGES, mapOpenFiles } from './lib/pages.js'
import { urlForView, viewForUrl, existingView } from './lib/url.js'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner.jsx'
import { cache } from './lib/cache.js'
import {
  listDir, nameError, renameTarget, renameError, createError, add, setEdit, rename, remove, getAllFolders,
  upload, replaceUpload, freePath, virtualFiles, MAX_UPLOAD_BYTES,
} from './lib/changes.js'

const BASE = import.meta.env.BASE_URL
// A folder or file named by the address the app was opened at (not the root)
const deepLink = (() => {
  const view = viewForUrl(BASE, window.location.pathname)
  return view && (view.file || view.folder) ? view : null
})()
// A reload keeps the page you were on; the address always names File manager's folder, so it only picks the page for a fresh visit
const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload'

export default function App() {
  const auth = useAuth()
  const repo = useRepo(auth.user ? auth.repo : null, toast.success)
  const { theme, setTheme } = useTheme()
  const [page, setPage] = useState(() => (reloaded && storage.getPage()) || (deepLink ? PAGE.FILES : storage.getPage() || MAIN_PAGES[0].id))
  // The main page files open in (File manager when Settings / Broken links is open)
  const mainPage = MAIN_PAGES.some(p => p.id === page) ? page : PAGE.FILES
  // Each main page has its own open file; a file opens in the page you're on
  const [openFiles, setOpenFiles] = useState(() => ({ ...storage.getOpenFiles(), ...(deepLink && { files: deepLink.file }) }))
  const selectedFile = openFiles[mainPage] ?? null
  const setFileOn = (id, path) => setOpenFiles(o => ({ ...o, [id]: path }))
  const setSelectedFileState = path => setFileOn(mainPage, path)
  // Opening a symlink (from the list, search or a note's link) opens its
  // source: the folder, or the file
  function setSelectedFile(path) {
    const link = path && symlinks[path]
    if (link?.kind === 'folder') { openFolder(link.path); return }
    if (link?.path) path = link.path
    else if (path && path in symlinks) return // broken or still loading: nothing to open
    if (path) { storage.addRecentFile(path); setPage(mainPage) }
    setSelectedFileState(path)
  }
  const [folder, setFolder] = useState(() => deepLink ? deepLink.folder : storage.getFolder())
  const [newFile, setNewFile] = useState(null) // { folder, kind } while the sheet is open
  // Folders only exist in File manager
  function openFolder(path) {
    setPage(PAGE.FILES)
    setFolder(path)
    setFileOn(PAGE.FILES, null)
  }
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [discards, setDiscards] = useState(0) // remounts the open note after a discard
  const [searchOpen, setSearchOpen] = useState(false)
  const [syncCheck, setSyncCheck] = useState(false) // broken-links sheet before syncing
  const [uploadClash, setUploadClash] = useState(null) // { name, folder, resolve } while asking
  const [uploadErrors, setUploadErrors] = useState([]) // [name, reason] after adding files
  const started = useRef(false) // false until the first URL is set (replaced, not pushed)
  const replaceNext = useRef(false) // the next URL change replaces the history entry
  const known = useRef({ files: new Set(), folders: [] }) // what exists, for Back / Forward

  useEffect(() => { storage.setFolder(folder) }, [folder])
  useEffect(() => { storage.setOpenFiles(openFiles) }, [openFiles])
  useEffect(() => { storage.setPage(page) }, [page])

  // File tree: the open folders; the open file or folder is always revealed
  const [expanded, setExpanded] = useState(() => new Set(storage.getExpanded()))
  const treeCurrent = selectedFile ?? (mainPage === PAGE.FILES && folder ? folder : null)
  useEffect(() => { storage.setExpanded([...expanded]) }, [expanded])
  useEffect(() => {
    if (!treeCurrent) return
    const open = foldersToOpen(treeCurrent, !selectedFile)
    setExpanded(prev => open.every(f => prev.has(f)) ? prev : new Set([...prev, ...open]))
  }, [treeCurrent, selectedFile])
  const toggleFolder = path => setExpanded(prev => {
    const next = new Set(prev)
    if (!next.delete(path)) next.add(path)
    return next
  })

  // Keep the browser URL in sync with the current view: each new folder or
  // file is a history entry, so Back and Forward move between them. Changes
  // that only follow a rename or delete replace the entry instead.
  useEffect(() => {
    const url = urlForView(BASE, { file: openFiles.files ?? null, folder })
    if (window.location.pathname !== url) {
      if (started.current && !replaceNext.current) history.pushState(null, '', url)
      else history.replaceState(null, '', url)
    }
    started.current = true
    replaceNext.current = false
  }, [openFiles.files, folder])

  // Back / Forward: show the folder or file the URL names (or what's left of it)
  useEffect(() => {
    const onPop = () => {
      let view = viewForUrl(BASE, window.location.pathname)
      if (!view) return
      window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
      const { files, folders } = known.current
      if (files.size) view = existingView(view, files, folders)
      if (urlForView(BASE, view) !== window.location.pathname) replaceNext.current = true
      setPage(PAGE.FILES)
      setFolder(view.folder)
      setFileOn(PAGE.FILES, view.file)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const { virtual, changes, update } = repo
  const allFolders = useMemo(() => getAllFolders(virtual), [virtual])
  const files = useMemo(() => new Set(Object.keys(virtual)), [virtual])
  known.current = { files, folders: allFolders }
  const links = useLinkIndex(virtual, changes)
  const symlinks = useSymlinks(virtual)
  // The other way round: source path -> paths of the links pointing to it
  const linkedBy = useMemo(() => {
    const out = {}
    for (const [link, target] of Object.entries(symlinks)) if (target?.path) (out[target.path] ||= []).push(link)
    return out
  }, [symlinks])
  // A link's name in a source's header: go to the folder holding the link
  const openLink = link => openFolder(link.slice(0, Math.max(link.lastIndexOf('/'), 0)))

  // Notes whose links change if `item` moves to `to` (their path -> new text),
  // from `edits` (the latest local changes). The moved notes' own links are
  // rewritten too, so relative paths keep working from the new place.
  function linkRewrites(item, to, edits) {
    const mapPath = p => p === item.path || p.startsWith(item.path + '/') ? to + p.slice(item.path.length) : p
    const out = new Map()
    for (const [path, entry] of Object.entries(virtual)) {
      if (!path.endsWith('.md')) continue
      const text = edits[entry.orig] ?? links.remoteText(entry.sha)
      if (text === undefined) continue // not on this device yet
      const next = rewriteLinks(text, path, mapPath(path), mapPath, virtual)
      if (next !== text) out.set(path, next)
    }
    return out
  }

  // Rename or move `item` to path `to`; the open folder / note follows it
  // Links to and from it are rewritten in the same local changes (one commit).
  function relocate(item, to) {
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    update(ch => {
      let next = rename(ch, virtual, item.path, to, item.type === 'dir')
      for (const [path, text] of linkRewrites(item, to, ch.edits)) {
        const entry = virtual[path]
        next = setEdit(next, entry, text, links.remoteText(entry.sha) ?? '')
      }
      return next
    })
    const follow = p => p && (p === item.path || p.startsWith(item.path + '/')) ? to + p.slice(item.path.length) : p
    replaceNext.current = follow(folder) !== folder || follow(openFiles.files) !== openFiles.files
    setFolder(follow)
    setOpenFiles(o => mapOpenFiles(o, follow)) // the same files, not newly opened ones
  }

  function handleRename(item, name) {
    const to = renameTarget(item, name)
    const error = nameError(name) || renameError(changes, virtual, item, to)
    if (error) return error
    relocate(item, to)
    return null
  }

  function handleMove(item, targetFolder) {
    const to = targetFolder ? `${targetFolder}/${item.name}` : item.name
    const error = renameError(changes, virtual, item, to)
    if (error) return error
    relocate(item, to)
    return null
  }

  function handleDelete(item) {
    const inside = p => p === item.path || p?.startsWith(item.path + '/')
    replaceNext.current = inside(openFiles.files) || inside(folder)
    setOpenFiles(o => mapOpenFiles(o, p => inside(p) ? null : p))
    // Deleting the open folder (or one above it): go to its parent
    if (inside(folder)) setFolder(item.path.slice(0, Math.max(item.path.lastIndexOf('/'), 0)))
    update(ch => remove(ch, virtual, item.path, item.type === 'dir'))
  }

  function handleCreate(name) {
    if (!repo.remote) return 'Files are still loading.'
    const error = nameError(name)
    if (error) return error
    const base = newFile.folder ? `${newFile.folder}/${name}` : name
    if (newFile.kind === 'folder') {
      const err = createError(changes, virtual, [base, `${base}/.gitkeep`])
      if (err) return err
      update(ch => add(ch, repo.remote.files, `${base}/.gitkeep`, ''))
    } else {
      const path = `${base}.md`
      const err = createError(changes, virtual, [path])
      if (err) return err
      update(ch => add(ch, repo.remote.files, path, `# ${name}\n\n`))
      setSelectedFile(path)
    }
    setNewFile(null)
    return null
  }

  // Files dropped or picked on this device, added to `folder` as local
  // changes (synced with everything else). Each file's bytes are stored in
  // the offline cache first; only then is the change recorded.
  async function handleUpload(fileList, folder) {
    if (!repo.remote) {
      setUploadErrors([...fileList].map(f => [f.name, 'Files are still loading. Try again in a moment.']))
      return
    }
    const remoteFiles = repo.remote.files
    const errors = []
    let ch = changes
    for (const file of fileList) {
      const reason = nameError(file.name)
        || (file.size > MAX_UPLOAD_BYTES ? 'Larger than 25 MB, the most a phone can reliably handle.' : null)
      if (reason) { errors.push([file.name, reason]); continue }
      const view = virtualFiles(remoteFiles, ch)
      let path = folder ? `${folder}/${file.name}` : file.name
      let replace = null
      if (view[path]) {
        const choice = await new Promise(resolve => setUploadClash({ name: file.name, folder, resolve }))
        setUploadClash(null)
        if (choice === 'skip') continue
        if (choice === 'replace') replace = view[path]
      }
      if (!replace) path = freePath(ch, view, path)
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const sha = await blobShaOf(bytes)
        await cache.setBlob(sha, toBase64(bytes))
        if (await cache.getBlob(sha) === undefined) throw new Error()
        const apply = c => replace ? replaceUpload(c, replace, sha) : upload(c, remoteFiles, path, sha)
        ch = apply(ch)
        update(apply)
      } catch {
        errors.push([file.name, 'Couldn\'t store it on this device (storage full or unavailable).'])
      }
    }
    setUploadErrors(errors)
  }

  // Dropping a file outside the drop area would open it in place of the app
  useEffect(() => {
    const block = e => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault() }
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  // Drop all local changes; leave a note or folder that only existed locally
  function discardChanges() {
    setConfirmDiscard(false)
    repo.discardAll()
    const files = repo.remote?.files ?? {}
    setOpenFiles(o => mapOpenFiles(o, p => p && !files[p] ? null : p))
    if (folder && !getAllFolders(files).includes(folder)) setFolder('')
    setDiscards(n => n + 1)
  }

  // Sync, unless the repo has broken links: then offer to fix them first
  function requestSync() {
    window.dispatchEvent(new Event('folio:flush'))
    if (links.index.broken.length) setSyncCheck(true)
    else repo.sync()
  }

  // Everything fixed from the sheet: carry on with the sync
  useEffect(() => {
    if (syncCheck && links.index.broken.length === 0) {
      setSyncCheck(false)
      repo.sync()
    }
  }, [syncCheck, links.index.broken.length])

  // Point a broken link at the file it most likely meant
  function fixBrokenLink(broken, targetPath) {
    const entry = virtual[broken.from]
    update(ch => {
      const text = ch.edits[entry.orig] ?? links.remoteText(entry.sha)
      if (text === undefined) return ch
      // The index may lag behind typing: find the same link in the latest text
      const found = extractLinks(text)
      const l = found.find(x => x.target === broken.link.target && x.targetStart === broken.link.targetStart)
        ?? found.find(x => x.target === broken.link.target)
      if (!l) return ch
      const fixed = retargetLink(text, broken.from, l, targetPath)
      return setEdit(ch, entry, fixed, links.remoteText(entry.sha) ?? '')
    })
  }

  async function signOut() {
    setConfirmSignOut(false)
    setPage(PAGE.HOME)
    repo.discardAll()
    await cache.clearAll()
    auth.signOut()
    setOpenFiles({})
    setFolder('')
  }

  if (!auth.ready) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Spinner />
      </div>
    )
  }

  if (!auth.user) return <Auth onAuth={auth.authenticate} />
  if (!auth.repo) return <RepoSetup user={auth.user} onRepo={auth.selectRepo} onLogout={auth.signOut} />

  // A symlink never opens itself (opening one opens its source instead)
  const entry = selectedFile && !(selectedFile in symlinks) && virtual[selectedFile]
  const repoName = auth.repo.split('/')[1]
  const menu = {
    brokenCount: links.index.broken.length,
    onSignOut: () => setConfirmSignOut(true),
  }
  const renderSync = compact => (
    <SyncButton
      compact={compact}
      syncState={repo.syncState}
      syncing={repo.syncing}
      changeCount={repo.changeCount}
      incoming={repo.incoming}
      onSync={requestSync}
      onPull={repo.pullChanges}
      onDiscard={() => setConfirmDiscard(true)}
    />
  )

  // For the Rename / Move sheets: how many notes' links a change would touch
  const linkInfo = {
    rewriteCount: (item, to) => linkRewrites(item, to, changes.edits).size,
    linkedFrom: item => new Set(Object.entries(links.index.backlinks)
      .filter(([target]) => target === item.path || target.startsWith(item.path + '/'))
      .flatMap(([, refs]) => refs.map(r => r.from))
      .filter(from => !(from === item.path || from.startsWith(item.path + '/')))).size,
  }

  return (
    <LinksContext.Provider value={linkInfo}>
      <NavContext.Provider value={{
        listDir: dir => listDir(virtual, dir, repo.changed),
        symlinks,
        current: treeCurrent,
        expanded,
        onToggle: toggleFolder,
        onOpenFolder: openFolder,
        onOpenFile: setSelectedFile,
        loading: !repo.remote && !repo.error,
        repoName,
      }}>
      <div className="flex flex-col h-full bg-background">
        <Toaster theme={theme} position="top-center" />
        <PullToRefresh onRefresh={() => window.location.reload()}>
          <div className="flex flex-1 min-h-0">
          <NavRail page={page} onPage={setPage} onSearch={() => setSearchOpen(true)} renderSync={renderSync} menu={menu} />
          <main className="flex flex-col flex-1 min-w-0 min-h-0">
          {page === PAGE.SETTINGS ? (
            <Settings login={auth.user.login} repo={auth.repo} theme={theme} onTheme={setTheme} />
          ) : (page === PAGE.HOME || page === PAGE.GRAPH) && !entry ? (
            <EmptyPage page={page} />
          ) : page === PAGE.LINKS ? (
            <BrokenLinks
              broken={links.index.broken}
              files={virtual}
              missing={links.missing}
              onOpen={setSelectedFile}
              onFix={fixBrokenLink}
            />
          ) : entry && ['image', 'pdf'].includes(fileKind(selectedFile)) ? (
            <FileViewer
              key={selectedFile}
              linkedBy={linkedBy[selectedFile]}
              onOpenLink={openLink}
              path={selectedFile}
              entry={entry}
              onRename={handleRename}
              onDelete={handleDelete}
              onMove={handleMove}
              folders={allFolders}
            />
          ) : entry ? (
            <Editor
              key={`${selectedFile}:${discards}`}
              linkedBy={linkedBy[selectedFile]}
              onOpenLink={openLink}
              path={selectedFile}
              entry={entry}
              files={virtual}
              edited={changes.edits[entry.orig]}
              onEdit={(content, original) =>
                update(ch => setEdit(ch, virtual[selectedFile], content, original))}
              onNavigate={openFolder}
              onOpenFile={setSelectedFile}
              onRename={handleRename}
              onDelete={handleDelete}
              onMove={handleMove}
              folders={allFolders}
              backlinks={links.index.backlinks[selectedFile]}
            />
          ) : (
            <FileBrowser
              path={folder}
              onNavigate={setFolder}
              listDir={dir => listDir(virtual, dir, repo.changed)}
              loading={!repo.remote && !repo.error}
              error={repo.error}
              notice={repo.remote?.truncated ? 'This repo is too large to list in full; some files are missing.' : ''}
              onRename={handleRename}
              onDelete={handleDelete}
              onMove={handleMove}
              folders={allFolders}
              onSelect={setSelectedFile}
              onNewFile={(f, kind) => setNewFile({ folder: f, kind })}
              onUpload={handleUpload}
              repoName={repoName}
              symlinks={symlinks}
              linkedBy={folder ? linkedBy[folder] : undefined}
              onOpenLink={openLink}
            />
          )}
          </main>
          </div>
        </PullToRefresh>
        <FloatingNav page={page} onPage={setPage} onSearch={() => setSearchOpen(true)} renderSync={renderSync} menu={menu} />

        {syncCheck && (
        <SyncCheckModal
          broken={links.index.broken}
          files={virtual}
          onFix={fixBrokenLink}
          onOpenNote={path => { setSyncCheck(false); setSelectedFile(path) }}
          onOpenPage={() => { setSyncCheck(false); setPage(PAGE.LINKS) }}
          onSyncAnyway={() => { setSyncCheck(false); repo.sync() }}
          onClose={() => setSyncCheck(false)}
        />
      )}

      {repo.syncError && (
          <SyncErrorModal error={repo.syncError} onRetry={repo.syncError.retry} onClose={repo.dismissSyncError} />
        )}

        {uploadClash && (
          <UploadClashModal name={uploadClash.name} folder={uploadClash.folder} onChoose={uploadClash.resolve} />
        )}

        {uploadErrors.length > 0 && (
          <UploadErrorsModal errors={uploadErrors} onClose={() => setUploadErrors([])} />
        )}

        {confirmDiscard && (
          <DiscardModal changeCount={repo.changeCount} onDiscard={discardChanges} onClose={() => setConfirmDiscard(false)} />
        )}

        {confirmSignOut && (
          <SignOutModal changeCount={repo.changeCount} onSignOut={signOut} onClose={() => setConfirmSignOut(false)} />
        )}

        {newFile && (
          <NewFileModal
            folder={newFile.folder}
            kind={newFile.kind}
            onCreate={handleCreate}
            onClose={() => setNewFile(null)}
          />
        )}

        {repo.conflictPaths.length > 0 && (
          <ConflictModal
            paths={repo.conflictPaths}
            busy={repo.syncing}
            onPushLocal={repo.pushLocal}
            onUseRemote={repo.takeRemote}
            onClose={repo.dismissConflicts}
          />
        )}

        {searchOpen && (
          <SearchSheet
            onClose={() => setSearchOpen(false)}
            onSelect={path => { setSelectedFile(path); if (mainPage === PAGE.FILES) setFolder('') }}
            virtual={virtual}
            changes={changes}
            recent={storage.getRecentFiles()}
          />
        )}
      </div>
      </NavContext.Provider>
    </LinksContext.Provider>
  )
}
