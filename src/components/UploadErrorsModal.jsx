import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Files that couldn't be added from the device, each with the reason.
export default function UploadErrorsModal({ errors, onClose }) {
  return (
    <BottomSheet
      title={`Couldn't add ${errors.length} file${errors.length === 1 ? '' : 's'}`}
      onClose={onClose}
    >
      <ul className="flex flex-col gap-2 text-sm">
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
