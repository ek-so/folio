import { useState, useEffect } from 'react'
import { todayKey } from './planner.js'

// Today's day key, new after midnight and when the app comes back to the screen (a planner left open
// overnight, a phone woken up) without anything else re-rendering it
export function useToday() {
  const [today, setToday] = useState(() => todayKey())
  useEffect(() => {
    let timer
    const refresh = () => setToday(todayKey())
    const schedule = () => {
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
      timer = setTimeout(() => { refresh(); schedule() }, midnight - now)
    }
    const onShow = () => { if (document.visibilityState === 'visible') refresh() }
    schedule()
    document.addEventListener('visibilitychange', onShow)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onShow) }
  }, [])
  return today
}
