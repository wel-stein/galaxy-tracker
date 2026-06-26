import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../lib/astronomy'

// Wraps the DeviceOrientation API. Handles the iOS 13+ permission prompt,
// derives a compass heading (preferring iOS's webkitCompassHeading) and a
// pitch from the beta angle, and surfaces diagnostic counters/state.
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

  const onOrient = useCallback((e) => {
    sawEventRef.current = true
    setHasOrient(true)
    setEvt((n) => n + 1)

    let h = null
    if (typeof e.webkitCompassHeading === 'number') {
      h = e.webkitCompassHeading
      setSrc('webkitCompassHeading (iOS)')
    } else if (typeof e.alpha === 'number') {
      h = (360 - e.alpha) % 360
      setSrc((e.absolute ? 'absolute' : 'relative') + ' alpha')
    }
    if (h != null && !isNaN(h)) {
      headingRef.current = h
      setHeading(h)
    }
    if (typeof e.beta === 'number') {
      const p = clamp(90 - e.beta, -90, 90)
      pitchRef.current = p
      setPitch(p)
    }
  }, [])

  const attach = useCallback(() => {
    if (attachedRef.current) return
    attachedRef.current = true
    window.addEventListener('deviceorientationabsolute', onOrient, true)
    window.addEventListener('deviceorientation', onOrient, true)
    // If no event arrives within 2s, the sensor is unavailable.
    setTimeout(() => {
      if (!sawEventRef.current) {
        setError(
          '没有收到方向事件 — 多半是非 HTTPS、桌面设备,或权限被拒。',
        )
      }
    }, 2000)
  }, [onOrient])

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
      window.removeEventListener('deviceorientationabsolute', onOrient, true)
      window.removeEventListener('deviceorientation', onOrient, true)
    }
  }, [onOrient])

  return { heading, pitch, hasOrient, evt, src, perm, error, request }
}
