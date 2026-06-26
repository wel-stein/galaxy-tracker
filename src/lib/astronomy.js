// Astronomy helpers for locating the Galactic Center (Sagittarius A*).
//
// The Galactic Center sits at roughly R.A. 17h45m, Dec −29° (J2000).
// Given an observer's latitude/longitude and a moment in time we can
// convert those equatorial coordinates into local horizontal coordinates
// (azimuth + altitude), which is what the compass needs.

// Equatorial coordinates of the Galactic Center (J2000), in degrees.
export const GC_RA = 266.41683
export const GC_DEC = -29.00781

// Camera field-of-view and alignment tolerances (degrees).
export const FOV = 64
export const AZ_TOL = 7
export const ALT_TOL = 10

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

// 16-point compass rose (Chinese labels), matching the original app.
export const COMPASS = [
  '北', '北东北', '东北', '东东北',
  '东', '东东南', '东南', '南东南',
  '南', '南西南', '西南', '西西南',
  '西', '西西北', '西北', '北西北',
]

// Julian Date from a JS Date.
export function jd(date) {
  return date.getTime() / 86400000 + 2440587.5
}

// Greenwich Mean Sidereal Time (degrees) for a given Julian Date.
export function gmst(j) {
  const T = (j - 2451545) / 36525
  let g =
    280.46061837 +
    360.98564736629 * (j - 2451545) +
    0.000387933 * T * T -
    (T * T * T) / 38710000
  g %= 360
  return g < 0 ? g + 360 : g
}

// Convert any equatorial coordinates (RA/Dec in degrees) to horizontal
// (altitude/azimuth in degrees) for the given observer location and time.
export function equatorialToHorizontal(ra, dec, lat, lon, date) {
  const j = jd(date)
  const lst = (gmst(j) + lon) % 360
  const H = ((((lst - ra) % 360) + 360) % 360) * DEG
  const d = dec * DEG
  const la = lat * DEG
  const alt = Math.asin(
    Math.sin(d) * Math.sin(la) + Math.cos(d) * Math.cos(la) * Math.cos(H),
  )
  const A = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(la) - Math.tan(d) * Math.cos(la),
  )
  let az = (A * RAD + 180) % 360
  if (az < 0) az += 360
  return { alt: alt * RAD, az }
}

// Convert the Galactic Center's equatorial coordinates to horizontal
// (altitude/azimuth) for the given observer location and time.
export function horiz(lat, lon, date) {
  return equatorialToHorizontal(GC_RA, GC_DEC, lat, lon, date)
}

// Normalize an angle to the range (−180, 180].
export function n180(x) {
  return ((((x + 180) % 360) + 360) % 360) - 180
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

// Nearest compass point label for an azimuth (degrees).
export function dir(az) {
  return COMPASS[Math.round((az % 360) / 22.5) % 16]
}

export { DEG, RAD }
