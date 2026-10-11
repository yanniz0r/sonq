import { useEffect, useState } from 'react'

// The current server time, re-rendering every `intervalMs` for countdowns.
export function useServerNow(clockOffset: number, intervalMs = 200) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now + clockOffset
}
