import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import AppLogo from './AppLogo.jsx'
import AuthLayout from './AuthLayout.jsx'

export default function Auth({ onAuth }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError('')
    try {
      await onAuth(token.trim())
    } catch {
      setError('Token invalid, or GitHub can\'t be reached.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      logo={<AppLogo className="size-20" />}
      title="Folio"
      intro="Paste a GitHub token to access your notes. Use a fine-grained token with Contents: Read and write, limited to your notes repo."
    >
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
          <Input
            type="password"
            placeholder="github_pat_xxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="font-mono tracking-wide bg-card border-border"
          />
          {error && <p className="text-destructive-ink text-xs text-center">{error}</p>}
          <Button type="submit" disabled={loading || !token.trim()} className="w-full">
            {loading ? 'Connecting…' : 'Connect'}
          </Button>
        </form>
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-control items-center text-primary-ink text-sm hover:opacity-80 transition-opacity"
        >
          Create a token on GitHub ↗
        </a>
    </AuthLayout>
  )
}
