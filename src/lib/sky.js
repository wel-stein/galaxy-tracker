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

// Find the times (Date) of sun-altitude threshold crossings across a window.
// We sample altitude every `stepMin` minutes and linearly interpolate the
// crossing — robust at any latitude without solving Kepler's equation.
export function sunEvents(lat, lon, around = new Date(), stepMin = 5) {
  // Window: local noon today → local noon tomorrow, so a whole night fits.
  const start = new Date(around)
  start.setHours(12, 0, 0, 0)
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
const KNOWN_NEW_MOON = 2451550.1 // JD of new moon 2000-01-06

const PHASE_NAMES = [
  { max: 0.02, name: '新月', emoji: '🌑' },
  { max: 0.24, name: '娥眉月', emoji: '🌒' },
  { max: 0.26, name: '上弦月', emoji: '🌓' },
  { max: 0.49, name: '盈凸月', emoji: '🌔' },
  { max: 0.52, name: '满月', emoji: '🌕' },
  { max: 0.74, name: '亏凸月', emoji: '🌖' },
  { max: 0.76, name: '下弦月', emoji: '🌗' },
  { max: 0.98, name: '残月', emoji: '🌘' },
  { max: 1.01, name: '新月', emoji: '🌑' },
]

// Moon phase: synodic age, illuminated fraction, name, and waxing flag.
export function moonPhase(date) {
  const age = (((jd(date) - KNOWN_NEW_MOON) % SYNODIC) + SYNODIC) % SYNODIC
  const frac = age / SYNODIC // 0=new, 0.5=full
  const illum = (1 - Math.cos(2 * Math.PI * frac)) / 2
  const waxing = frac < 0.5
  const phase = PHASE_NAMES.find((p) => frac < p.max) || PHASE_NAMES[0]
  return { age, illum, waxing, name: phase.name, emoji: phase.emoji }
}
