import { defineConfig } from 'vite'

// The email reminders job (src/job/reminders-job.js) as one Node file beside the app, `dist/folio-reminders.mjs`, with
// Folio's own code in it: Folio fetches it from its own address and writes it into the notes repo when email reminders
// are set up. Built after the app (`npm run build`), into the same folder, which it doesn't empty.
export default defineConfig({
  build: {
    ssr: 'src/job/reminders-job.js',
    outDir: 'dist',
    emptyOutDir: false,
    target: 'node20',
    rollupOptions: { output: { entryFileNames: 'folio-reminders.mjs', format: 'es' } },
  },
  ssr: { noExternal: true, target: 'node' },
})
