// The sign-in screens' frame (token, then repository): a centered column on the page background, the `steps`
// on top (SignInSteps), a `logo`
// (an icon), the app's or the step's `title` (text, or `BrandName` for the app's name) and a muted `intro`, then `children` (its form)
export default function AuthLayout({ steps, logo, title, intro, children }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-space-lg">
      <div className="flex w-full max-w-sm flex-col items-center gap-space">
        {steps}
        {logo}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-center text-sm text-muted-foreground">{intro}</p>
        {children}
      </div>
    </div>
  )
}
