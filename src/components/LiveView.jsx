import { useState } from 'react'
import { horiz, dir } from '../lib/astronomy'
import { computeOverlay, guidance } from '../lib/compass'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { CompassView } from './CompassView'
import { Stats } from './Stats'
import { ManualPanel } from './ManualPanel'
import { Diagnostics } from './Diagnostics'

// The active compass screen. Recomputes the target's horizontal position
// (and the overlay) on every animation frame, since both depend on time.
export function LiveView({ geo, orient, camera }) {
  const [target, setTarget] = useState(null)
  const [overlay, setOverlay] = useState({
    aligned: false,
    above: false,
    marker: null,
    status: '等待定位…',
  })
  const [manualOpen, setManualOpen] = useState(false)

  useAnimationFrame(() => {
    const t = geo.loc
      ? horiz(geo.loc.lat, geo.loc.lon, new Date())
      : null
    setTarget(t)
    setOverlay(
      computeOverlay({
        target: t,
        heading: orient.heading,
        pitch: orient.pitch,
        hasOrient: orient.hasOrient,
      }),
    )
  })

  const above = target ? target.alt > 0 : false
  const dirReadout = target
    ? dir(target.az) + ' · ' + target.az.toFixed(0) + '°'
    : '计算中…'
  const err = geo.error || orient.error || camera.error

  return (
    <section id="live">
      <div
        className="mono"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          margin: '12px 0 14px',
        }}
      >
        <span className="eyebrow">银心罗盘</span>
        <span style={{ fontSize: 12, color: 'var(--dim)' }}>{dirReadout}</span>
      </div>

      <CompassView
        overlay={overlay}
        aligned={overlay.aligned}
        videoRef={camera.videoRef}
        camOn={camera.on}
      />

      {(() => {
        const g = guidance({
          target,
          dAz: overlay.dAz,
          dAlt: overlay.dAlt,
          aligned: overlay.aligned,
        })
        if (!g) return null
        return (
          <div className={'guide' + (overlay.aligned ? ' ok' : '')}>
            <div className="guide-label">银河中心现在位于</div>
            <div className="guide-where">{g.where}</div>
            {g.turn && <div className="guide-turn">{g.turn}</div>}
          </div>
        )
      })()}

      <Stats target={target} heading={orient.heading} />

      {target && !above && (
        <p className="tip">
          此刻银心在地平线下方,看不到。北半球最佳观测期约 3–10
          月,夏季后半夜银心升得最高。换个时间再试。
        </p>
      )}

      <div className="row">
        <button className="ghost" onClick={camera.toggle}>
          {camera.on ? '关闭实景' : 'AR 实景背景'}
        </button>
        <button className="ghost" onClick={() => setManualOpen((o) => !o)}>
          手动定位
        </button>
      </div>

      {err && <p className="note">{err}</p>}

      {geo.slow && !geo.loc && !geo.error && (
        <p className="tip">
          没拿到定位(桌面浏览器或室内常见)。在下方输入坐标或点选城市即可继续。
        </p>
      )}

      {(manualOpen || (geo.slow && !geo.loc) || (geo.error && !geo.loc)) && (
        <ManualPanel onApply={geo.setManual} />
      )}

      <Diagnostics
        secure={{
          text: window.isSecureContext ? '是 ✓' : '否 ✗ (传感器会被禁用)',
          cls: window.isSecureContext ? 'g' : 'r',
        }}
        origin={{
          text: location.protocol + '//' + (location.host || 'file'),
          cls: location.protocol === 'https:' ? '' : 'w',
        }}
        geo={geo.status}
        loc={{
          text: geo.loc
            ? geo.loc.lat.toFixed(3) + ', ' + geo.loc.lon.toFixed(3)
            : '—',
          cls: geo.loc ? 'g' : '',
        }}
        perm={orient.perm}
        evt={{
          text: String(orient.evt),
          cls: orient.evt > 0 ? 'g' : '',
        }}
        src={orient.src}
        headingPitch={
          (orient.heading == null ? '—' : orient.heading.toFixed(0)) +
          ' / ' +
          (orient.pitch == null ? '—' : orient.pitch.toFixed(0))
        }
        error={{ text: err || '无', cls: err ? 'r' : '' }}
      />
    </section>
  )
}
