import FilePage from './FilePage.jsx'
import Spinner from './Spinner.jsx'
import PdfView from './PdfView.jsx'
import { useBlob } from '../hooks/useBlob.js'
import { fileKind, imageMime } from '../lib/files.js'
import SymlinkNotice from './SymlinkNotice.jsx'

const MESSAGES = {
  offline: "Couldn't open this file. It isn't saved on this device yet — connect to the internet and pull to refresh.",
  failed: "Couldn't load this file from GitHub.",
}

// An image or PDF, read-only. Rename / Move / Delete stay in ⋯. With
// `source` it's a symlink: `entry` is the source's, linked to above.
export default function FileViewer({ path, source, entry, syncButton, onOpenFile, ...page }) {
  const { base64, error } = useBlob(entry.sha)
  const contentPath = source ?? path
  const kind = fileKind(contentPath)

  return (
    <FilePage path={path} name={path.split('/').pop()} syncButton={syncButton} {...page}>
      {source && <SymlinkNotice source={source} onOpen={onOpenFile} />}
      {error ? (
        <p className="text-muted-foreground text-sm text-center py-12 px-6">{MESSAGES[error]}</p>
      ) : !base64 ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : kind === 'pdf' ? (
        <PdfView base64={base64} />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <img src={`data:${imageMime(contentPath)};base64,${base64}`} alt="" className="max-w-full h-auto mx-auto rounded-md" />
        </div>
      )}
    </FilePage>
  )
}
