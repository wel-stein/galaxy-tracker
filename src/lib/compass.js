import { AZ_TOL, ALT_TOL, FOV, RAD, clamp, n180 } from './astronomy'

export const ALIGNED_COLOR = '#7fe3d4'
export const SEEKING_COLOR = '#ffce6b'

// Direction hint ("上"/"下"/"左"/"右") toward the target when it is far off.
export function hint(dAz, dAlt) {
  if (Math.abs(dAlt) > Math.abs(dAz)) return dAlt > 0 ? '上' : '下'
  return dAz > 0 ? '右' : '左'
}

// Given the target horizontal coords plus the phone's heading/pitch,
// compute everything the overlay needs for one frame: whether we're
// aligned, where to draw the marker, and which status message to show.
export function computeOverlay({ target, heading, pitch, hasOrient }) {
  const above = target ? target.alt > 0 : false
  const dAz = heading != null && target ? n180(target.az - heading) : null
  const dAlt = pitch != null && target ? target.alt - pitch : null

  const aligned =
    dAz != null &&
    dAlt != null &&
    Math.abs(dAz) < AZ_TOL &&
    Math.abs(dAlt) < ALT_TOL &&
    above

  const color = aligned ? ALIGNED_COLOR : SEEKING_COLOR

  let marker = null
  if (dAz != null && dAlt != null) {
    const nx = dAz / (FOV / 2)
    const ny = -dAlt / (FOV / 2)
    const off = Math.abs(nx) > 1 || Math.abs(ny) > 1
    const px = 50 + clamp(nx, -1, 1) * 42
    const py = 50 + clamp(ny, -1, 1) * 42
    marker = {
      off,
      px,
      py,
      color,
      angle: Math.atan2(ny, nx) * RAD,
    }
  }

  let status
  if (!hasOrient) status = '未检测到方向传感器'
  else if (!target) status = '等待定位…'
  else if (!above) status = '银心在地平线以下'
  else if (aligned) status = '✦ 找到了 — 就在正前方'
  else if (Math.abs(dAz) > FOV / 2 || Math.abs(dAlt) > FOV / 2)
    status = '朝' + hint(dAz, dAlt) + '转'
  else status = '靠近了 — 微调对准中心'

  return { aligned, above, marker, status, dAz, dAlt }
}
