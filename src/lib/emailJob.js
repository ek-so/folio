// The email reminders job in the notes repo (src/job/reminders-job.js): what Folio writes there when it's set up
// (Profile → Settings → Email reminders): the workflow that runs it every 15 minutes and the job itself (one file,
// built beside the app as `folio-reminders.mjs`). The workflow commits what it sent (SENT_PATH), pulling first and
// trying again if the push is refused (a Sync from Folio meanwhile), so the record is never lost.
// Writing a workflow needs a token allowed to (fine-grained: Workflows, Read and write).
export const WORKFLOW_PATH = '.github/workflows/folio-reminders.yml'
export const SCRIPT_PATH = '.github/folio/reminders.mjs'
export const SECRET = 'RESEND_API_KEY'
export const SENT_PATH = '.github/folio/reminders-sent.json'

export const WORKFLOW = `# Folio's email reminders: every 15 minutes, the reminders set to email that came due are sent to the address in
# .github/folio/profile.json through Resend (the ${SECRET} secret). Written by Folio (Profile → Settings → Email reminders).
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
        if: always()
        run: |
          git config user.name 'Folio reminders'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git add --all ${SENT_PATH}
          git diff --cached --quiet && exit 0
          git commit -m 'Folio: reminders sent'
          for try in 1 2 3; do
            git pull --rebase --autostash && git push && exit 0
            sleep 5
          done
          exit 1
`

// Where on GitHub to add the secret, and to see the job's runs
export const secretUrl = repo => `https://github.com/${repo}/settings/secrets/actions/new`
export const runsUrl = repo => `https://github.com/${repo}/actions/workflows/folio-reminders.yml`
