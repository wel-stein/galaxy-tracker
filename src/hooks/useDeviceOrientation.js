import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../lib/astronomy'

// Wraps the DeviceOrientation API. Handles the iOS 13+ permission prompt,
// derives a compass heading and a pitch (from beta), and surfaces
// diagnostic counters/state.
//
// Heading must be referenced to TRUE NORTH or the compass points the wrong
// way. Android fires two events: `deviceorientationabsolute` (north-locked)
// and `deviceorientation` (often a RELATIVE alpha that drifts from wherever
// the phone was when the page loaded). We must prefer the absolute source
// and ignore the relative one once an absolute reading is available — the
// previous code let whichever fired last win, so relative alpha clobbered
// the good heading.
export function useDeviceOrientation() {
  const [heading, setHeading] = useState(null)
  const [pitch, setPitch] = useState(null)
  const [hasOrient, setHasOrient] = useState(false)
  const [evt, setEvt] = useState(0)
  const [src, setSrc] = useState('—')
  const [perm, setPerm] = useState({ text: '—', cls: '' })
  const [error, setError] = useState(null)

  // Latest values kept in refs so the event handler stays stable.
  const headingRef = useRef(null)
  const pitchRef = useRef(null)
  const attachedRef = useRef(false)
  const sawEventRef = useRef(false)
  const haveAbsoluteRef = useRef(false)

  const onOrient = useCallback((e, fromAbsoluteEvent) => {
    sawEventRef.current = true
    setHasOrient(true)
    setEvt((n) => n + 1)

    // Pitch comes from beta and is the same for either event.
    if (typeof e.beta === 'number') {
      const p = clamp(90 - e.beta, -90, 90)
      pitchRef.current = p
      setPitch(p)
    }

    // Classify the heading source by trustworthiness.
    let h = null
    let absolute = false
    let label = null
    if (typeof e.webkitCompassHeading === 'number') {
      // iOS: already degrees clockwise from true north.
      h = e.webkitCompassHeading
      absolute = true
      label = 'webkitCompassHeading (iOS)'
    } else if (typeof e.alpha === 'number') {
      h = (360 - e.alpha) % 360
      // The `deviceorientationabsolute` event is earth-referenced by
      // definition; `e.absolute === true` confirms it on the plain event.
      absolute = fromAbsoluteEvent || e.absolute === true
      label = (absolute ? 'absolute' : 'relative') + ' alpha'
    }
    if (h == null || isNaN(h)) return

    if (absolute) haveAbsoluteRef.current = true
    // Use this reading only if it's absolute, or if we've never had an
    // absolute one — so relative alpha can't overwrite a true-north heading.
    if (absolute || !haveAbsoluteRef.current) {
      headingRef.current = h
      setHeading(h)
      setSrc(label)
    }
  }, [])

  // Stable per-event-type wrappers so we know which feed a reading came from
  // (and so cleanup can remove the exact listeners).
  const handleAbsolute = useCallback((e) => onOrient(e, true), [onOrient])
  const handleRelative = useCallback((e) => onOrient(e, false), [onOrient])

  const attach = useCallback(() => {
    if (attachedRef.current) return
    attachedRef.current = true
    window.addEventListener('deviceorientationabsolute', handleAbsolute, true)
    window.addEventListener('deviceorientation', handleRelative, true)
    // If no event arrives within 2s, the sensor is unavailable.
    setTimeout(() => {
      if (!sawEventRef.current) {
        setError('没有收到方向事件 — 多半是非 HTTPS、桌面设备,或权限被拒。')
      }
    }, 2000)
  }, [handleAbsolute, handleRelative])

  // Request orientation permission (iOS 13+) then attach listeners.
  const request = useCallback(() => {
    const DOE = window.DeviceOrientationEvent
    if (DOE && typeof DOE.requestPermission === 'function') {
      setPerm({ text: '需请求…', cls: 'w' })
      DOE.requestPermission()
        .then((res) => {
          setPerm({ text: res, cls: res === 'granted' ? 'g' : 'r' })
          if (res === 'granted') attach()
          else
            setError('方向权限被拒。请在系统设置里允许「运动与方向」后重试。')
        })
        .catch((e) => {
          setPerm({ text: '异常: ' + e.message, cls: 'r' })
          setError('请求方向权限失败:' + e.message)
        })
    } else {
      setPerm({ text: '无需请求(自动)', cls: 'g' })
      attach()
    }
  }, [attach])

  // Clean up listeners on unmount.
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleAbsolute, true)
      window.removeEventListener('deviceorientation', handleRelative, true)
    }
  }, [handleAbsolute, handleRelative])

  return { heading, pitch, hasOrient, evt, src, perm, error, request }
}
