import { useEffect, useState } from 'react'

// Fetches cloud-cover (and a few related) forecast from Open-Meteo — a free,
// no-API-key, CORS-enabled weather service. Refetches whenever the location
// changes. Network failures degrade gracefully into an error string.
export function useWeather(loc) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ok | error
  const [error, setError] = useState(null)

  // Round to ~1 km so the effect only refetches when the location moves
  // meaningfully — watchPosition emits a new loc object on every GPS tick,
  // which would otherwise hammer the API.
  const lat = loc ? Math.round(loc.lat * 100) / 100 : null
  const lon = loc ? Math.round(loc.lon * 100) / 100 : null

  useEffect(() => {
    if (lat == null) return
    let cancelled = false
    const controller = new AbortController()
    setStatus('loading')
    setError(null)

    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=cloud_cover,temperature_2m,relative_humidity_2m' +
      '&current=cloud_cover,temperature_2m' +
      '&timezone=auto&forecast_days=2'

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then((j) => {
        if (cancelled) return
        setData(j)
        setStatus('ok')
      })
      .catch((e) => {
        if (cancelled || e.name === 'AbortError') return
        setStatus('error')
        setError('无法获取天气数据(' + e.message + ')')
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [lat, lon])

  return { data, status, error }
}

// Pick the cloud-cover values for the hours of tonight's dark window
// (between two Date bounds) from an Open-Meteo hourly response.
export function cloudCoverBetween(data, from, to) {
  if (!data?.hourly?.time || !data.hourly.cloud_cover) return []
  const out = []
  data.hourly.time.forEach((iso, i) => {
    const t = new Date(iso)
    if (t >= from && t <= to) {
      out.push({ t, cover: data.hourly.cloud_cover[i] })
    }
  })
  return out
}
