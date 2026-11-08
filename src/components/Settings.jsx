import { useState } from 'react'
import { Sun, Moon, Monitor } from '@phosphor-icons/react'
import TitleBar from './TitleBar.jsx'
import { PAGE } from '../lib/pages.js'
import Surface from './Surface.jsx'
import { Segmented } from './ui/segmented.jsx'
import PageLayout from './PageLayout.jsx'
import BottomSheet from './BottomSheet.jsx'
import { Button } from './ui/button.jsx'
import { plural } from '../lib/plural.js'

const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 px-space py-3 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base break-all">{children}</span>
    </div>
  )
}

// Settings page: theme, the emoji in names, plus the account and repository in use.
// `emojiNames` ({ count, onMove }; null while icons can't be saved): how many files and folders start their name with an
// emoji; "Move to icons" (after a confirmation sheet) takes it out of their names and makes it their icon (lib/icons.js).
export default function Settings({ login, repo, theme, onTheme, emojiNames }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.SETTINGS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-space-sm px-space py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Theme</span>
            <Segmented stretch value={theme} onChange={onTheme} options={THEMES} label="Theme" />
          </div>
          {emojiNames && (
            <div className="flex flex-col gap-space-sm px-space py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Emoji in names</span>
              <span className="text-sm">
                {emojiNames.count
                  ? `${plural(emojiNames.count, 'file or folder name')} start${emojiNames.count === 1 ? 's' : ''} with an emoji. Move it out of the name and make it the icon.`
                  : 'No file or folder starts its name with an emoji.'}
              </span>
              <div><Button variant="secondary" disabled={!emojiNames.count} onClick={() => setConfirming(true)}>Move to icons</Button></div>
            </div>
          )}
          <Row label="Signed in as">@{login}</Row>
          <Row label="Repository">{repo}</Row>
          <p className="px-space py-3 text-sm text-muted-foreground">
            To switch account or repository, sign out and connect again. Use a fine-grained GitHub token
            limited to your notes repo, with Contents: Read and write.
          </p>
        </div>
      </Surface>
      {confirming && (
        <BottomSheet
          title="Move emojis to icons?"
          description={`${plural(emojiNames.count, 'name')} lose${emojiNames.count === 1 ? 's' : ''} the emoji, which becomes the icon kept in .folio. Files are renamed and every link to them is updated; Sync to apply it on GitHub.`}
          onClose={() => setConfirming(false)}
        >
          <div className="flex flex-wrap justify-end gap-space-sm">
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button onClick={() => { setConfirming(false); emojiNames.onMove() }}>Move to icons</Button>
          </div>
        </BottomSheet>
      )}
    </PageLayout>
  )
}
