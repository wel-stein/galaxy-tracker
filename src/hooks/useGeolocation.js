import { useCallback, useState } from 'react'

// Wraps the Geolocation API. Exposes the current position, a status string
// for the diagnostics panel, any error, and a `request()` trigger.
export function useGeolocation() {
  const [loc, setLoc] = useState(null)
  const [status, setStatus] = useState({ text: '未请求', cls: '' })
  const [error, setError] = useState(null)

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus({ text: '不支持', cls: 'r' })
      setError('此浏览器不支持定位')
      return
    }
    setStatus({ text: '请求中…', cls: 'w' })
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: p.coords.latitude, lon: p.coords.longitude })
        setStatus({ text: '成功 ✓', cls: 'g' })
        setError(null)
      },
      (err) => {
        setStatus({ text: '失败: ' + err.message, cls: 'r' })
        setError('无法定位 (' + err.message + ') — 请用下方「手动定位」。')
      },
      { enableHighAccuracy: true, timeout: 9000 },
    )
  }, [])

  // Manually override the location (used by the "手动定位" panel).
  const setManual = useCallback((lat, lon) => {
    setLoc({ lat, lon })
    setStatus({ text: '手动设置 ✓', cls: 'g' })
    setError(null)
  }, [])

  return { loc, status, error, request, setManual }
}
