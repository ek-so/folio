import { createContext, useContext } from 'react'
import { PROFILE_PATH, parseProfile, serializeProfile, cleanEmail } from '../lib/profile.js'
import { useConfigFile } from './useConfigFile.js'

// The profile (lib/profile.js), from the config (hooks/useConfig.js): `email` ('' for none), `canEdit` (read and
// readable, so it's never overwritten), and `setEmail(text)`, a change (ch => ch) for `update`
export function useProfile(config) {
  const { value, change } = useConfigFile(config, PROFILE_PATH, parseProfile, serializeProfile)
  return {
    email: value?.email ?? '',
    canEdit: !!value,
    setEmail: text => change(p => ({ ...p, email: cleanEmail(text) })),
  }
}

// What App shares with the date picker: `email`, and `onEditEmail()` (opens the profile at its email; null while it
// can't be saved)
export const ProfileContext = createContext({ email: '', onEditEmail: null })
export const useProfileContext = () => useContext(ProfileContext)
