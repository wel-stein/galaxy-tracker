// Bortle dark-sky scale reference and the light-pollution overlay config.
//
// The overlay is David J. Lorenz's World Atlas of artificial night-sky
// brightness (2022), served as XYZ tiles from GitHub Pages (free, no key,
// CORS-enabled). Its color ramp maps to artificial-brightness ratios, which
// correspond closely to Bortle classes — so sampling the pixel color under a
// point gives an approximate Bortle reading.

export const LP_TILE_URL =
  'https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/tile_{z}_{x}_{y}.png'
export const LP_MAX_NATIVE_ZOOM = 8

// CartoDB dark base map fits the night theme (free, no key).
export const BASE_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const BASE_ATTRIB =
  '&copy; OpenStreetMap &copy; CARTO · 光污染数据 © D. Lorenz'

// The 9-class Bortle scale, each with the representative overlay color, a
// short name, and what the night sky looks like. `rgb` is used both for the
// legend swatch and for nearest-color matching when sampling the overlay.
export const BORTLE = [
  { cls: 1, rgb: [0, 0, 0], color: '#000000', name: '极佳暗空', desc: '银河投下阴影,黄道光明显' },
  { cls: 2, rgb: [40, 40, 40], color: '#283038', name: '真正暗空', desc: '银河结构丰富,M33 肉眼可见' },
  { cls: 3, rgb: [0, 64, 160], color: '#0040a0', name: '乡村天空', desc: '银河仍有结构,地平线有微光' },
  { cls: 4, rgb: [0, 128, 0], color: '#008000', name: '乡村/郊区过渡', desc: '银河较明显,光污染穹顶可见' },
  { cls: 4.5, rgb: [128, 192, 0], color: '#80c000', name: '郊区', desc: '银河苍白,仅头顶可见' },
  { cls: 5, rgb: [255, 255, 0], color: '#ffff00', name: '郊区天空', desc: '银河很弱或看不到' },
  { cls: 6, rgb: [255, 160, 0], color: '#ffa000', name: '亮郊区', desc: '银河不可见,M31 勉强可见' },
  { cls: 7, rgb: [255, 0, 0], color: '#ff0000', name: '城郊过渡', desc: '天空灰白,只有亮星' },
  { cls: 8, rgb: [255, 128, 192], color: '#ff80c0', name: '城市天空', desc: '天空泛光,星座难辨' },
  { cls: 9, rgb: [255, 255, 255], color: '#ffffff', name: '市中心', desc: '仅见月亮、行星和最亮的星' },
]

// Nearest-color match of a sampled RGBA pixel to a Bortle class. Returns null
// when the pixel is (near-)transparent — i.e. pristine sky with no overlay.
export function bortleFromPixel(r, g, b, a) {
  if (a < 20) return BORTLE[0] // transparent overlay = darkest skies
  let best = null
  let bestD = Infinity
  for (const item of BORTLE) {
    const [ir, ig, ib] = item.rgb
    const d = (r - ir) ** 2 + (g - ig) ** 2 + (b - ib) ** 2
    if (d < bestD) {
      bestD = d
      best = item
    }
  }
  return best
}
