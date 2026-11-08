import { Images } from '@phosphor-icons/react'
import Surface from './Surface.jsx'
import TitleBar from './TitleBar.jsx'
import PageLayout from './PageLayout.jsx'
import FileIcon from './FileIcon.jsx'
import { ListRow } from './ui/list-row.jsx'
import { PAGE } from '../lib/pages.js'
import { assetList } from '../lib/assets.js'
import { plural } from '../lib/plural.js'

// Page listing every file in the repo that isn't a note (images, PDFs, uploads: lib/assets.js), newest added first, each
// as a row (ListRow): its name and under it its path; a row opens the file.
export default function Assets({ files, added, onOpen }) {
  const paths = assetList(Object.keys(files), added)
  return (
    <PageLayout>
      <Surface title={<TitleBar page={PAGE.ASSETS} />}>
        <div className="flex-1 min-h-0 overflow-y-auto" data-no-pull>
          {paths.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm py-12 text-muted-foreground">
              <Images className="size-8" />
              <p className="text-sm">No files yet. Images, PDFs and other uploads show here.</p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-space-sm p-space">
              <p className="px-3 text-sm text-muted-foreground">{plural(paths.length, 'file')}</p>
              <ul className="flex flex-col gap-0.5">
                {paths.map(path => (
                  <li key={path}>
                    <ListRow icon={<FileIcon path={path} />} title={path.split('/').pop()} description={path} onClick={() => onOpen(path)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Surface>
    </PageLayout>
  )
}
