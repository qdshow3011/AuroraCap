import { useEffect, useState } from 'react'

export function useDemoRestriction(enabled: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(15)
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    if (!enabled) return
    setSecondsLeft(15)
    setBlocked(false)
    const t = setInterval(() => {
      setSecondsLeft(s => {
        const ns = s - 1
        if (ns <= 0) {
          clearInterval(t)
          setBlocked(true)
          return 0
        }
        return ns
      })
    }, 1000)
    return () => clearInterval(t)
  }, [enabled])
  return { blocked, secondsLeft }
}
