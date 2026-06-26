import { useState } from 'react'

// The "手动定位" fallback: lets the user type a lat/lon when geolocation
// is unavailable or denied.
export function ManualPanel({ onApply }) {
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')

  const apply = () => {
    const la = parseFloat(lat)
    const lo = parseFloat(lon)
    if (!isNaN(la) && !isNaN(lo)) onApply(la, lo)
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          placeholder="纬度 lat"
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          placeholder="经度 lon"
          inputMode="decimal"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
        />
      </div>
      <button
        className="ghost"
        style={{
          marginTop: 10,
          width: '100%',
          borderColor: 'var(--gold)',
          color: 'var(--gold)',
        }}
        onClick={apply}
      >
        应用位置
      </button>
      <p className="tip" style={{ marginTop: 8 }}>
        东经、北纬为正。例:北京 39.9, 116.4 · 台北 25.0, 121.5
      </p>
    </div>
  )
}
