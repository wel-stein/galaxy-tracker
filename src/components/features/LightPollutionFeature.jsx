import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  LP_TILE_URL,
  LP_SAMPLE_URL,
  LP_MAX_NATIVE_ZOOM,
  BASE_TILE_URL,
  BASE_ATTRIB,
  BORTLE,
  bortleFromPixel,
} from '../../lib/bortle'
import { LocationBar } from '../LocationBar'

// Web-Mercator lat/lon → tile + in-tile pixel at a given zoom.
function tilePixel(lat, lon, z) {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  const tx = Math.floor(x)
  const ty = Math.floor(y)
  return { tx, ty, px: Math.floor((x - tx) * 256), py: Math.floor((y - ty) * 256) }
}

// Load the overlay tile under a point and read its color → Bortle class.
// Resolves to a BORTLE entry, or null if the tile/CORS can't be read.
// Returns a BORTLE entry, or null when the tile genuinely can't be read
// (so we can show "无法读取" instead of falsely reporting pristine skies).
// Uses fetch + createImageBitmap so we can distinguish a 204 "no light here"
// from a real failure, and so the same-origin blob is never canvas-tainted.
async function sampleBortle(lat, lon) {
  const { tx, ty, px, py } = tilePixel(lat, lon, LP_MAX_NATIVE_ZOOM)
  const url = LP_SAMPLE_URL.replace('{z}', LP_MAX_NATIVE_ZOOM)
    .replace('{x}', tx)
    .replace('{y}', ty)
  try {
    const r = await fetch(url)
    if (r.status === 204) return BORTLE[0] // no light at all ⇒ darkest skies
    if (!r.ok) return null // upstream/proxy failure
    const bmp = await createImageBitmap(await r.blob())
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')
    ctx.drawImage(bmp, 0, 0)
    const d = ctx.getImageData(px, py, 1, 1).data
    return bortleFromPixel(d[0], d[1], d[2], d[3])
  } catch {
    return null
  }
}

export function LightPollutionFeature({ geo }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const overlayRef = useRef(null)
  const markerRef = useRef(null)
  const centeredRef = useRef(false)
  const lastKeyRef = useRef(null)
  const [opacity, setOpacity] = useState(0.75)
  const [reading, setReading] = useState(null) // {lat,lon,bortle|null,loading}

  // Initialize the map once.
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    const map = L.map(mapEl.current, { center: [20, 100], zoom: 3, worldCopyJump: true })
    L.tileLayer(BASE_TILE_URL, { attribution: BASE_ATTRIB, maxZoom: 19 }).addTo(map)
    const overlay = L.tileLayer(LP_TILE_URL, {
      maxNativeZoom: LP_MAX_NATIVE_ZOOM,
      maxZoom: 19,
      opacity,
      className: 'lp-overlay',
    }).addTo(map)
    overlayRef.current = overlay
    mapRef.current = map

    map.on('click', (e) => inspect(e.latlng.lat, e.latlng.lng))

    return () => {
      map.remove()
      mapRef.current = null
      overlayRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep overlay opacity in sync.
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.setOpacity(opacity)
  }, [opacity])

  // Mark the user's location and read its Bortle class. Auto-center only on
  // the first fix, and only re-sample when the position changes by ~100 m, so
  // GPS jitter doesn't snap the map back or reload tiles while panning.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !geo.loc) return
    const { lat, lon } = geo.loc
    const key = lat.toFixed(3) + ',' + lon.toFixed(3)
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key
    if (!centeredRef.current) {
      map.setView([lat, lon], 8)
      centeredRef.current = true
    }
    inspect(lat, lon)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.loc])

  function inspect(lat, lon) {
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = L.circleMarker([lat, lon], {
      radius: 7,
      color: '#ffce6b',
      weight: 2,
      fillColor: '#ffce6b',
      fillOpacity: 0.6,
    }).addTo(map)
    setReading({ lat, lon, loading: true, bortle: null })
    sampleBortle(lat, lon).then((b) =>
      setReading({ lat, lon, loading: false, bortle: b }),
    )
  }

  return (
    <div className="feature">
      <h2 className="ftitle">光污染地图</h2>
      <p className="fsub">
        底图叠加 NASA 夜间灯光(VIIRS)。越亮 = 光污染越严重、星空越差。
      </p>

      <ol className="howto">
        <li>蓝点是你的位置,地图已自动定位到附近。</li>
        <li>点击地图任意一点,下方显示该处估算的 Bortle 等级。</li>
        <li>拖动滑块调节夜间灯光图层的透明度。</li>
      </ol>

      <LocationBar geo={geo} />

      <div className="mapwrap">
        <div ref={mapEl} className="map" />
      </div>

      <div className="maprow">
        <label className="opacity">
          <span>夜间灯光</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
          />
        </label>
      </div>

      {reading && (
        <div className="reading">
          <div className="rcoord mono">
            {reading.lat.toFixed(3)}, {reading.lon.toFixed(3)}
          </div>
          {reading.loading ? (
            <div className="rval">读取中…</div>
          ) : reading.bortle ? (
            <div className="rval">
              <span
                className="swatch"
                style={{ background: reading.bortle.color }}
              />
              Bortle ≈ <b>{reading.bortle.cls}</b> · {reading.bortle.name}
              <div className="rdesc">{reading.bortle.desc}</div>
            </div>
          ) : (
            <div className="rval rdim">无法读取该点 — 请对照下方图例估算</div>
          )}
        </div>
      )}

      <div className="legend">
        <div className="legtitle">Bortle 暗空等级参考</div>
        {BORTLE.map((b) => (
          <div className="legrow" key={b.cls}>
            <span className="swatch" style={{ background: b.color }} />
            <span className="legcls mono">{b.cls}</span>
            <span className="legname">{b.name}</span>
            <span className="legdesc">{b.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
