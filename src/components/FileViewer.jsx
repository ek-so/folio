import FilePage from './FilePage.jsx'
import Loading from './Loading.jsx'
import PdfView from './PdfView.jsx'
import { useBlob } from '../hooks/useBlob.js'
import { useState } from 'react'
import FileIcon, { iconTint } from './FileIcon.jsx'
import { TileIcon } from './ui/card-tile.jsx'
import { useIconsContext } from '../hooks/useIcons.js'
import { fileKind, imageMime, audioMime } from '../lib/files.js'
import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { EmptyMessage } from './EmptyState.jsx'

// The frame's document can render inline styles and embedded images without fetching resources.
const HTML_PREVIEW_HEAD = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'">`

const MESSAGES = {
  offline: "Couldn't open this file. It isn't saved on this device yet — connect to the internet and pull to refresh.",
  failed: "Couldn't load this file from GitHub.",
}

// An image, PDF, audio or HTML file, read-only. Rename it from ⋯. Audio plays in the browser's own player, under its icon
// in a tinted square as on its card (TileIcon) and the file's name; a format this browser can't play says so.
export default function FileViewer({ path, entry, ...page }) {
  const { base64, error } = useBlob(entry.sha)
  const kind = fileKind(path)
  const name = path.split('/').pop()

  return (
    <FilePage path={path} name={name} {...page}>
      {error ? (
        <EmptyMessage size="lg" className="px-space">{MESSAGES[error]}</EmptyMessage>
      ) : base64 === null || (!base64 && kind !== 'html') ? (
        <Loading kind="block" />
      ) : kind === 'pdf' ? (
        <PdfView base64={base64} />
      ) : kind === 'html' ? (
        <iframe
          className="w-full flex-1 min-h-0"
          title={name}
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={HTML_PREVIEW_HEAD + new TextDecoder().decode(Uint8Array.from(atob(base64), byte => byte.charCodeAt(0)))}
        />
      ) : kind === 'audio' ? (
        <AudioView base64={base64} path={path} name={name} />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-space">
          <img src={`data:${imageMime(path)};base64,${base64}`} alt="" className="max-w-full h-auto mx-auto rounded-md" />
        </div>
      )}
    </FilePage>
  )
}

function AudioView({ base64, path, name }) {
  const url = useObjectUrl(base64, audioMime(path))
  const [unplayable, setUnplayable] = useState(false)
  const { iconOf } = useIconsContext()
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-space p-space">
      <TileIcon tint={iconTint(path, false, iconOf(path))}><FileIcon path={path} large /></TileIcon>
      <p className="max-w-full break-words text-center text-sm text-muted-foreground">{name}</p>
      {unplayable
        ? <EmptyMessage>This browser can't play this file.</EmptyMessage>
        : url && <audio controls src={url} onError={() => setUnplayable(true)} className="w-full max-w-md" />}
    </div>
  )
}
