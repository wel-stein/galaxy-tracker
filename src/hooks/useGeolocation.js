import { useCallback, useEffect, useRef, useState } from 'react'

// Wraps the Geolocation API. Exposes the current position, a status string
// for the diagnostics panel, any fatal error, a `slow` hint, and triggers.
//
// We deliberately use watchPosition WITHOUT a `timeout` option. The
// getCurrentPosition `timeout` is what makes the browser throw the
// "Timeout expired" error when a fix is slow (very common on desktop or
// indoors). watchPosition instead keeps trying and delivers a position
// whenever the device finally gets one, so a slow fix never looks like a
// failure — we just nudge the user toward manual entry in the meantime.
export function useGeolocation() {
  const [loc, setLoc] = useState(null)
  const [status, setStatus] = useState({ text: '未请求', cls: '' })
  const [error, setError] = useState(null)
  const [slow, setSlow] = useState(false)

  const watchId = useRef(null)
  const slowTimer = useRef(null)
  const gotFix = useRef(false)
  const requestedRef = useRef(false)

  const stopWatch = useCallback(() => {
    if (watchId.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    clearTimeout(slowTimer.current)
  }, [])

  // `force` restarts an active watch (the "重新定位" button); a plain call is
  // idempotent so multiple tabs can each ensure location without churning the
  // watch or re-prompting.
  const request = useCallback((force = false) => {
    if (!force && requestedRef.current) return
    requestedRef.current = true
    if (!navigator.geolocation) {
      setStatus({ text: '不支持', cls: 'r' })
      setError('此浏览器不支持定位 — 请用下方「手动定位」输入坐标。')
      setSlow(true)
      return
    }
    setStatus({ text: '定位中…', cls: 'w' })
    setSlow(false)
    setError(null)
    gotFix.current = false

    // If no fix arrives within ~8s, reveal the manual option — but as a
    // gentle hint, not an error. The watch keeps running underneath.
    clearTimeout(slowTimer.current)
    slowTimer.current = setTimeout(() => {
      if (!gotFix.current) {
        setSlow(true)
        setStatus({ text: '定位较慢 — 可手动输入坐标', cls: 'w' })
      }
    }, 8000)

    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        gotFix.current = true
        setLoc({ lat: p.coords.latitude, lon: p.coords.longitude })
        setStatus({ text: '成功 ✓', cls: 'g' })
        setError(null)
        setSlow(false)
        clearTimeout(slowTimer.current)
      },
      (err) => {
        // Only a permission denial is fatal. TIMEOUT / POSITION_UNAVAILABLE
        // are transient — watchPosition will keep trying — so we just hint
        // at manual entry instead of showing the "Timeout expired" error.
        if (err.code === 1 /* PERMISSION_DENIED */) {
          stopWatch()
          setStatus({ text: '权限被拒', cls: 'r' })
          setError('定位权限被拒 — 请用下方「手动定位」输入坐标。')
          setSlow(true)
        } else if (!gotFix.current) {
          setSlow(true)
          setStatus({ text: '定位较慢 — 可手动输入坐标', cls: 'w' })
        }
      },
      { enableHighAccuracy: true, maximumAge: 60000 },
    )
  }, [stopWatch])

  // Manually override the location (used by the "手动定位" panel/presets).
  const setManual = useCallback(
    (lat, lon) => {
      stopWatch()
      gotFix.current = true
      setLoc({ lat, lon })
      setStatus({ text: '手动设置 ✓', cls: 'g' })
      setError(null)
      setSlow(false)
    },
    [stopWatch],
  )

  useEffect(() => stopWatch, [stopWatch])

  return { loc, status, error, slow, request, setManual }
}
