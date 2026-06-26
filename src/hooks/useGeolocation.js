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
      setError('此浏览器不支持定位 — 请用下方「手动定位」。')
      return
    }
    setStatus({ text: '请求中…', cls: 'w' })

    const onOk = (p) => {
      setLoc({ lat: p.coords.latitude, lon: p.coords.longitude })
      setStatus({ text: '成功 ✓', cls: 'g' })
      setError(null)
    }

    // High-accuracy (GPS) fixes can be slow and frequently time out on
    // desktop or indoors — the browser reports "Timeout expired". When the
    // first attempt fails, retry once with coarse, cached positioning, which
    // is faster and usually succeeds, before falling back to manual entry.
    const onFail = (err) => {
      setStatus({ text: '高精度失败,重试中…: ' + err.message, cls: 'w' })
      navigator.geolocation.getCurrentPosition(onOk, (err2) => {
        setStatus({ text: '失败: ' + err2.message, cls: 'r' })
        setError(
          '无法定位 (' + err2.message + ') — 请用下方「手动定位」输入坐标。',
        )
      }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 })
    }

    navigator.geolocation.getCurrentPosition(onOk, onFail, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    })
  }, [])

  // Manually override the location (used by the "手动定位" panel).
  const setManual = useCallback((lat, lon) => {
    setLoc({ lat, lon })
    setStatus({ text: '手动设置 ✓', cls: 'g' })
    setError(null)
  }, [])

  return { loc, status, error, request, setManual }
}
