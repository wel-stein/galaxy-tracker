import { useState } from 'react'
import { Intro } from '../Intro'
import { LiveView } from '../LiveView'
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation'
import { useCamera } from '../../hooks/useCamera'

// Feature 3 — 手机方位找银河. Owns the orientation/camera sensors so they are
// released when the user navigates away from this tab. Location is shared
// from the app level.
export function CompassFeature({ geo }) {
  const [started, setStarted] = useState(false)
  const orient = useDeviceOrientation()
  const camera = useCamera()

  // Permission requests must run inside the user-gesture handler (iOS).
  const onStart = () => {
    if (started) return
    setStarted(true)
    if (!geo.loc) geo.request()
    orient.request()
  }

  return started ? (
    <LiveView geo={geo} orient={orient} camera={camera} />
  ) : (
    <Intro onStart={onStart} />
  )
}
