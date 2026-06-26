import { useState } from 'react'
import { Intro } from './components/Intro'
import { LiveView } from './components/LiveView'
import { useGeolocation } from './hooks/useGeolocation'
import { useDeviceOrientation } from './hooks/useDeviceOrientation'
import { useCamera } from './hooks/useCamera'

export default function App() {
  const [started, setStarted] = useState(false)
  const geo = useGeolocation()
  const orient = useDeviceOrientation()
  const camera = useCamera()

  // The permission requests must run inside the user-gesture handler
  // (iOS requires this for DeviceOrientationEvent.requestPermission).
  const onStart = () => {
    if (started) return
    setStarted(true)
    geo.request()
    orient.request()
  }

  return (
    <div className="wrap">
      {started ? (
        <LiveView geo={geo} orient={orient} camera={camera} />
      ) : (
        <Intro onStart={onStart} />
      )}
    </div>
  )
}
