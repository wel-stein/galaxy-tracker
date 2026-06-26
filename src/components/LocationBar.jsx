import { useState } from 'react'
import { ManualPanel } from './ManualPanel'

// Shared location strip used by the map and conditions tabs: shows the
// current coordinates (or a prompt), a re-locate button, and a collapsible
// manual-entry panel with city presets.
export function LocationBar({ geo }) {
  const [manualOpen, setManualOpen] = useState(false)
  const hasLoc = !!geo.loc

  return (
    <div className="locbar">
      <div className="locrow">
        <div className="locinfo">
          <div className="l">当前位置</div>
          <div className="v mono">
            {hasLoc
              ? geo.loc.lat.toFixed(3) + ', ' + geo.loc.lon.toFixed(3)
              : geo.slow
                ? '未获取 — 请手动设置'
                : '定位中…'}
          </div>
        </div>
        <button className="ghost" style={{ flex: 'none' }} onClick={geo.request}>
          重新定位
        </button>
        <button
          className="ghost"
          style={{ flex: 'none' }}
          onClick={() => setManualOpen((o) => !o)}
        >
          手动
        </button>
      </div>
      {geo.error && <p className="note">{geo.error}</p>}
      {(manualOpen || (geo.slow && !hasLoc)) && (
        <ManualPanel onApply={geo.setManual} />
      )}
    </div>
  )
}
