// The square viewport: optional camera background, a fixed center crosshair,
// the moving target marker (halo+dot when on-screen, arrow when off-screen),
// and the status pill.
export function CompassView({ overlay, aligned, videoRef, camOn }) {
  const marker = overlay.marker
  return (
    <div className={'view' + (aligned ? ' ok' : '') + (camOn ? ' cam' : '')}>
      <video
        ref={videoRef}
        className={'cam' + (camOn ? '' : ' hidden')}
        playsInline
        muted
      />

      <div className={'cross' + (aligned ? ' ok' : '')}>
        <i className="cv t" />
        <i className="cv b" />
        <i className="ch l" />
        <i className="ch r" />
        <div className="ring" />
      </div>

      {marker && !marker.off && (
        <>
          <div
            className="halo"
            style={{
              left: marker.px + '%',
              top: marker.py + '%',
              background: `radial-gradient(circle,${marker.color}66,transparent 70%)`,
            }}
          />
          <div
            className="dot"
            style={{
              left: marker.px + '%',
              top: marker.py + '%',
              background: marker.color,
              boxShadow: '0 0 14px ' + marker.color,
            }}
          />
          <div
            className="marker-label"
            style={{ left: marker.px + '%', top: marker.py + '%', color: marker.color }}
          >
            银心
          </div>
        </>
      )}

      {marker && marker.off && (
        <>
          <div
            className="arrow"
            style={{
              left: marker.px + '%',
              top: marker.py + '%',
              color: marker.color,
              filter: 'drop-shadow(0 0 8px ' + marker.color + ')',
              transform: `translate(-50%,-50%) rotate(${marker.angle}deg)`,
            }}
          >
            ➤
          </div>
          <div
            className="marker-label"
            style={{ left: marker.px + '%', top: marker.py + '%', color: marker.color }}
          >
            银心在此方向
          </div>
        </>
      )}

      <div className={'status' + (aligned ? ' ok' : '')}>
        <span>{overlay.status}</span>
      </div>
    </div>
  )
}
