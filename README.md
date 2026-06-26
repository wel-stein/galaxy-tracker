# 寻找银河中心 · Galaxy Tracker

A mobile-first Milky Way observing companion with three tools, in a bottom
tab bar:

1. **找银河 — AR compass** that points you toward the **Galactic Center**
   (Sagittarius A\*, ≈ R.A. 17ʰ45ᵐ / Dec −29°). Hold up your phone and turn
   until the golden crosshair lands in the center; an optional rear-camera
   background turns it into a live AR finder.
2. **光污染 — Light pollution map** (Leaflet): a CartoDB dark base map with the
   David Lorenz World Atlas light-pollution overlay. Centers on your location,
   and tapping anywhere reads the overlay color to estimate the **Bortle
   dark-sky class** (with a full legend).
3. **观测条件 — Observing conditions** ("Dark Sky"): tonight's **moon phase**
   and illumination, **sunset / civil / nautical / astronomical twilight**
   times, when the **Galactic Center culminates** and how high, and a
   **cloud-cover** forecast from Open-Meteo — combined into a one-line verdict.

This started as a React port of a single-file compass prototype and grew into
the three-tool app, organized into composable hooks and components.

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
  App.jsx                   tab state + shared geolocation
  styles.css                styles
  lib/
    astronomy.js            JD/GMST + equatorial→horizontal math
    compass.js              per-frame overlay / status computation
    sky.js                  sun position, twilight, moon phase
    bortle.js               Bortle scale + light-pollution tile config
  hooks/
    useGeolocation.js       Geolocation API (watchPosition) + manual override
    useDeviceOrientation.js DeviceOrientation API + iOS permission, true north
    useCamera.js            rear-camera stream for the AR background
    useAnimationFrame.js    requestAnimationFrame render loop
    useWeather.js           Open-Meteo cloud-cover fetch
  components/
    TabBar.jsx              bottom navigation
    LocationBar.jsx         shared location strip + manual entry
    Intro.jsx               compass landing screen
    LiveView.jsx            active compass screen
    CompassView.jsx         viewport, crosshair, marker, status
    Stats.jsx               target azimuth/altitude + heading readouts
    ManualPanel.jsx         manual lat/lon entry + city presets
    Diagnostics.jsx         collapsible sensor/permission panel
    features/
      CompassFeature.jsx        tab 1 — AR compass
      LightPollutionFeature.jsx tab 2 — Leaflet light-pollution map
      ConditionsFeature.jsx     tab 3 — observing conditions
```

## Data sources (all key-free)

- **Base map**: CartoDB dark tiles
- **Light pollution**: David Lorenz World Atlas 2022 overlay tiles
- **Cloud cover**: [Open-Meteo](https://open-meteo.com) (no API key, CORS-enabled)
- **Sun / moon / twilight**: computed in-browser (no network)
