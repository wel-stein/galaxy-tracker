# 寻找银河中心 · Galaxy Tracker

An AR-style phone compass that points you toward the **Galactic Center**
(Sagittarius A\*, roughly R.A. 17ʰ45ᵐ / Dec −29°) — the brightest core of the
Milky Way in the constellation Sagittarius.

Hold up your phone and turn until the golden crosshair lands in the center;
you are then facing the Galactic Center. An optional camera background turns it
into a live AR finder.

This is a React port of the original single-file prototype, restructured into
composable hooks and components.

## How it works

- **Geolocation** gives your latitude/longitude.
- **Device orientation** gives the phone's compass heading and pitch (using
  iOS `webkitCompassHeading` when available, otherwise the `alpha`/`beta`
  angles, with the iOS 13+ permission prompt handled).
- Every animation frame, the Galactic Center's fixed equatorial coordinates are
  converted to local **horizontal coordinates** (azimuth + altitude) for your
  position and the current time, then compared against where the phone points to
  drive the on-screen marker and "found it" alignment state.

## Requirements

The motion/orientation and camera sensors only work over **HTTPS** in a real
mobile browser (full-screen, not an in-app preview). Open the deployed URL
directly on a phone. A built-in diagnostics panel reports the state of each
permission/sensor. If geolocation is blocked you can enter coordinates manually.

## Development

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  main.jsx                  app entry
  App.jsx                   start flow + hook wiring
  styles.css                ported styles
  lib/
    astronomy.js            JD/GMST + equatorial→horizontal math
    compass.js              per-frame overlay / status computation
  hooks/
    useGeolocation.js       Geolocation API + manual override
    useDeviceOrientation.js DeviceOrientation API + iOS permission
    useCamera.js            rear-camera stream for the AR background
    useAnimationFrame.js    requestAnimationFrame render loop
  components/
    Intro.jsx               landing screen
    LiveView.jsx            active compass screen
    CompassView.jsx         viewport, crosshair, marker, status
    Stats.jsx               target azimuth/altitude + heading readouts
    ManualPanel.jsx         manual lat/lon entry
    Diagnostics.jsx         collapsible sensor/permission panel
```
