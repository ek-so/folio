// Plain-language explanation of a failed sync or pull, for the error sheet.

const STEPS = {
  read: 'Getting the latest version from GitHub',
  upload: 'Uploading your changes',
  save: 'Saving your changes to the branch',
}

function explain(status, message) {
  if (status === 401) return [
    'GitHub didn\'t accept your token',
    'The token has expired or was revoked.',
    'Create a new token on GitHub, then sign out and connect again. Your unsynced changes stay on this device until you sign out.',
  ]
  if (/workflow/i.test(message)) return [
    'Your token can\'t add the email job',
    'GitHub only lets a token change a repo\'s workflows (the email reminders job) when it\'s allowed to.',
    'Give the token Workflows: Read and write on GitHub, then try again. Or take the email job out of your changes, so the rest syncs.',
  ]
  if (status === 403 && /rate limit/i.test(message)) return [
    'Too many requests to GitHub',
    'GitHub limits how often an app can call it.',
    'Wait a few minutes, then try again.',
  ]
  if (status === 403) return [
    'Your token isn\'t allowed to do this',
    'The token can read the repo but not write to it, or can\'t see it at all.',
    'Give the token Contents: Read and write for this repo on GitHub.',
  ]
  if (status === 404) return [
    'GitHub can\'t find the repo',
    'The repo was renamed, deleted, or the token has no access to it.',
    'Check the repo on GitHub and the token\'s repository access.',
  ]
  if (status === 409 || status === 422) return [
    'GitHub changed while syncing',
    'Someone (or another device) pushed to the repo at the same moment.',
    'Try again — Folio will get the new version first.',
  ]
  if (status >= 500) return [
    'GitHub is having trouble',
    'The problem is on GitHub\'s side.',
    'Try again in a moment.',
  ]
  return [
    'Sync failed',
    'Something unexpected went wrong.',
    'Try again. If it keeps failing, the details below say what GitHub answered.',
  ]
}

// { title, explanation, hint, details: [label, value][], workflow: refused for a workflow (the email job) }
export function describeSyncError(error) {
  const status = error?.status
  const message = error?.response?.data?.message || error?.message || 'No message'
  const [title, explanation, hint] = explain(status, message)
  const details = [
    error?.step && ['Step', STEPS[error.step] || error.step],
    status && ['Status', String(status)],
    ['GitHub says', message],
  ].filter(Boolean)
  return { title, explanation, hint, details, workflow: /workflow/i.test(message) }
}
