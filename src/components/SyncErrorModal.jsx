import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Why a sync or pull failed: plain explanation, what to do, and GitHub's
// raw answer underneath.
export default function SyncErrorModal({ error, onRetry, onClose }) {
  return (
    <BottomSheet title={error.title} description={error.explanation} onClose={onClose}>
      <p className="text-sm">{error.hint}</p>
      <dl className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {error.details.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-medium">{label}</dt>
            <dd className="break-words font-mono">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
        <Button className="flex-1" onClick={() => { onClose(); onRetry() }}>Try again</Button>
      </div>
    </BottomSheet>
  )
}
