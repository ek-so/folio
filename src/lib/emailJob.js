// The email reminders job in the notes repo (src/job/reminders-job.js): what Folio writes there when it's set up
// (Profile → Settings → Email reminders): the workflow that runs it every 15 minutes and the job itself (one file,
// built beside the app as `folio-reminders.mjs`). The workflow commits what it sent (.folio/reminders-sent.json).
// Writing a workflow needs a token allowed to (fine-grained: Workflows, Read and write).
export const WORKFLOW_PATH = '.github/workflows/folio-reminders.yml'
export const SCRIPT_PATH = '.github/folio/reminders.mjs'
export const SECRET = 'RESEND_API_KEY'

export const WORKFLOW = `# Folio's email reminders: every 15 minutes, the reminders set to email that came due are sent to the address in
# .folio/profile.json through Resend (the ${SECRET} secret). Written by Folio (Profile → Settings → Email reminders).
name: Folio reminders

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: folio-reminders

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node ${SCRIPT_PATH}
        env:
          ${SECRET}: \${{ secrets.${SECRET} }}
      - name: Keep what was sent
        run: |
          git config user.name 'Folio reminders'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git add .folio/reminders-sent.json
          git diff --cached --quiet || (git commit -m 'Folio: reminders sent' && git push)
`

// Where on GitHub to add the secret, and to see the job's runs
export const secretUrl = repo => `https://github.com/${repo}/settings/secrets/actions/new`
export const runsUrl = repo => `https://github.com/${repo}/actions/workflows/folio-reminders.yml`
