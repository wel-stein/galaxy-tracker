// Same-origin proxy for the light-pollution overlay tiles: NASA GIBS "Earth at
// Night" (VIIRS Black Marble). Serving from our own origin means:
//   1. the client can draw a tile to <canvas> and read pixel brightness
//      without cross-origin canvas taint, and
//   2. the exact upstream URL (image format in particular) is resolved here,
//      where there is real network access, rather than guessed in the client.
//
// GIBS WMTS uses {z}/{y}/{x} (TileMatrix/TileRow/TileCol) order; the client
// passes standard z, x (col), y (row).

const BASE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble' +
  '/default/2016-01-01/GoogleMapsCompatible_Level8'

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

  // Try the documented formats; whichever the layer actually serves wins.
  for (const [ext, type] of [
    ['png', 'image/png'],
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
  ]) {
    try {
      const upstream = await fetch(`${BASE}/${z}/${y}/${x}.${ext}`)
      if (upstream.ok) {
        const buf = Buffer.from(await upstream.arrayBuffer())
        res.setHeader('Content-Type', upstream.headers.get('content-type') || type)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000')
        res.status(200).send(buf)
        return
      }
    } catch {
      // try next format
    }
  }
  // No tile in any format (out of coverage / upstream down).
  res.status(204).end()
}
