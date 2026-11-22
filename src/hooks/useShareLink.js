import { useNav } from './useNav.js'
import { shareUrl } from '../lib/url.js'

// Copy link's address of a file or folder (`path`, `isDir`): it in File manager, in the open repo (lib/url.js
// `shareUrl`). Whoever opens it signs in with their own GitHub token; GitHub's access to the repo decides if it opens
export function useShareLink() {
  const repo = useNav()?.repo
  return (path, isDir = false) => shareUrl(window.location.origin, import.meta.env.BASE_URL, repo, path, isDir)
}
