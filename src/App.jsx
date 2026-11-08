import { useState, useEffect, useMemo, useRef } from 'react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import FileViewer from './components/FileViewer.jsx'
import { fileKind } from './lib/files.js'
import PullToRefresh from './components/PullToRefresh.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import EditListModal from './components/EditListModal.jsx'
import PageTitle from './components/PageTitle.jsx'
import PageIcon from './components/PageIcon.jsx'
import Assets from './components/Assets.jsx'
import { useAssets } from './hooks/useAssets.js'
import EmojiPicker from './components/EmojiPicker.jsx'
import ConflictModal from './components/ConflictModal.jsx'
import SyncButton from './components/SyncButton.jsx'
import SearchSheet from './components/SearchSheet.jsx'
import ConfirmModal from './components/ConfirmModal.jsx'
import UploadClashModal from './components/UploadClashModal.jsx'
import UploadErrorsModal from './components/UploadErrorsModal.jsx'
import { blobShaOf, toBase64 } from './lib/github.js'
import SyncErrorModal from './components/SyncErrorModal.jsx'
import BrokenLinks from './components/BrokenLinks.jsx'
import Documentation from './components/Documentation.jsx'
import SyncCheckModal from './components/SyncCheckModal.jsx'
import { useLinkIndex, LinksContext } from './hooks/useLinkIndex.js'
import { useSymlinks } from './hooks/useSymlinks.js'
import { rewriteLinks, retargetLink, extractLinks, SYMLINK_MODE } from './lib/links.js'
import { NavContext } from './components/NavTree.jsx'
import { NavRail, TopBar } from './components/AppNav.jsx'
import EmptyPage from './components/EmptyPage.jsx'
import Settings from './components/Settings.jsx'
import Spinner from './components/Spinner.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useRepo } from './hooks/useRepo.js'
import { useConfig } from './hooks/useConfig.js'
import { useTagColors } from './hooks/useTagColors.js'
import { useLocks } from './hooks/useLocks.js'
import { useIcons, IconsContext } from './hooks/useIcons.js'
import ViewPage from './components/ViewPage.jsx'
import RenameModal from './components/RenameModal.jsx'
import DeleteModal from './components/DeleteModal.jsx'
import { useTheme } from './hooks/useTheme.js'
import { storage } from './lib/storage.js'
import { PAGE, mainPages } from './lib/pages.js'
import { isConfigPath, addView, renameView, removeView, VIEWS_PATH, DEFAULT_VIEWS, parseViews, serializeViews, addWidget, removeWidget, moveWidget, moveView, setViewIcon } from './lib/viewsConfig.js'
import { withKeys, withValue, copyTitled } from './lib/frontmatter.js'
import { widgetType } from './widgets/index.js'
import { urlForPage, pageForUrl, existingView } from './lib/url.js'
import { fileView, folderView, startTrails, currentView, openView, trailTo, movedTrails, keptTrails, upView, START } from './lib/views.js'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner.jsx'
import { TooltipProvider } from './components/ui/tooltip.jsx'
import { SingleOpenProvider } from './hooks/useSingleOpen.jsx'
import { cache } from './lib/cache.js'
import { archiveDay, inArchive, staleArchiveDays, KEEP_DAYS } from './lib/archive.js'
import { fileItem } from './lib/folderNotes.js'
import {
  listDir, nameError, renameTarget, renameError, createError, add, setEdit, rename, remove, getAllFolders,
  upload, replaceUpload, freePath, virtualFiles, splitName, editNote, duplicate, keptEdits, MAX_UPLOAD_BYTES,
} from './lib/changes.js'
import { plural } from './lib/plural.js'

const BASE = import.meta.env.BASE_URL
// The page and view the address the app was opened at names (not the bare root)
const deepLink = (() => {
  const found = pageForUrl(BASE, window.location.pathname, window.location.search)
  return found && (found.page !== PAGE.FILES || found.view.file || found.view.folder) ? found : null
})()
// A reload keeps the page you were on (Settings, Broken links and Documentation aren't in the address); otherwise the address picks it
const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload'

export default function App() {
  const auth = useAuth()
  const repo = useRepo(auth.user ? auth.repo : null, toast.success)
  const { virtual, changes, update } = repo
  // The app's settings in the repo's .folio/: the views in the navigation (Home…) and their widgets' own
  const config = useConfig(repo)
  const tagColors = useTagColors(config)
  const locks = useLocks(config) // files locked against editing (lib/locks.js)
  const icons = useIcons(config) // the emoji icons of files and folders (lib/icons.js)
  const assets = useAssets(config) // when files were added, for the Assets page (lib/assets.js)
  const viewsFile = config.read(VIEWS_PATH)
  const parsedViews = viewsFile.ready ? parseViews(viewsFile.text) : undefined
  const views = parsedViews ?? DEFAULT_VIEWS
  // Views can be changed once the file is read, and only when it could be (an unreadable one is never saved over)
  const viewsBroken = parsedViews === null
  const viewsReady = viewsFile.ready && !viewsBroken
  const pages = mainPages(views)
  const widgets = views.flatMap(v => v.widgets ?? []) // on every view
  const { theme, setTheme } = useTheme()
  const [openPage, setPage] = useState(() => (reloaded && storage.getPage()) || (deepLink ? deepLink.page : storage.getPage() || PAGE.HOME))
  // A view that's gone (deleted here or on another device) falls back to the first page; until the config is read, the remembered page stays
  const fixedPage = openPage === PAGE.SETTINGS || openPage === PAGE.LINKS || openPage === PAGE.DOCS || openPage === PAGE.ASSETS
  const page = fixedPage || !viewsFile.ready || pages.some(p => p.id === openPage) ? openPage : pages[0].id
  // The main page files and folders open in (File manager when Settings / Broken links / Documentation is open)
  const mainPage = fixedPage ? PAGE.FILES : page
  // Each main page has its own trail of views (lib/views.js); files and folders open in the page you're on
  const [trails, setTrails] = useState(() => {
    const stored = { ...startTrails(pages.map(p => p.id)), ...storage.getTrails() }
    return deepLink ? { ...stored, [deepLink.page]: trailTo(deepLink.page, stored[deepLink.page], deepLink.view) } : stored
  })
  const trailOf = id => trails[id] ?? []
  const view = currentView(mainPage, trailOf(mainPage))
  const selectedFile = view?.file ?? null
  const folder = view?.folder ?? ''
  // `target`: the page it opens in (the page you're on unless given; Search opens in File manager)
  const show = (v, target = mainPage) => { setPage(target); setTrails(o => ({ ...o, [target]: openView(target, o[target], v) })) }
  // Opening a symlink (from the list, search or a note's link) opens its
  // source: the folder, or the file
  function setSelectedFile(path, target) {
    const link = symlinks[path]
    if (link?.kind === 'folder') { openFolder(link.path, target); return }
    if (link?.path) path = link.path
    else if (path in symlinks) return // broken or still loading: nothing to open
    storage.addRecentFile(path)
    show(fileView(path), target)
  }
  const openFolder = (path, target) => show(folderView(path), target)
  // The navigation: choosing the page you're on again takes Home and Graph back to their own content
  function choosePage(id) {
    if (id === page && id !== PAGE.FILES && trailOf(id).length) setTrails(o => ({ ...o, [id]: [] }))
    setPage(id)
  }
  // ← in the title bar (lib/views.js `upView`): in File manager a level up, elsewhere the page's start
  const up = view && upView(mainPage, view)
  const goUp = up && (() => up === START ? setTrails(o => ({ ...o, [mainPage]: [] })) : show(up))
  const [newFile, setNewFile] = useState(null) // { folder, kind, keys?, values?, stay?, titled? } while the sheet is open (keys: a new note's properties; stay: don't open it; titled: asks for its title too)
  const [viewDialog, setViewDialog] = useState(null) // { kind: 'rename' | 'delete', view } while a view's dialog is open
  const [viewsSettings, setViewsSettings] = useState(false) // Views settings is open: add, order and remove views
  const [adding, setAdding] = useState(null) // { viewId, type } while a new widget's Setup is open
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [discards, setDiscards] = useState(0) // remounts the open note after a discard
  const [searchOpen, setSearchOpen] = useState(false)
  const [syncCheck, setSyncCheck] = useState(false) // broken-links sheet before syncing
  const [uploadClash, setUploadClash] = useState(null) // { name, folder, resolve } while asking
  const [uploadErrors, setUploadErrors] = useState([]) // [name, reason] after adding files
  const mainRef = useRef(null) // the page's column: the phone top bar hides while it scrolls
  const started = useRef(false) // false until the first URL is set (replaced, not pushed)
  const replaceNext = useRef(false) // the next URL change replaces the history entry
  const known = useRef({ files: new Set(), folders: [] }) // what exists, for Back / Forward

  useEffect(() => { storage.setTrails(trails) }, [trails])
  useEffect(() => { storage.setPage(page) }, [page])

  // The title bar's folder tree: the folders open in it
  const [expanded, setExpanded] = useState(() => new Set(storage.getExpanded()))
  useEffect(() => { storage.setExpanded([...expanded]) }, [expanded])
  const toggleFolder = path => setExpanded(prev => {
    const next = new Set(prev)
    if (!next.delete(path)) next.add(path)
    return next
  })

  // Keep the browser URL in sync with the main page you're on and its view:
  // each new page, folder or file is a history entry, so Back and Forward move
  // between them. Changes that only follow a rename or delete replace the
  // entry instead. Settings, Broken links and Documentation leave the address as it is.
  const url = page === mainPage ? urlForPage(BASE, page, view) : null
  useEffect(() => {
    if (!url) return
    const here = window.location.pathname + window.location.search
    if (here !== url) {
      if (started.current && !replaceNext.current) history.pushState(null, '', url)
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

  // What File manager, the folder tree and Search show: the config folder stays out of them
  const shown = useMemo(() => Object.fromEntries(Object.entries(virtual).filter(([path]) => !isConfigPath(path))), [virtual])
  const allFolders = useMemo(() => getAllFolders(shown), [shown])
  // Files and folders that are gone (deleted, discarded, removed by a Pull or
  // Sync) leave every page's trail: each page shows what it showed before them
  useEffect(() => {
    if (!repo.remote) return
    const folders = new Set(allFolders)
    const next = keptTrails(trails, v => v.file ? v.file in virtual : !v.folder || folders.has(v.folder))
    if (Object.keys(next).some(id => next[id].length !== trails[id].length)) followTrails(next)
  }, [virtual])
  const files = useMemo(() => new Set(Object.keys(shown)), [shown])
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
  // `files`: the files those edits make (default: as they are now).
  function linkRewrites(item, to, edits, files = virtual) {
    const mapPath = p => p === item.path || p.startsWith(item.path + '/') ? to + p.slice(item.path.length) : p
    const out = new Map()
    for (const [path, entry] of Object.entries(files)) {
      if (!path.endsWith('.md')) continue
      const text = edits[entry.orig] ?? links.remoteText(entry.sha)
      if (text === undefined) continue // not on this device yet
      const next = rewriteLinks(text, path, mapPath(path), mapPath, files)
      if (next !== text) out.set(path, next)
    }
    return out
  }

  // The files `ch` makes
  const filesOf = ch => virtualFiles(repo.remote?.files ?? {}, ch)
  // `ch` with `item` moved to path `to`: links to and from it are rewritten in
  // the same local changes (one commit), and every widget follows it (`moved`)
  // `follow` false (to and from the archive): widgets keep their paths, so a widget showing it finds it gone
  function relocated(ch, item, to, follow = true) {
    const files = filesOf(ch)
    let next = rename(ch, files, item.path, to, item.type === 'dir')
    for (const [path, text] of linkRewrites(item, to, ch.edits, files)) {
      const entry = files[path]
      next = setEdit(next, entry, text, links.remoteText(entry.sha) ?? '')
    }
    for (const w of follow ? widgets : []) {
      const type = widgetType(w.type)
      if (type?.moved) next = type.moved(next, w.id, item.path, to, item.type === 'dir', widgetServices)
    }
    return assets.moved(item.path, to, item.type === 'dir')(icons.moved(item.path, to, item.type === 'dir')(locks.moved(item.path, to, item.type === 'dir')(next))) // a lock, an emoji and when it was added go where their file goes (the archive too)
  }

  // `fn` (ch => ch) as a change that never edits a locked note's text: what it changed there is put back (keptEdits).
  // Every edit that isn't the app's own (renames, moves, link rewrites) goes through it: widgets, a note's values
  const guarded = fn => ch => keptEdits(ch, fn(ch), Object.entries(filesOf(ch)).filter(([path]) => locks.isLocked(path)).map(([, e]) => e.orig))
  // Locked: `item` itself, or for a folder a file in it
  const lockedIn = item => locks.isLocked(item.path) || (item.type === 'dir' && Object.keys(virtual).some(p => p.startsWith(item.path + '/') && locks.isLocked(p)))

  // The first path `item` can move to: `wanted` itself, else with a number ("x 2.md", "folder 2"); a path it was moved
  // away from counts as free for it (renameError), so an undo puts it back in its own place
  function freeTarget(ch, item, wanted) {
    const slash = wanted.lastIndexOf('/') + 1
    const [stem, ext] = item.type === 'dir' ? [wanted.slice(slash), ''] : splitName(wanted.slice(slash))
    let to = wanted
    for (let n = 2; renameError(ch, filesOf(ch), item, to); n++) to = `${wanted.slice(0, slash)}${stem} ${n}${ext}`
    return to
  }

  // Rename or move `item` to path `to`; the open folder / note follows it
  function relocate(item, to) {
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    update(ch => relocated(ch, item, to))
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

  // A move by drag and drop (file list): a refusal shows as a toast
  function handleDropMove(item, targetFolder) {
    const error = handleMove(item, targetFolder)
    if (error) toast.error(error)
  }

  const saveViews = next => { if (viewsReady) update(config.write(VIEWS_PATH, serializeViews(next))) }
  // `ch` with the views changed to `next`, and `gone` widgets' own settings removed (`removed`)
  const viewsChange = (ch, next, gone = []) => gone.reduce(
    (c, w) => widgetType(w.type)?.removed?.(c, w.id, widgetServices) ?? c,
    config.write(VIEWS_PATH, serializeViews(next))(ch))

  // A new widget of `type` on view `viewId`, set up by `change` (id => ch => ch, from its Setup)
  function addWidgetTo(viewId, type, change = () => ch => ch) {
    if (!viewsReady || !repo.remote) return
    const { views: next, id } = addWidget(views, viewId, type)
    update(ch => change(id)(viewsChange(ch, next)))
  }

  // Add widget: its Setup asks what it needs first, if it has one
  const startWidget = (viewId, type) => widgetType(type)?.Setup ? setAdding({ viewId, type }) : addWidgetTo(viewId, type)

  function removeWidgetOf(viewId, widgetId) {
    if (viewsReady) update(ch => viewsChange(ch, removeWidget(views, viewId, widgetId), widgets.filter(w => w.id === widgetId)))
  }

  // Files moved in one step, each right into its folder (`targets`: [path, folder]; a taken
  // name gets a number: "x 2.md"); links and widgets follow, like any move
  function moveAll(targets) {
    window.dispatchEvent(new Event('folio:flush'))
    const moves = []
    update(ch => {
      let next = ch
      for (const [path, folder] of targets) {
        const item = fileItem(path)
        const [stem, ext] = splitName(item.name)
        const dir = folder ? folder + '/' : ''
        let to = dir + item.name
        for (let n = 2; renameError(next, filesOf(next), item, to); n++) to = `${dir}${stem} ${n}${ext}`
        if (to !== path) { next = relocated(next, item, to); moves.push([path, to]) }
      }
      return next
    })
    followTrails(moves.reduce((t, [from, to]) => movedTrails(t, from, to), trails))
  }

  // All a widget gets from the app (widgets/index.js): what the repo holds, the
  // settings files, and the app's own ways to change and open files
  const widgetServices = {
    canEdit: viewsReady && !!repo.remote,
    // Locked files (lib/locks.js): `locked(path)`; Lock / Unlock in a card's ⋯ (`toggleLock`, only when `canLock`)
    locked: path => locks.isLocked(path),
    canLock: locks.canEdit,
    toggleLock: path => update(locks.toggle(path)),
    files: Object.keys(shown),
    folders: allFolders,
    notes: links.notes,
    remoteFiles: repo.remote?.files ?? {},
    remoteText: links.remoteText,
    repoName: auth.repo?.split('/')[1] ?? '',
    config,
    tagColors,
    update: fn => update(guarded(fn)), // a widget never edits a locked note
    openFile: path => setSelectedFile(path),
    openFolder: path => openFolder(path),
    // A move that's refused shows as a toast; true when it's done
    move: (item, folder) => { const error = handleMove(item, folder); if (error) toast.error(error); return !error },
    moveAll,
    rename: (item, name) => handleRename(item, name),
    duplicate: item => handleDuplicate(item),
    remove: item => handleDelete(item),
    // Several files to the archive at once (a board column's cards), told in one toast
    removeAll: items => {
      items.forEach(item => archive(item))
      if (items.length) toast.success(`${plural(items.length, 'file')} moved to the archive`)
    },
    createFolder: (parent, name) => createFolder(parent, name),
    // `keys`: the properties it starts with, empty; `stay`: don't open it
    newNote: (folder, { keys, values, stay, titled } = {}) => setNewFile({ folder, kind: 'note', keys, values, stay, titled }),
    // A note widget's note: its new note, made in one step with the widget (noteToAdd); its file
    // ({ entry, edited: this device's text, if edited }, or null when it's gone) and its typing saved
    addNote: (folder, name) => noteToAdd(folder, name),
    noteFile: path => shown[path] ? { entry: shown[path], edited: changes.edits[shown[path].orig] } : null,
    saveNote: (path, content, original) => update(ch => {
      const entry = virtualFiles(repo.remote.files, ch)[path]
      return entry ? setEdit(ch, entry, content, original) : ch
    }),
    virtual, // every file, as a note's preview wants them for its links and images
    discards, // a discard reloads the notes widgets show
    // A done note archived (archive): `edit` applied to its text first, in the same step. { to: its new path, text: its
    // text as it was archived (with the typing flushed first), for an undo }
    archive: (path, edit) => archive(fileItem(path), edit),
    unarchive: (from, to, text) => unarchive(fileItem(from), to, text),
  }

  // The note open on a view that has a board it's a card of: the columns it can move to (widgets/index.js)
  // Where the open note's property values come from: a widget's (the first board or planner it's a card of, in any view), else
  // its folder (Editor); with what every widget it's a card of requires of it: the properties that come back when they're
  // taken out (`required`), can't be edited in the markdown (`locked`) and shows its own way (`badges`), and the order of
  // its properties (`order`: the first widget's that has one)
  const scopes = selectedFile ? widgets.map(w => widgetType(w.type)?.valueScope?.(w.id, selectedFile, widgetServices)).filter(Boolean) : []
  const valueScope = scopes.length ? {
    ...scopes[0],
    required: [...new Set(scopes.flatMap(s => s.required ?? []))],
    locked: [...new Set(scopes.flatMap(s => s.locked ?? []))],
    order: scopes.find(s => s.order)?.order ?? [],
    badges: Object.assign({}, ...scopes.map(s => s.badges)),
  } : undefined
  const fileMoves = selectedFile && views.find(v => v.id === page)?.widgets
    ?.map(w => widgetType(w.type)?.fileMoves?.(w.id, selectedFile, widgetServices)).find(Boolean)

  // Every page's trail after a rename, delete or discard (`next`); the address
  // is replaced, not added to history (only when it shows: not on Settings / Broken links / Documentation)
  function followTrails(next) {
    if (page === mainPage && urlForPage(BASE, page, currentView(page, next[page])) !== url) replaceNext.current = true
    setTrails(next)
  }

  // A copy of the file `item` next to it ("x 2.md"; a note's title gets " (copy)"); a symlink isn't copied (a toast says so)
  function handleDuplicate(item) {
    const entry = virtual[item.path]
    if (!entry) return
    if (entry.mode === SYMLINK_MODE) return toast.error("A symlink can't be duplicated.")
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    update(ch => {
      const from = virtualFiles(repo.remote?.files ?? {}, ch)[item.path]
      const text = item.path.endsWith('.md') ? ch.edits[from.orig] ?? links.remoteText(from.sha) : undefined // a note not on this device: the same bytes
      return duplicate(ch, repo.remote?.files ?? {}, from, freePath(ch, filesOf(ch), item.path), text === undefined ? undefined : copyTitled(text))
    })
  }

  // `ch` with `item` moved into today's folder of the archive (lib/archive.js; a taken name gets a number), and its path there
  // Links to it are rewritten (so an undo puts them back); widgets and pages don't follow it: for them it's gone
  function archived(ch, item) {
    const now = new Date()
    const to = freeTarget(ch, item, `${archiveDay({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })}/${item.name}`)
    return { next: relocated(ch, item, to, false), to }
  }

  // `item` (a file or folder) into the archive, in one step; `edit` first applied to its text (a note: a planner's done
  // card). An open page showing it closes, as for a delete. { to, text: its text as it was archived, for an undo }
  function archive(item, edit) {
    window.dispatchEvent(new Event('folio:flush')) // typing in an open note first
    let to = item.path
    let text
    update(ch => {
      const entry = filesOf(ch)[item.path]
      text = entry && item.path.endsWith('.md') ? ch.edits[entry.orig] ?? links.remoteText(entry.sha) : undefined
      const done = archived(edit ? editNote(ch, repo.remote?.files ?? {}, item.path, edit, links.remoteText) : ch, item)
      to = done.to
      return done.next
    })
    return { to, text }
  }

  // An archive undone: `item` (in the archive) back at `to` (its own place, or a free name next to it if something else
  // took it since), a note with its text `text`
  function unarchive(item, to, text) {
    update(ch => {
      const back = freeTarget(ch, item, to)
      const next = relocated(ch, item, back, false)
      return text === undefined ? next : editNote(next, repo.remote?.files ?? {}, back, () => text, links.remoteText)
    })
  }

  // Remove: a file or folder goes to the archive, with a toast to undo it; one already in the archive is deleted for good
  // A locked file (or a folder with one in it) isn't removed: a message says so
  function handleDelete(item) {
    if (lockedIn(item)) return toast.error(`“${item.name}” ${item.type === 'dir' ? 'has locked files' : 'is locked'}. Unlock ${item.type === 'dir' ? 'them' : 'it'} to remove it.`)
    if (inArchive(item.path)) return update(ch => assets.removed(item.path, item.type === 'dir')(icons.removed(item.path, item.type === 'dir')(locks.removed(item.path, item.type === 'dir')(remove(ch, filesOf(ch), item.path, item.type === 'dir')))))
    const { to } = archive(item)
    toast.success(`“${item.name}” moved to the archive`, {
      action: { label: 'Undo', onClick: () => unarchive({ ...item, path: to, name: to.slice(to.lastIndexOf('/') + 1) }, item.path) },
    })
  }

  // A new folder `name` in `parent` (kept by an empty .gitkeep): an error message, or null
  function createFolder(parent, name) {
    if (!repo.remote) return 'Files are still loading.'
    const error = nameError(name)
    if (error) return error
    const base = parent ? `${parent}/${name}` : name
    const err = createError(changes, virtual, [base, `${base}/.gitkeep`])
    if (err) return err
    update(ch => add(ch, repo.remote.files, `${base}/.gitkeep`, ''))
    return null
  }

  // A new note `name` in `folder`, starting with the properties `keys`, empty, or with `values` ({ key: value }): { path, change }
  // (ch => ch that adds it), or { error }
  // `title`: its first heading when it isn't the file's name (a board's new card)
  function noteToAdd(folder, name, keys = [], title = '', values = {}) {
    if (!repo.remote) return { error: 'Files are still loading.' }
    const path = `${folder ? `${folder}/${name}` : name}.md`
    const error = nameError(name) || createError(changes, virtual, [path])
    if (error) return { error }
    return { path, change: ch => add(ch, repo.remote.files, path, Object.entries(values).reduce((t, [k, v]) => withValue(t, k, v), withKeys(`# ${title || name}\n\n`, keys))) }
  }

  function handleCreate(name, title) {
    if (!repo.remote) return 'Files are still loading.'
    const error = nameError(name)
    if (error) return error
    if (newFile.kind === 'folder') {
      const err = createFolder(newFile.folder, name)
      if (err) return err
    } else {
      // A note can start with properties, empty (a board's new card)
      const made = noteToAdd(newFile.folder, name, newFile.keys, title, newFile.values)
      if (made.error) return made.error
      update(made.change)
      if (!newFile.stay) setSelectedFile(made.path)
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
      let replace = false
      if (view[path]) {
        const choice = await new Promise(resolve => setUploadClash({ name: file.name, folder, resolve }))
        setUploadClash(null)
        if (choice === 'skip') continue
        if (choice === 'replace') replace = true
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const sha = await blobShaOf(bytes)
        await cache.setBlob(sha, toBase64(bytes))
        if (await cache.getBlob(sha) === undefined) throw new Error()
        // Placed in the changes as they are when it's added (others may have been made while it was asked about or
        // stored): the file it replaces, if it's still there, else the first free name
        const apply = c => {
          const now = virtualFiles(remoteFiles, c)
          const target = replace && now[path] ? path : freePath(c, now, path)
          return assets.record(target)(replace && now[path] ? replaceUpload(c, now[path], sha) : upload(c, remoteFiles, target, sha))
        }
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

  // The archive's day folders older than KEEP_DAYS are removed when Folio opens (lib/archive.js), as local changes shown
  // before Sync; each one once a session per repo, so one put back by a discard stays until Folio opens again
  const cleaned = useRef({ repo: null, paths: new Set() })
  useEffect(() => {
    if (!repo.remote) return
    if (cleaned.current.repo !== auth.repo) cleaned.current = { repo: auth.repo, paths: new Set() }
    const done = cleaned.current.paths
    const now = new Date()
    const stale = staleArchiveDays(Object.keys(virtual), { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
      .filter(path => !done.has(path))
    if (!stale.length) return
    stale.forEach(path => done.add(path))
    update(ch => stale.reduce((c, path) => remove(c, filesOf(c), path, true), ch))
    toast.success(`What was archived more than ${KEEP_DAYS} days ago is removed. Sync to remove it from GitHub.`)
  }, [repo.remote, auth.repo]) // when the repo's files load or change by Sync or Pull, not on every edit

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

  // Folio syncs by itself once when it opens (and, if it opened offline, when it's back online), without a toast when it
  // works; what goes wrong shows as it does for Sync (conflicts, the error sheet), and broken links stop it with a message
  // (the check Sync offers first) instead of a sheet opening on its own. Nothing to say offline: the Sync button does.
  const autoSynced = useRef(null)
  useEffect(() => {
    if (!repo.remote || !repo.online || autoSynced.current === auth.repo) return
    autoSynced.current = auth.repo
    if (!links.index.broken.length) return void repo.sync(true)
    toast.error(`Not synced: ${plural(links.index.broken.length, 'broken link')}.`, { action: { label: 'Review', onClick: () => setSyncCheck(true) } })
  }, [repo.remote, repo.online, auth.repo])

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
    setTrails(startTrails(pages.map(p => p.id)))
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
  // Views settings, and Rename / Delete of a view (the dialogs below)
  const viewActions = {
    canEdit: viewsReady,
    onSettings: () => setViewsSettings(true),
    onRename: v => setViewDialog({ kind: 'rename', view: v }),
    onDelete: v => setViewDialog({ kind: 'delete', view: v }),
  }
  const menu = {
    brokenCount: links.index.broken.length,
    onSignOut: () => setConfirmSignOut(true),
  }
  const renderSync = (compact, bar) => (
    <SyncButton
      compact={compact}
      bar={bar}
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
  const iconsInfo = { iconOf: icons.iconOf, onSet: icons.canEdit ? (path, emoji) => update(icons.set(path, emoji)) : undefined }
  const linkInfo = {
    rewriteCount: (item, to) => linkRewrites(item, to, changes.edits).size,
    linkedFrom: item => new Set(Object.entries(links.index.backlinks)
      .filter(([target]) => target === item.path || target.startsWith(item.path + '/'))
      .flatMap(([, refs]) => refs.map(r => r.from))
      .filter(from => !(from === item.path || from.startsWith(item.path + '/')))).size,
  }

  return (
    <LinksContext.Provider value={linkInfo}>
      <IconsContext.Provider value={iconsInfo}>
      <NavContext.Provider value={{
        listDir: dir => listDir(shown, dir, repo.changed),
        views,
        symlinks,
        current: selectedFile ?? (folder || null),
        file: selectedFile,
        dir: folder,
        // On a view's page, what its widgets show (lazily: read when the title's tree opens)
        viewTree: views.some(v => v.id === mainPage) ? () => (views.find(v => v.id === mainPage).widgets ?? []).map(w => {
          const type = widgetType(w.type)
          return { key: w.id, name: type ? type.title?.(w.id, widgetServices) ?? type.label : 'Unknown widget', icon: type?.icon, children: type?.tree?.(w.id, widgetServices) ?? [] }
        }) : null,
        expanded,
        onToggle: toggleFolder,
        itemActions: { onRename: handleRename, onDuplicate: handleDuplicate, onDelete: handleDelete, onMove: handleMove, folders: allFolders },
        onOpenFolder: openFolder,
        onOpenFile: setSelectedFile,
        onBack: page === mainPage ? goUp : null,
        repo: auth.repo,
        repos: auth.repos,
        onSwitchRepo: switchRepo,
        syncing: repo.syncing,
      }}>
      <TooltipProvider>
        <SingleOpenProvider>
      <div className="flex flex-col h-full bg-background">
        <Toaster theme={theme} />
        <PullToRefresh onRefresh={() => window.location.reload()}>
          <div className="flex flex-1 min-h-0">
          <NavRail page={page} pages={pages} hrefOf={id => urlForPage(BASE, id, currentView(id, trailOf(id)))} viewActions={viewActions} onPage={choosePage} onSearch={() => setSearchOpen(true)} renderSync={renderSync} menu={menu} />
          <main ref={mainRef} className="flex flex-col flex-1 min-w-0 min-h-0">
          <TopBar host={mainRef} resetKey={`${page}|${selectedFile}|${folder}`} page={page} pages={pages} viewActions={viewActions} onPage={choosePage} onSearch={() => setSearchOpen(true)} renderSync={renderSync} menu={menu} />
          {page === PAGE.SETTINGS ? (
            <Settings login={auth.user.login} repo={auth.repo} theme={theme} onTheme={setTheme} />
          ) : page === PAGE.DOCS ? (
            <Documentation />
          ) : page === PAGE.ASSETS ? (
            <Assets files={shown} added={assets.added} onOpen={path => setSelectedFile(path, PAGE.FILES)} />
          ) : !view && page === PAGE.GRAPH ? (
            <EmptyPage page={page} />
          ) : !view ? (
            <ViewPage
              page={page}
              widgets={views.find(v => v.id === page)?.widgets}
              error={viewsBroken ? `The views file (${VIEWS_PATH}) can't be read, so views can't be changed here. Fix or remove it on GitHub, then Pull.` : null}
              services={widgetServices}
              onAdd={type => startWidget(page, type)}
              onRemove={id => removeWidgetOf(page, id)}
              onMove={(from, to) => saveViews(moveWidget(views, page, from, to))}
              canEditView={viewActions.canEdit}
              onRename={() => viewActions.onRename(pages.find(p => p.id === page))}
              onRemoveView={() => viewActions.onDelete(pages.find(p => p.id === page))}
            />
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
              onDuplicate={handleDuplicate}
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
              notes={links.notes}
              tagColors={tagColors}
              onEditNotes={(paths, edit, first = ch => ch) => update(guarded(ch => paths.reduce((c, p) => editNote(c, repo.remote?.files ?? {}, p, edit, links.remoteText), first(ch))))}
              edited={changes.edits[entry.orig]}
              onEdit={(content, original) =>
                update(ch => setEdit(ch, virtual[selectedFile], content, original))}
              onNavigate={openFolder}
              onOpenFile={setSelectedFile}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onMove={handleMove}
              folders={allFolders}
              columns={fileMoves}
              valueScope={valueScope}
              backlinks={links.index.backlinks[selectedFile]}
              locked={locks.isLocked(selectedFile)}
              onToggleLock={locks.canEdit ? () => update(locks.toggle(selectedFile)) : undefined}
            />
          ) : (
            <FileBrowser
              path={folder}
              onNavigate={openFolder}
              listDir={dir => listDir(shown, dir, repo.changed)}
              loading={!repo.remote && !repo.error}
              error={repo.error}
              notice={repo.remote?.truncated ? 'This repo is too large to list in full; some files are missing.' : ''}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onMove={handleMove}
              folders={allFolders}
              onSelect={setSelectedFile}
              onNewFile={(f, kind) => setNewFile({ folder: f, kind })}
              onUpload={handleUpload}
              onDropMove={handleDropMove}
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
          <ConfirmModal
            title={`Discard ${plural(repo.changeCount, 'change')}?`}
            description="They're removed from this device and can't be recovered."
            confirm="Discard"
            onConfirm={discardChanges}
            onClose={() => setConfirmDiscard(false)}
          />
        )}

        {confirmSignOut && (
          <ConfirmModal
            title="Sign out?"
            description={repo.changeCount
              ? `You have ${plural(repo.changeCount, 'unsynced change')}. Signing out removes them from this device.`
              : 'The offline copies of your notes are removed from this device, and you\'ll need your token to sign in again.'}
            confirm="Sign out"
            onConfirm={signOut}
            onClose={() => setConfirmSignOut(false)}
          />
        )}

        {viewsSettings && (
          <EditListModal
            title="Views settings"
            description="Drag them into order. Removing a view removes its widgets; the notes stay."
            items={pages.filter(p => p.view).map(p => ({ id: p.id, icon: <span onPointerDown={e => e.stopPropagation()}><EmojiPicker emoji={p.emoji} label={`Emoji of ${p.title}`} fallback={<PageIcon page={p} />} onChange={emoji => saveViews(setViewIcon(views, p.id, emoji))} className="size-control-md" /></span>, title: <PageTitle page={p} />, label: p.title, view: p }))}
            onMove={(from, to) => saveViews(moveView(views, from, to))}
            onRemove={item => setViewDialog({ kind: 'delete', view: item.view })}
            addLabel="New view"
            onAdd={name => { saveViews(addView(views, name).views); return null }}
            empty="No views"
            onClose={() => setViewsSettings(false)}
          />
        )}

        {viewDialog?.kind === 'rename' && (
          <RenameModal
            kind="view"
            item={{ name: viewDialog.view.untitled ? '' : viewDialog.view.title, type: 'dir' }}
            onRename={name => {
              if (!name.trim()) return 'Enter a name.'
              saveViews(renameView(views, viewDialog.view.id, name))
              setViewDialog(null)
              return null
            }}
            onClose={() => setViewDialog(null)}
          />
        )}

        {viewDialog?.kind === 'delete' && (
          <DeleteModal
            kind="view"
            item={{ name: viewDialog.view.title, type: 'dir' }}
            onDelete={() => {
              // Its widgets' settings go with it
              const gone = views.find(v => v.id === viewDialog.view.id)?.widgets ?? []
              if (viewsReady) update(ch => viewsChange(ch, removeView(views, viewDialog.view.id), gone))
              setViewDialog(null)
            }}
            onClose={() => setViewDialog(null)}
          />
        )}

        {adding && (() => {
          const { Setup } = widgetType(adding.type)
          return (
            <Setup
              services={widgetServices}
              onCreate={change => { addWidgetTo(adding.viewId, adding.type, change); setAdding(null) }}
              onClose={() => setAdding(null)}
            />
          )
        })()}

        {newFile && (
          <NewFileModal
            folder={newFile.folder}
            kind={newFile.kind}
            titled={newFile.titled}
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
            onSelect={path => setSelectedFile(path, PAGE.FILES)}
            folders={allFolders}
            onSelectFolder={path => openFolder(path, PAGE.FILES)}
            placeholder="Search files, folders and notes…"
            texts={links.notes}
            virtual={shown}
            changes={changes}
            recent={storage.getRecentFiles()}
          />
        )}
      </div>
        </SingleOpenProvider>
      </TooltipProvider>
      </NavContext.Provider>
      </IconsContext.Provider>
    </LinksContext.Provider>
  )
}
