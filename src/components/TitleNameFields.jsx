import { Label } from './ui/label.jsx'
import { Input } from './ui/input.jsx'

// A note's two fields, in the new note and rename dialogs alike: its Title (shown on cards and lists) and its File name (kebab-case
// as suggested). `fields`: from useTitleName. `ext`: the file's extension, shown after the name. `onEdit`: called on any typing (clears an error)
export default function TitleNameFields({ fields, ext, onEdit, autoFocus }) {
  const { title, typedName, suggestion, setTitle, setName } = fields
  return <>
    <Label className="flex-col items-start gap-1.5 leading-5">
      Title
      <Input type="text" placeholder="Title" value={title} autoFocus={autoFocus} onChange={e => { setTitle(e.target.value); onEdit?.() }} autoCorrect="off" autoCapitalize="sentences" className="bg-background border-border font-normal" />
    </Label>
    <Label className="flex-col items-start gap-1.5 leading-5">
      File name
      <div className="flex w-full items-center gap-space-sm">
        <Input type="text" placeholder={suggestion || 'File name'} value={typedName} onChange={e => { setName(e.target.value); onEdit?.() }} autoCorrect="off" autoCapitalize="none" className="bg-background border-border font-normal" />
        {ext && <span className="shrink-0 font-normal text-muted-foreground">{ext}</span>}
      </div>
    </Label>
  </>
}
