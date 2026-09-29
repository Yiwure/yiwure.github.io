import { onBeforeUnmount, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildPopupHtml } from '@/utils/map'

/**
 * Leaflet 地图：把 collectMapPoints() 的结果渲染成带导航链接的标注。
 * 支持多个地图实例（首页大图 / 每日小图），互不干扰。
 */
export function useTravelMap() {
  const mapEl = ref(null)
  let map = null
  let layer = null

  function ensureMap() {
    if (map || !mapEl.value) return map
    map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
      detectRetina: true,
    }).addTo(map)
    layer = L.layerGroup().addTo(map)
    return map
  }

  function render(points) {
    if (!ensureMap()) return
    layer.clearLayers()

    points.forEach((point, index) => {
      const icon = L.divIcon({
        className: 'route-pin',
        html: `<span class="route-pin__num">${index + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      L.marker([point.lat, point.lng], { icon })
        .addTo(layer)
        .bindPopup(buildPopupHtml(index + 1, point))
    })

    const coords = points.map((p) => [p.lat, p.lng])
    if (coords.length > 1) {
      L.polyline(coords, { dashArray: '6 8', weight: 2, color: '#c2402f' }).addTo(layer)
    }
    if (coords.length) {
      map.fitBounds(coords, { padding: [30, 30] })
    }
    // 容器尺寸可能在挂载后才确定（移动端旋转等）
    requestAnimationFrame(() => map?.invalidateSize())
  }

  const onResize = () => map?.invalidateSize()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
  }

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
    map?.remove()
    map = null
  })

  return { mapEl, render }
}
