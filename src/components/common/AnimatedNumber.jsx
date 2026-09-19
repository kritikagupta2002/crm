import { useEffect, useRef, useState } from 'react'

/* Skip the count-up when motion is reduced, or when the tab is hidden (browsers pause animation frames there). */
const instant = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.hidden

/* Counts up to `value` (ease-out, ~0.7s) whenever it changes; `format` turns the number into text. */
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
