import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Asks what to do with a file added from the device whose name is taken.
// onChoose('replace' | 'keep' | 'skip')
export default function UploadClashModal({ name, folder, onChoose }) {
  return (
    <BottomSheet
      title={`"${name}" already exists`}
      description={`${folder ? `In ${folder}. ` : ''}Replace it, or keep both and add a number to the new one's name.`}
      onClose={() => onChoose('skip')}
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onChoose('skip')}>Skip</Button>
        <Button variant="secondary" onClick={() => onChoose('keep')}>Keep both</Button>
        <Button variant="destructive" onClick={() => onChoose('replace')}>Replace</Button>
      </div>
    </BottomSheet>
  )
}
