// The three readouts under the viewport: target azimuth, target altitude
// (with an above/below-horizon note), and the phone's current heading.
export function Stats({ target, heading }) {
  const above = target ? target.alt > 0 : false
  return (
    <div className="stats">
      <div className="stat">
        <div className="l">目标方位</div>
        <div className="v">{target ? target.az.toFixed(0) + '°' : '—'}</div>
      </div>
      <div className="stat">
        <div className="l">目标高度</div>
        <div className="v">{target ? target.alt.toFixed(0) + '°' : '—'}</div>
        <div className="s">{target ? (above ? '地平线上' : '地平线下') : ''}</div>
      </div>
      <div className="stat">
        <div className="l">手机朝向</div>
        <div className="v">{heading == null ? '—' : heading.toFixed(0) + '°'}</div>
      </div>
    </div>
  )
}
