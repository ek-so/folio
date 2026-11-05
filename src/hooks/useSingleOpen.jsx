import { createContext, useContext, useId, useState, useCallback } from 'react'

// Only one popover of a group is open at a time: `SingleOpenProvider` (in App) holds which
// one, `useSingleOpen()` gives a popover its `[open, setOpen]`; opening one closes the
// open one, wherever it is (another badge, another card). Without a provider it's a plain state.
const Ctx = createContext(null)

export function SingleOpenProvider({ children }) {
  const [openId, setOpenId] = useState(null)
  return <Ctx.Provider value={{ openId, setOpenId }}>{children}</Ctx.Provider>
}

export function useSingleOpen() {
  const shared = useContext(Ctx)
  const id = useId()
  const [local, setLocal] = useState(false)
  const setShared = shared?.setOpenId
  const setOpen = useCallback(next => setShared(current => next ? id : current === id ? null : current), [setShared, id])
  return shared ? [shared.openId === id, setOpen] : [local, setLocal]
}
