// Top of the content box: `crumbs` (PathBreadcrumbs, each with its own icon:
// where the item is; the last crumb is the item), then `badge` right after
// them; `children`: the item's actions on the right (⋯, then +, ✏️ or ✓). A
// border sets it apart from the content below.
export default function TitleBar({ crumbs, badge, children }) {
  return (
    <div className="shrink-0 border-b border-border p-2">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">{crumbs}</div>
          {badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
