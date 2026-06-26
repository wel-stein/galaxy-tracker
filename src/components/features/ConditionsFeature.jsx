import { useEffect, useMemo, useState } from 'react'
import { horiz, dir } from '../../lib/astronomy'
import { sunEvents, moonPhase } from '../../lib/sky'
import { useWeather, cloudCoverBetween } from '../../hooks/useWeather'
import { LocationBar } from '../LocationBar'

const fmtTime = (d) =>
  d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

// Sample the Galactic Center's altitude across the dark window to find when
// it culminates tonight — the best moment to look for the Milky Way core.
function gcTonight(lat, lon, from, to) {
  if (!from || !to) return null
  let best = { alt: -90, t: null, az: 0 }
  const span = to.getTime() - from.getTime()
  const steps = 96
  for (let i = 0; i <= steps; i++) {
    const t = new Date(from.getTime() + (i / steps) * span)
    const h = horiz(lat, lon, t)
    if (h.alt > best.alt) best = { alt: h.alt, t, az: h.az }
  }
  return best
}

function CloudBar({ cover }) {
  const color = cover < 30 ? '#7fe3d4' : cover < 70 ? '#ffce6b' : '#e88'
  return (
    <div className="cloudcol" title={cover + '%'}>
      <div className="cloudbar" style={{ height: Math.max(4, cover) + '%', background: color }} />
    </div>
  )
}

export function ConditionsFeature({ geo }) {
  const weather = useWeather(geo.loc)
  // Re-evaluate astronomy on mount and every few minutes.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const calc = useMemo(() => {
    if (!geo.loc) return null
    const { lat, lon } = geo.loc
    const events = sunEvents(lat, lon, now)
    const moon = moonPhase(now)
    const gcNow = horiz(lat, lon, now)
    const darkFrom = events.astro || events.sunset
    const darkTo = events.astroDawn || events.sunrise
    const gcBest = gcTonight(lat, lon, darkFrom, darkTo)
    return { lat, lon, events, moon, gcNow, gcBest, darkFrom, darkTo }
  }, [geo.loc, now])

  if (!geo.loc) {
    return (
      <div className="feature">
        <h2 className="ftitle">观测条件</h2>
        <p className="fsub">设置位置后查看今晚的月相、暮光时间与云量。</p>
        <LocationBar geo={geo} />
      </div>
    )
  }

  const { events, moon, gcNow, gcBest, darkFrom, darkTo } = calc
  const clouds =
    weather.status === 'ok'
      ? cloudCoverBetween(weather.data, darkFrom || now, darkTo || now)
      : []
  const avgCloud = clouds.length
    ? Math.round(clouds.reduce((s, c) => s + c.cover, 0) / clouds.length)
    : null
  const currentCloud = weather.data?.current?.cloud_cover

  // Overall verdict for tonight.
  const verdict = (() => {
    if (!events.astro) return { txt: '此纬度今晚无完整天文暗夜', cls: 'w' }
    if (moon.illum > 0.6) return { txt: '月光较强,深空观测受影响', cls: 'w' }
    if (avgCloud != null && avgCloud > 70) return { txt: '今晚多云,观测条件差', cls: 'r' }
    if (avgCloud != null && avgCloud < 30 && moon.illum < 0.4)
      return { txt: '今晚适合观测银河 ✦', cls: 'g' }
    return { txt: '观测条件一般', cls: '' }
  })()

  return (
    <div className="feature">
      <h2 className="ftitle">观测条件</h2>
      <p className="fsub">{geo.loc.lat.toFixed(2)}, {geo.loc.lon.toFixed(2)} · 今晚</p>

      <div className={'verdict ' + verdict.cls}>{verdict.txt}</div>

      <div className="cards">
        {/* Moon */}
        <div className="card">
          <div className="cardhd">月相</div>
          <div className="moonrow">
            <span className="moonemoji">{moon.emoji}</span>
            <div>
              <div className="moonname">{moon.name}</div>
              <div className="moonsub mono">
                {Math.round(moon.illum * 100)}% · {moon.waxing ? '盈' : '亏'} · 月龄 {moon.age.toFixed(1)} 天
              </div>
            </div>
          </div>
        </div>

        {/* Galactic Center tonight */}
        <div className="card">
          <div className="cardhd">银心今晚</div>
          {gcBest && gcBest.alt > 0 ? (
            <>
              <div className="big mono">{gcBest.alt.toFixed(0)}°</div>
              <div className="moonsub">
                最高于 {fmtTime(gcBest.t)} · {dir(gcBest.az)}方
              </div>
            </>
          ) : (
            <div className="moonsub">今晚银心不升出地平线</div>
          )}
          <div className="moonsub mono" style={{ marginTop: 6 }}>
            此刻 {gcNow.alt > 0 ? gcNow.alt.toFixed(0) + '° 地平线上' : '地平线下'}
          </div>
        </div>
      </div>

      {/* Twilight timeline */}
      <div className="card">
        <div className="cardhd">日落与暮光</div>
        <div className="twrows">
          <div className="twrow"><span>日落</span><span className="mono">{fmtTime(events.sunset)}</span></div>
          <div className="twrow"><span>民用暮光终 −6°</span><span className="mono">{fmtTime(events.civil)}</span></div>
          <div className="twrow"><span>航海暮光终 −12°</span><span className="mono">{fmtTime(events.nautical)}</span></div>
          <div className="twrow hl"><span>天文暗夜始 −18°</span><span className="mono">{fmtTime(events.astro)}</span></div>
          <div className="twrow hl"><span>天文暗夜终 −18°</span><span className="mono">{fmtTime(events.astroDawn)}</span></div>
          <div className="twrow"><span>日出</span><span className="mono">{fmtTime(events.sunrise)}</span></div>
        </div>
      </div>

      {/* Clouds */}
      <div className="card">
        <div className="cardhd">
          云量预报
          {currentCloud != null && (
            <span className="cardhd-r mono">此刻 {currentCloud}%</span>
          )}
        </div>
        {weather.status === 'loading' && <div className="moonsub">加载中…</div>}
        {weather.status === 'error' && <div className="moonsub rdim">{weather.error}</div>}
        {weather.status === 'ok' && clouds.length > 0 && (
          <>
            <div className="clouds">
              {clouds.map((c, i) => (
                <CloudBar key={i} cover={c.cover} />
              ))}
            </div>
            <div className="cloudaxis mono">
              <span>{fmtTime(clouds[0].t)}</span>
              <span>暗夜云量均值 {avgCloud}%</span>
              <span>{fmtTime(clouds[clouds.length - 1].t)}</span>
            </div>
          </>
        )}
        {weather.status === 'ok' && clouds.length === 0 && (
          <div className="moonsub">暂无该时段云量数据</div>
        )}
      </div>

      <LocationBar geo={geo} />
    </div>
  )
}
