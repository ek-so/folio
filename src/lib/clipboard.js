import { toast } from 'sonner'

// `text` copied to the clipboard; a toast says `done`, or that it couldn't be copied
export const copyText = (text, done) =>
  navigator.clipboard.writeText(text).then(() => toast.success(done), () => toast.error("Couldn't copy to the clipboard"))
