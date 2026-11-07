import { Button } from './ui/button.jsx'

// A widget's empty or broken state, in its place: a short muted `message` and, with `action` ({ label, icon, onClick,
// disabled }), a button to put it right (Select folder when a planner's or board's folder is gone, Select note when a
// notes widget's note is). Its own component as no other one is a message with a button in a widget.
export default function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center gap-space-sm py-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && <Button variant="secondary" disabled={action.disabled} onClick={action.onClick}>{action.icon}{action.label}</Button>}
    </div>
  )
}
