import { useState } from 'react'

function Line({ k, value, cls }) {
  return (
    <div className="ln">
      <span className="k">{k}</span>
      <span className={cls || ''}>{value}</span>
    </div>
  )
}

// The collapsible diagnostics panel mirroring the original app, useful for
// debugging permissions/sensors on a real phone.
export function Diagnostics({ secure, origin, geo, loc, perm, evt, src, headingPitch, error }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="diag">
      <div className="hd" onClick={() => setOpen((o) => !o)}>
        <span>诊断面板</span>
        <span>{open ? '收起 ▾' : '展开 ▸'}</span>
      </div>
      {open && (
        <div className="body">
          <Line k="安全上下文 HTTPS" value={secure.text} cls={secure.cls} />
          <Line k="来源 origin" value={origin.text} cls={origin.cls} />
          <Line k="定位 Geolocation" value={geo.text} cls={geo.cls} />
          <Line k="坐标 lat,lon" value={loc.text} cls={loc.cls} />
          <Line k="方向权限 API" value={perm.text} cls={perm.cls} />
          <Line k="方向事件计数" value={evt.text} cls={evt.cls} />
          <Line k="朝向来源" value={src} />
          <Line k="heading / beta" value={headingPitch} />
          <Line k="最近错误" value={error.text} cls={error.cls} />
        </div>
      )}
    </div>
  )
}
