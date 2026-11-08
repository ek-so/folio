import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

export default function ConflictModal({ paths, busy, onPushLocal, onUseRemote, onClose }) {
  return (
    <BottomSheet
      title="Changed on GitHub"
      description="These files changed on GitHub while you had local changes to them."
      onClose={onClose}
    >
      <ul className="flex flex-col gap-space-xs max-h-48 overflow-y-auto">
        {paths.map(p => (
          <li key={p} className="text-sm font-mono truncate">{p}</li>
        ))}
      </ul>
      <div className="flex flex-col gap-space-sm">
        <Button onClick={onPushLocal} disabled={busy}>Push local (overwrite GitHub)</Button>
        <Button variant="secondary" onClick={onUseRemote} disabled={busy}>Use remote (discard my changes)</Button>
      </div>
    </BottomSheet>
  )
}
