// Sun, Moon, and twilight calculations for the observing-conditions panel.
// Low-precision formulas (Meeus / NOAA), accurate to ~1 minute for rise/set
// and well within what an observing planner needs.

import { jd, equatorialToHorizontal, DEG, RAD } from './astronomy.js'

// --- Sun -----------------------------------------------------------------

// Approximate geocentric equatorial coordinates of the Sun (RA/Dec degrees).
export function sunEquatorial(date) {
  const d = jd(date) - 2451545.0 // days since J2000.0
  const g = ((357.529 + 0.98560028 * d) % 360) * DEG // mean anomaly
  const q = (280.459 + 0.98564736 * d) % 360 // mean longitude
  const L =
    (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG // ecliptic lon
  const e = (23.439 - 0.00000036 * d) * DEG // obliquity
  let ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) * RAD
  ra = ((ra % 360) + 360) % 360
  const dec = Math.asin(Math.sin(e) * Math.sin(L)) * RAD
  return { ra, dec }
}

export function sunAltitude(lat, lon, date) {
  const { ra, dec } = sunEquatorial(date)
  return equatorialToHorizontal(ra, dec, lat, lon, date).alt
}

// Standard solar-altitude thresholds (degrees) for the day's key moments.
export const SUN_EVENTS = [
  { key: 'sunset', label: '日落', alt: -0.833, dir: 'down' },
  { key: 'civil', label: '民用暮光终', alt: -6, dir: 'down' },
  { key: 'nautical', label: '航海暮光终', alt: -12, dir: 'down' },
  { key: 'astro', label: '天文暮光终', alt: -18, dir: 'down' },
  { key: 'astroDawn', label: '天文暮光始', alt: -18, dir: 'up' },
  { key: 'sunrise', label: '日出', alt: -0.833, dir: 'up' },
]

// Fallback UTC offset (seconds) estimated from longitude, ~1 hour / 15°.
export function offsetFromLon(lon) {
  return Math.round(lon / 15) * 3600
}

// Format an absolute instant as HH:MM in the location's timezone (given its
// UTC offset in seconds), independent of the device's timezone.
export function fmtClock(date, offsetSec) {
  if (!date) return '—'
  const d = new Date(date.getTime() + offsetSec * 1000)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// Find the times (Date) of sun-altitude threshold crossings across a window.
// We sample altitude every `stepMin` minutes and linearly interpolate the
// crossing — robust at any latitude without solving Kepler's equation.
//
// The window is anchored to the LOCATION's local noon (via offsetSec) so the
// right night is covered no matter the device timezone. Returned values are
// absolute Date instants.
export function sunEvents(lat, lon, around = new Date(), offsetSec = null, stepMin = 5) {
  const off = offsetSec == null ? offsetFromLon(lon) : offsetSec
  // Location-local civil date of `around`, then its 12:00 local as an instant.
  const local = new Date(around.getTime() + off * 1000)
  const localNoonUTC = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    12,
    0,
    0,
  )
  const start = new Date(localNoonUTC - off * 1000)
  const samples = []
  const steps = (24 * 60) / stepMin
  for (let i = 0; i <= steps; i++) {
    const t = new Date(start.getTime() + i * stepMin * 60000)
    samples.push({ t, alt: sunAltitude(lat, lon, t) })
  }
  const found = {}
  for (const ev of SUN_EVENTS) {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1]
      const b = samples[i]
      const crossingDown = a.alt > ev.alt && b.alt <= ev.alt
      const crossingUp = a.alt <= ev.alt && b.alt > ev.alt
      if ((ev.dir === 'down' && crossingDown) || (ev.dir === 'up' && crossingUp)) {
        const f = (ev.alt - a.alt) / (b.alt - a.alt)
        found[ev.key] = new Date(a.t.getTime() + f * (b.t.getTime() - a.t.getTime()))
        break
      }
    }
  }
  return found
}

// --- Moon ----------------------------------------------------------------

const SYNODIC = 29.530588853 // mean synodic month, days

// Phase names keyed by elongation (Sun→Moon, degrees): 0 new, 90 first
// quarter, 180 full, 270 last quarter.
const PHASE_NAMES = [
  { max: 7, name: '新月', emoji: '🌑' },
  { max: 83, name: '娥眉月', emoji: '🌒' },
  { max: 97, name: '上弦月', emoji: '🌓' },
  { max: 173, name: '盈凸月', emoji: '🌔' },
  { max: 187, name: '满月', emoji: '🌕' },
  { max: 263, name: '亏凸月', emoji: '🌖' },
  { max: 277, name: '下弦月', emoji: '🌗' },
  { max: 353, name: '残月', emoji: '🌘' },
  { max: 361, name: '新月', emoji: '🌑' },
]

// Moon phase from the geocentric Sun→Moon elongation. Uses the Moon's mean
// anomaly and the main periodic longitude terms (Meeus, low precision), so
// the illuminated fraction is accurate to ~1% rather than assuming a uniform
// synodic cycle.
export function moonPhase(date) {
  const d = jd(date) - 2451545.0
  // Sun apparent ecliptic longitude.
  const Msun = (357.529 + 0.98560028 * d) * DEG
  const Lsun0 = 280.459 + 0.98564736 * d
  const lambdaSun =
    Lsun0 + 1.915 * Math.sin(Msun) + 0.02 * Math.sin(2 * Msun)
  // Moon longitude (main terms).
  const Lp = 218.316 + 13.176396 * d // mean longitude
  const Mp = (134.963 + 13.064993 * d) * DEG // mean anomaly
  const D = (297.8502 + 12.1907492 * d) * DEG // mean elongation
  const moonLong =
    Lp +
    6.289 * Math.sin(Mp) +
    1.274 * Math.sin(2 * D - Mp) +
    0.658 * Math.sin(2 * D) +
    0.214 * Math.sin(2 * Mp) -
    0.186 * Math.sin(Msun)

  let elong = (((moonLong - lambdaSun) % 360) + 360) % 360 // 0=new..180=full
  const illum = (1 - Math.cos(elong * DEG)) / 2
  const waxing = elong < 180
  const age = (elong / 360) * SYNODIC
  const phase = PHASE_NAMES.find((p) => elong < p.max) || PHASE_NAMES[0]
  return { age, illum, waxing, elong, name: phase.name, emoji: phase.emoji }
}
