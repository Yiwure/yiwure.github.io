import { onBeforeUnmount, ref, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildPopupHtml } from '@/utils/map'

/**
 * Leaflet 地图：把点位渲染成带导航链接的标注。
 *
 * 瓦片源按顺序自动回退：国内网络下 CARTO 可能被墙或极慢，
 * 因此准备多个源，某个源连续失败就自动切换到下一个。
 */
const TILE_SOURCES = [
  {
    name: 'CARTO Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
  {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    name: 'OSM 德国镜像',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    name: '高德地图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: '1234',
    attribution: '&copy; 高德地图',
    maxZoom: 18,
  },
]

/** 单个源连续失败多少次后切换（瓦片有多个时容易误判，给一定容错） */
const FAIL_THRESHOLD = 6

export function useTravelMap() {
  const mapEl = ref(null)
  const tileStatus = ref('loading') // loading | ok | failed
  const tileSourceName = ref('')

  const map = shallowRef(null)
  const layer = shallowRef(null)
  const tileLayer = shallowRef(null)

  let sourceIndex = 0
  let failCount = 0
  let lastPoints = []

  function addTileLayer() {
    if (!map.value) return
    const src = TILE_SOURCES[sourceIndex]
    tileSourceName.value = src.name

    if (tileLayer.value) {
      map.value.removeLayer(tileLayer.value)
      tileLayer.value = null
    }

    const tl = L.tileLayer(src.url, {
      attribution: src.attribution,
      maxZoom: src.maxZoom,
      subdomains: src.subdomains || 'abc',
      detectRetina: !src.subdomains,
      crossOrigin: true,
    })

    tl.on('tileload', () => {
      failCount = 0
      tileStatus.value = 'ok'
    })

    tl.on('tileerror', () => {
      failCount += 1
      if (failCount >= FAIL_THRESHOLD && sourceIndex < TILE_SOURCES.length - 1) {
        sourceIndex += 1
        failCount = 0
        addTileLayer()
      } else if (sourceIndex >= TILE_SOURCES.length - 1 && tileStatus.value !== 'ok') {
        tileStatus.value = 'failed'
      }
    })

    tl.addTo(map.value)
    tileLayer.value = tl
  }

  function ensureMap() {
    if (map.value || !mapEl.value) return map.value

    // 容器没有高度时 Leaflet 会渲染异常，兜底给一个高度
    if (!mapEl.value.style.minHeight) mapEl.value.style.minHeight = '320px'

    map.value = L.map(mapEl.value, {
      zoomControl: true,
      attributionControl: true,
      // 允许用滚轮缩放，但需要点击后聚焦，避免影响页面滚动
      scrollWheelZoom: 'center',
    })
    addTileLayer()
    layer.value = L.layerGroup().addTo(map.value)
    return map.value
  }

  function render(points) {
    lastPoints = points || []
    if (!ensureMap()) return
    layer.value.clearLayers()

    lastPoints.forEach((point, index) => {
      const icon = L.divIcon({
        className: 'route-pin',
        html: `<span class="route-pin__num">${index + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      L.marker([point.lat, point.lng], { icon })
        .addTo(layer.value)
        .bindPopup(buildPopupHtml(index + 1, point))
    })

    const coords = lastPoints.map((p) => [p.lat, p.lng])
    if (coords.length > 1) {
      L.polyline(coords, { dashArray: '6 8', weight: 2, color: '#c2402f' }).addTo(layer.value)
    }
    if (coords.length) {
      map.value.fitBounds(coords, { padding: [30, 30] })
    }
    requestAnimationFrame(() => map.value?.invalidateSize())
  }

  /** 手动切换下一个瓦片源（供 UI 按钮调用） */
  function nextTileSource() {
    if (sourceIndex < TILE_SOURCES.length - 1) sourceIndex += 1
    else sourceIndex = 0
    failCount = 0
    tileStatus.value = 'loading'
    addTileLayer()
  }

  const onResize = () => map.value?.invalidateSize()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
  }

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
    map.value?.remove()
    map.value = null
  })

  return { mapEl, render, tileStatus, tileSourceName, nextTileSource }
}
