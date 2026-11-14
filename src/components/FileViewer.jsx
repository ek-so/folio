import FilePage from './FilePage.jsx'
import Loading from './Loading.jsx'
import PdfView from './PdfView.jsx'
import { useBlob } from '../hooks/useBlob.js'
import { fileKind, imageMime } from '../lib/files.js'
import { EmptyMessage } from './EmptyState.jsx'

const MESSAGES = {
  offline: "Couldn't open this file. It isn't saved on this device yet — connect to the internet and pull to refresh.",
  failed: "Couldn't load this file from GitHub.",
}

// An image or PDF, read-only. Rename it from ⋯.
export default function FileViewer({ path, entry, ...page }) {
  const { base64, error } = useBlob(entry.sha)
  const kind = fileKind(path)
  const name = path.split('/').pop()

  return (
    <FilePage path={path} name={name} {...page}>
      {error ? (
        <EmptyMessage size="lg" className="px-space">{MESSAGES[error]}</EmptyMessage>
      ) : !base64 ? (
        <Loading kind="block" />
      ) : kind === 'pdf' ? (
        <PdfView base64={base64} />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-space">
          <img src={`data:${imageMime(path)};base64,${base64}`} alt="" className="max-w-full h-auto mx-auto rounded-md" />
        </div>
      )}
    </FilePage>
  )
}
