import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'
import { plural } from '../lib/plural.js'

// Files that couldn't be added from the device, each with the reason.
export default function UploadErrorsModal({ errors, onClose }) {
  return (
    <BottomSheet
      title={`Couldn't add ${plural(errors.length, 'file')}`}
      onClose={onClose}
    >
      <ul className="flex flex-col gap-space-sm text-sm">
        {errors.map(([name, reason]) => (
          <li key={name}><span className="font-medium">{name}</span> <span className="text-muted-foreground">— {reason}</span></li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button onClick={onClose}>OK</Button>
      </div>
    </BottomSheet>
  )
}
