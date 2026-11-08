// The sign-in screens' frame (token, then repository): a centered column on the page background, a `logo`
// (an icon), the app's or the step's `title` and a muted `intro`, then `children` (its form)
export default function AuthLayout({ logo, title, intro, children }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-space-lg">
      <div className="flex w-full max-w-sm flex-col items-center gap-space">
        {logo}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-center text-sm text-muted-foreground">{intro}</p>
        {children}
      </div>
    </div>
  )
}
