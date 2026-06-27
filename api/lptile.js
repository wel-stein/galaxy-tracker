// Same-origin proxy for the light-pollution overlay tiles (David Lorenz World
// Atlas 2022, hosted on GitHub Pages). Serving the tile from our own origin
// means the client can draw it to a <canvas> and read pixel colors to
// estimate the Bortle class without running into cross-origin canvas taint —
// GitHub Pages does not reliably send CORS headers.
//
// Only used for the single tile under an inspected point; the map overlay
// itself is loaded directly (image display does not require CORS).

export default async function handler(req, res) {
  const z = parseInt(req.query.z, 10)
  const x = parseInt(req.query.x, 10)
  const y = parseInt(req.query.y, 10)

  // Validate to avoid being turned into an open proxy.
  if (
    ![z, x, y].every(Number.isInteger) ||
    z < 0 ||
    z > 8 ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  ) {
    res.status(400).json({ error: 'bad tile coordinates' })
    return
  }

  const url = `https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/tile_${z}_${x}_${y}.png`

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) {
      // No tile here (ocean / pristine sky). 204 → the <img> fires onerror,
      // which the client treats as darkest skies.
      res.status(204).end()
      return
    }
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000')
    res.status(200).send(buf)
  } catch (e) {
    res.status(502).json({ error: 'upstream fetch failed: ' + e.message })
  }
}
