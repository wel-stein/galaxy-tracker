import { useState } from 'react'
import { TabBar } from './components/TabBar'
import { CompassFeature } from './components/features/CompassFeature'
import { LightPollutionFeature } from './components/features/LightPollutionFeature'
import { ConditionsFeature } from './components/features/ConditionsFeature'
import { useGeolocation } from './hooks/useGeolocation'

export default function App() {
  const [tab, setTab] = useState('compass')
  // Location is shared across all three tools.
  const geo = useGeolocation()

  return (
    <div className="app">
      <main className="wrap">
        {tab === 'compass' && <CompassFeature geo={geo} />}
        {tab === 'map' && <LightPollutionFeature geo={geo} />}
        {tab === 'conditions' && <ConditionsFeature geo={geo} />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
