import { useEffect, useRef, useState } from 'react'

const instant = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.hidden

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('en-IN'), duration = 700 }) {
  const [shown, setShown] = useState(value)
  const from = useRef(0)

  useEffect(() => {
    if (instant()) return
    const start = performance.now()
    const begin = from.current
    let frame
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(begin + (value - begin) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{format(instant() ? value : shown)}</>
}
