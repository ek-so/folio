import { Sun, Moon, Monitor } from '@phosphor-icons/react'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import Surface from './Surface.jsx'
import { Segmented } from './ui/segmented.jsx'
import PageLayout from './PageLayout.jsx'

const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 px-space py-3 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base break-all">{children}</span>
    </div>
  )
}

// Settings page: theme, plus the account and repository in use.
export default function Settings({ login, repo, theme, onTheme }) {
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.SETTINGS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-space-sm px-space py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Theme</span>
            <Segmented stretch value={theme} onChange={onTheme} options={THEMES} label="Theme" />
          </div>
          <Row label="Signed in as">@{login}</Row>
          <Row label="Repository">{repo}</Row>
          <p className="px-space py-3 text-sm text-muted-foreground">
            To switch account or repository, sign out and connect again. Use a fine-grained GitHub token
            limited to your notes repo, with Contents: Read and write.
          </p>
        </div>
      </Surface>
    </PageLayout>
  )
}
