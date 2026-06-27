// Light-pollution overlay config + Bortle dark-sky scale reference.
//
// The overlay is NASA GIBS "Earth at Night" (VIIRS Black Marble) — satellite
// imagery of artificial light at night, free, no key, and CORS-enabled. It
// renders reliably worldwide: dark where the sky is dark, bright where it is
// light-polluted. We estimate a Bortle class from the pixel brightness under a
// point (brighter = worse skies).
//
// GIBS WMTS tiles use {z}/{y}/{x} order (TileMatrix/TileRow/TileCol).
const GIBS =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble' +
  '/default/2016-01-01/GoogleMapsCompatible_Level8'

// Both the overlay and the pixel-sampling go through our same-origin proxy
// (see api/lptile.js). That resolves the upstream URL/format server-side
// (where there's network access) and guarantees the sampled tile is readable
// (no cross-origin canvas taint).
export const LP_TILE_URL = '/api/lptile?z={z}&x={x}&y={y}'
export const LP_SAMPLE_URL = LP_TILE_URL
export const LP_MAX_NATIVE_ZOOM = 8

// Direct GIBS template (kept for reference / non-proxied environments).
export const GIBS_DIRECT_URL = `${GIBS}/{z}/{y}/{x}.png`

// CartoDB dark base map fits the night theme (free, no key).
export const BASE_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const BASE_ATTRIB =
  '&copy; OpenStreetMap &copy; CARTO · 夜间灯光 © NASA GIBS / VIIRS'

// The 9-class Bortle scale: class, swatch color, short name, and what the
// night sky looks like. Used as the reference legend.
export const BORTLE = [
  { cls: 1, color: '#0b0f24', name: '极佳暗空', desc: '银河投下阴影,黄道光明显' },
  { cls: 2, color: '#15214a', name: '真正暗空', desc: '银河结构丰富,M33 肉眼可见' },
  { cls: 3, color: '#1f6f3f', name: '乡村天空', desc: '银河仍有结构,地平线有微光' },
  { cls: 4, color: '#4caf3a', name: '乡村/郊区过渡', desc: '银河较明显,光污染穹顶可见' },
  { cls: 4.5, color: '#b9c12e', name: '郊区', desc: '银河苍白,仅头顶可见' },
  { cls: 5, color: '#ffd23f', name: '郊区天空', desc: '银河很弱或看不到' },
  { cls: 6, color: '#ff9e2c', name: '亮郊区', desc: '银河不可见,M31 勉强可见' },
  { cls: 7, color: '#ff5e3a', name: '城郊过渡', desc: '天空灰白,只有亮星' },
  { cls: 8, color: '#ff8fb0', name: '城市天空', desc: '天空泛光,星座难辨' },
  { cls: 9, color: '#ffffff', name: '市中心', desc: '仅见月亮、行星和最亮的星' },
]

// Web-Mercator lat/lon → tile (x,y) + in-tile pixel (px,py) at a given zoom.
export function lonLatToTilePixel(lat, lon, z) {
  const n = 2 ** z
  const xf = ((lon + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const yf =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  const tx = Math.floor(xf)
  const ty = Math.floor(yf)
  return {
    tx,
    ty,
    px: Math.floor((xf - tx) * 256),
    py: Math.floor((yf - ty) * 256),
  }
}

// Upper luminance bound (0–255) mapping VIIRS night-light brightness to each
// Bortle class. Heuristic but directionally correct: dark ⇒ class 1, a bright
// city core ⇒ class 8–9.
const LUM_BREAKS = [6, 16, 32, 55, 80, 110, 145, 185, 225]

// Estimate a Bortle class from a sampled RGBA night-light pixel.
export function bortleFromPixel(r, g, b, a) {
  if (a < 10) return BORTLE[0] // fully transparent ⇒ no light ⇒ darkest
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  let idx = LUM_BREAKS.findIndex((t) => lum < t)
  if (idx === -1) idx = BORTLE.length - 1
  return BORTLE[idx]
}
