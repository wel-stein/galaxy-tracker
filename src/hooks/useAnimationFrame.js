import { useEffect, useRef } from 'react'

// Runs `callback` on every animation frame while `active` is true.
// The callback is kept in a ref so the loop never restarts when it changes.
export function useAnimationFrame(callback, active = true) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let id
    const tick = () => {
      cbRef.current()
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [active])
}
