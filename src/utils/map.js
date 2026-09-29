import { escapeHtml } from '@/utils/helpers'

/**
 * 地图链接工具：根据经纬度生成导航链接。
 * 行程坐标均为日本境内的 WGS-84，无需大陆坐标系转换。
 */

/** 是否位于中国大陆境内（用于决定推荐哪个地图 App） */
export function isInChina(lat, lng) {
  return lng >= 72.004 && lng <= 137.8347 && lat >= 0.8293 && lat <= 55.8271
}

/** 系统导航链接（iOS 用 Apple 地图，其余用 geo: 协议） */
export function buildNavLink(lat, lng, label) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/iPhone|iPad|iPod/.test(ua)) {
    return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`
  }
  return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`
}

/** 第三方地图 App 链接（国内只给高德，国外额外给 Google） */
export function buildMapAppLinks(lat, lng, label) {
  const amap = {
    label: '高德地图',
    url: `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(label)}&coordinate=wgs84&callnative=1&src=travel-plan`,
  }
  const google = {
    label: 'Google 地图',
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`,
  }
  return isInChina(lat, lng) ? [amap] : [google, amap]
}

/** 组装标注弹窗的 HTML */
export function buildPopupHtml(index, point) {
  const links = [
    { label: '导航', url: buildNavLink(point.lat, point.lng, point.name) },
    ...buildMapAppLinks(point.lat, point.lng, point.name),
  ]
  const timeLine = point.time ? `${escapeHtml(point.time)}<br>` : ''
  const anchors = links
    .map((l) => `<a href="${l.url}">${escapeHtml(l.label)}</a>`)
    .join(' · ')
  return `<b>${index}. ${escapeHtml(point.name)}</b><br>${timeLine}${anchors}`
}
