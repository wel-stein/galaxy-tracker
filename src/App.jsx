import { Suspense, lazy, useState } from 'react'
import { TabBar } from './components/TabBar'
import { CompassFeature } from './components/features/CompassFeature'
import { useGeolocation } from './hooks/useGeolocation'

// Code-split the heavier tabs (Leaflet, weather) so the default compass tab
// loads fast; they're fetched on first visit.
const LightPollutionFeature = lazy(() =>
  import('./components/features/LightPollutionFeature').then((m) => ({
    default: m.LightPollutionFeature,
  })),
)
const ConditionsFeature = lazy(() =>
  import('./components/features/ConditionsFeature').then((m) => ({
    default: m.ConditionsFeature,
  })),
)

export default function App() {
  const [tab, setTab] = useState('compass')
  // Location is shared across all three tools.
  const geo = useGeolocation()

  return (
    <div className="app">
      <main className="wrap">
        <Suspense fallback={<p className="fsub" style={{ paddingTop: 24 }}>加载中…</p>}>
          {tab === 'compass' && <CompassFeature geo={geo} />}
          {tab === 'map' && <LightPollutionFeature geo={geo} />}
          {tab === 'conditions' && <ConditionsFeature geo={geo} />}
        </Suspense>
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
