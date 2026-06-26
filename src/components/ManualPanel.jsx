import { useState } from 'react'

// A few common cities for one-tap fallback when geolocation is unavailable.
const PRESETS = [
  { name: '北京', lat: 39.9, lon: 116.4 },
  { name: '上海', lat: 31.2, lon: 121.5 },
  { name: '广州', lat: 23.1, lon: 113.3 },
  { name: '台北', lat: 25.0, lon: 121.5 },
  { name: '香港', lat: 22.3, lon: 114.2 },
]

// The "手动定位" fallback: lets the user type a lat/lon — or tap a city —
// when geolocation is unavailable or denied.
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
      <div className="row" style={{ marginTop: 10 }}>
        {PRESETS.map((c) => (
          <button
            key={c.name}
            className="ghost"
            style={{ flex: 'none', padding: '8px 14px' }}
            onClick={() => onApply(c.lat, c.lon)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <p className="tip" style={{ marginTop: 8 }}>
        东经、北纬为正。例:北京 39.9, 116.4 · 台北 25.0, 121.5
      </p>
    </div>
  )
}
