// Same-origin proxy for the light-pollution overlay tile under an inspected
// point. Fetches NASA GIBS "Earth at Night" (VIIRS Black Marble) server-side
// and re-serves it from our origin, so the client can draw it to a <canvas>
// and read pixel brightness without any cross-origin canvas-taint risk.
//
// GIBS WMTS uses {z}/{y}/{x} (TileMatrix/TileRow/TileCol) order; the client
// passes standard z, x (col), y (row).

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

  const url =
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble' +
    `/default/2016-01-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.png`

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) {
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
