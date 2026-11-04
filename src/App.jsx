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
import { NavRail, TopBar } from './components/AppNav.jsx'
import EmptyPage from './components/EmptyPage.jsx'
import Settings from './components/Settings.jsx'
import Spinner from './components/Spinner.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useRepo } from './hooks/useRepo.js'
import { useTheme } from './hooks/useTheme.js'
import { storage } from './lib/storage.js'
import { PAGE, MAIN_PAGES } from './lib/pages.js'
import { urlForPage, pageForUrl, existingView } from './lib/url.js'
import { fileView, folderView, startTrails, currentView, openView, trailTo, movedTrails, keptTrails } from './lib/views.js'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner.jsx'
import { cache } from './lib/cache.js'
import {
  listDir, nameError, renameTarget, renameError, createError, add, setEdit, rename, remove, getAllFolders,
  upload, replaceUpload, freePath, virtualFiles, MAX_UPLOAD_BYTES,
} from './lib/changes.js'

const BASE = import.meta.env.BASE_URL
// The page and view the address the app was opened at names (not the bare root)
const deepLink = (() => {
  const found = pageForUrl(BASE, window.location.pathname, window.location.search)
  return found && (found.page !== PAGE.FILES || found.view.file || found.view.folder) ? found : null
})()
// A reload keeps the page you were on (Settings and Broken links aren't in the address); otherwise the address picks it
const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload'

export default function App() {
  const auth = useAuth()
  const repo = useRepo(auth.user ? auth.repo : null, toast.success)
  const { theme, setTheme } = useTheme()
  const [page, setPage] = useState(() => (reloaded && storage.getPage()) || (deepLink ? deepLink.page : storage.getPage() || MAIN_PAGES[0].id))
  // The main page files and folders open in (File manager when Settings / Broken links is open)
  const mainPage = MAIN_PAGES.some(p => p.id === page) ? page : PAGE.FILES
  // Each main page has its own trail of views (lib/views.js); files and folders open in the page you're on
  const [trails, setTrails] = useState(() => {
    const stored = { ...startTrails(), ...storage.getTrails() }
    return deepLink ? { ...stored, [deepLink.page]: trailTo(deepLink.page, stored[deepLink.page], deepLink.view) } : stored
  })
  const view = currentView(mainPage, trails[mainPage])
  const selectedFile = view?.file ?? null
  const folder = view?.folder ?? ''
  const show = v => { setPage(mainPage); setTrails(o => ({ ...o, [mainPage]: openView(mainPage, o[mainPage], v) })) }
  // Opening a symlink (from the list, search or a note's link) opens its
  // source: the folder, or the file
  function setSelectedFile(path) {
    const link = symlinks[path]
    if (link?.kind === 'folder') { openFolder(link.path); return }
    if (link?.path) path = link.path
    else if (path in symlinks) return // broken or still loading: nothing to open
    storage.addRecentFile(path)
    show(fileView(path))
  }
  const openFolder = path => show(folderView(path))
  // The navigation: choosing the page you're on again takes Home and Graph back to their own content
  function choosePage(id) {
    if (id === page && id !== PAGE.FILES && trails[id].length) setTrails(o => ({ ...o, [id]: [] }))
    setPage(id)
  }
  // ← in the title bar: the page's previous view. When that's also the
  // browser's previous entry, it's the browser's Back, so history stays one line.
  function goBack() {
    const rest = trails[mainPage].slice(0, -1)
    if (history.state?.prev === urlForPage(BASE, mainPage, currentView(mainPage, rest))) history.back()
    else setTrails(o => ({ ...o, [mainPage]: rest }))
  }
  const [newFile, setNewFile] = useState(null) // { folder, kind } while the sheet is open
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

  useEffect(() => { storage.setTrails(trails) }, [trails])
  useEffect(() => { storage.setPage(page) }, [page])

  // File tree: the open folders; the open file or folder is always revealed
  const [expanded, setExpanded] = useState(() => new Set(storage.getExpanded()))
  const treeCurrent = selectedFile ?? (folder || null)
  useEffect(() => { storage.setExpanded([...expanded]) }, [expanded])
  useEffect(() => {
    if (!treeCurrent) return
    const open = foldersToOpen(treeCurrent, !selectedFile)
    setExpanded(prev => open.every(f => prev.has(f)) ? prev : new Set([...prev, ...open]))
  }, [treeCurrent, selectedFile])
  // The desktop file tree panel, hidden with the button in its title and shown again from the rail
  const [treeCollapsed, setTreeCollapsed] = useState(storage.getTreeCollapsed)
  useEffect(() => { storage.setTreeCollapsed(treeCollapsed) }, [treeCollapsed])
  const toggleTree = () => setTreeCollapsed(c => !c)
  const toggleFolder = path => setExpanded(prev => {
    const next = new Set(prev)
    if (!next.delete(path)) next.add(path)
    return next
  })

  // Keep the browser URL in sync with the main page you're on and its view:
  // each new page, folder or file is a history entry, so Back and Forward move
  // between them. Changes that only follow a rename or delete replace the
  // entry instead. Settings and Broken links leave the address as it is.
  // Each entry remembers the address before it (`prev`), for ←.
  const url = page === mainPage ? urlForPage(BASE, page, view) : null
  useEffect(() => {
    if (!url) return
    const here = window.location.pathname + window.location.search
    if (here !== url) {
      if (started.current && !replaceNext.current) history.pushState({ prev: here }, '', url)
      else history.replaceState(history.state, '', url)
    }
    started.current = true
    replaceNext.current = false
  }, [url])

  // Back / Forward: show the folder or file the URL names (or what's left of it)
  useEffect(() => {
    const onPop = () => {
      const found = pageForUrl(BASE, window.location.pathname, window.location.search)
      if (!found) return
      window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
      let { page: to, view } = found
      const { files, folders } = known.current
      if (view && files.size) view = existingView(view, files, folders)
      if (urlForPage(BASE, to, view) !== window.location.pathname + window.location.search) replaceNext.current = true
      setPage(to)
      setTrails(o => ({ ...o, [to]: trailTo(to, o[to], view) }))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const { virtual, changes, update } = repo
  const allFolders = useMemo(() => getAllFolders(virtual), [virtual])
  // Files and folders that are gone (deleted, discarded, removed by a Pull or
  // Sync) leave every page's trail: each page shows what it showed before them
  useEffect(() => {
    if (!repo.remote) return
    const folders = new Set(allFolders)
    const next = keptTrails(trails, v => v.file ? v.file in virtual : !v.folder || folders.has(v.folder))
    if (MAIN_PAGES.some(p => next[p.id].length !== trails[p.id].length)) followTrails(next)
  }, [virtual])
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
    followTrails(movedTrails(trails, item.path, to)) // the same files and folders, not newly opened ones
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

  // A move by drag and drop (file list, file tree): a refusal shows as a toast
  function handleDropMove(item, targetFolder) {
    const error = handleMove(item, targetFolder)
    if (error) toast.error(error)
  }

  // Every page's trail after a rename, delete or discard (`next`); the address
  // is replaced, not added to history (only when it shows: not on Settings / Broken links)
  function followTrails(next) {
    if (page === mainPage && urlForPage(BASE, page, currentView(page, next[page])) !== url) replaceNext.current = true
    setTrails(next)
  }

  function handleDelete(item) {
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

  // Drop all local changes (a note or folder that only existed locally leaves the trails)
  function discardChanges() {
    setConfirmDiscard(false)
    repo.discardAll()
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

  // Another repo: typing in the open note is saved first (local changes are
  // kept per repo), then the app opens there
  function switchRepo(full) {
    if (repo.syncing) return // a sync is never cut off (RepoMenu disables switching meanwhile)
    window.dispatchEvent(new Event('folio:flush'))
    auth.switchRepo(full)
  }

  async function signOut() {
    setConfirmSignOut(false)
    setPage(PAGE.HOME)
    repo.discardAll()
    await cache.clearAll()
    auth.signOut()
    setTrails(startTrails())
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
        onCollapseAll: () => setExpanded(new Set()),
        itemActions: { onRename: handleRename, onDelete: handleDelete, onMove: handleMove, folders: allFolders },
        onOpenFolder: openFolder,
        onOpenFile: setSelectedFile,
        treeCollapsed,
        onToggleTree: toggleTree,
        onBack: page === mainPage && trails[mainPage].length ? goBack : null,
        onDropMove: handleDropMove,
        onUpload: handleUpload,
        loading: !repo.remote && !repo.error,
        repo: auth.repo,
        repos: auth.repos,
        onSwitchRepo: switchRepo,
        syncing: repo.syncing,
      }}>
      <div className="flex flex-col h-full bg-background">
        <Toaster theme={theme} />
        <PullToRefresh onRefresh={() => window.location.reload()}>
          <div className="flex flex-1 min-h-0">
          <NavRail page={page} onPage={choosePage} onSearch={() => setSearchOpen(true)} renderSync={renderSync} menu={menu} onShowTree={treeCollapsed && page === mainPage ? toggleTree : null} />
          <main className="flex flex-col flex-1 min-w-0 min-h-0">
          <TopBar page={page} onPage={choosePage} onSearch={() => setSearchOpen(true)} renderSync={renderSync} menu={menu} />
          {page === PAGE.SETTINGS ? (
            <Settings login={auth.user.login} repo={auth.repo} theme={theme} onTheme={setTheme} />
          ) : !view ? (
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
              onNavigate={openFolder}
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
              onDropMove={handleDropMove}
              repoName={repoName}
              symlinks={symlinks}
              linkedBy={folder ? linkedBy[folder] : undefined}
              onOpenLink={openLink}
            />
          )}
          </main>
          </div>
        </PullToRefresh>

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
            onSelect={setSelectedFile}
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
