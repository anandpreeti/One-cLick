import { useEffect, useRef } from 'react'

// Runs `callback(deltaSeconds)` every animation frame while `active` is true.
// Delta is clamped so a backgrounded tab doesn't produce a huge jump on resume.
export function useGameLoop(callback, active) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let raf
    let last = null

    const tick = (now) => {
      if (last == null) last = now
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      cbRef.current(delta)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
