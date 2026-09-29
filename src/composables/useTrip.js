import { computed, reactive, watch } from 'vue'
import rawTrip from '@/data/trip.json'
import { uid } from '@/utils/helpers'

const STORAGE_KEY = 'travel-plan:trip-data:v2'

/** 深拷贝，确保运行时数据与打包进来的原始 JSON 解耦 */
function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

/** 为每天/每个景点补齐稳定的 key，供 Vue 列表渲染与就地编辑使用 */
function withKeys(source) {
  const data = clone(source)
  data.days = (data.days ?? []).map((day) => ({
    ...day,
    key: day.key || uid('day'),
    slots: (day.slots ?? []).map((slot) => ({ ...slot, key: slot.key || uid('slot') })),
  }))
  return data
}

function loadInitial() {
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) return withKeys(JSON.parse(cached))
    } catch (error) {
      console.warn('[trip] 本地草稿解析失败，已回退到内置数据：', error)
    }
  }
  return withKeys(rawTrip)
}

/** 全局唯一的行程数据（reactive，模板可直接读写） */
export const trip = reactive(loadInitial())

/** 去掉运行时 key 后的纯净数据，用于「是否被改动过」的比较 */
function stripKeys(value) {
  const data = clone(value)
  for (const day of data.days ?? []) {
    delete day.key
    for (const slot of day.slots ?? []) delete slot.key
  }
  return data
}

/** 是否为「用户改动过的本地草稿」（用于页脚提示与恢复按钮） */
export const hasLocalDraft = computed(
  () => JSON.stringify(stripKeys(trip)) !== JSON.stringify(stripKeys(rawTrip))
)

/** 持久化：编辑后自动写入 localStorage（防抖，避免频繁写盘） */
let persistTimer = null
if (typeof localStorage !== 'undefined') {
  watch(
    () => JSON.stringify(trip),
    (serialized) => {
      clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, serialized)
        } catch (error) {
          console.warn('[trip] 本地草稿写入失败（可能超出配额）：', error)
        }
      }, 300)
    }
  )
}

/* ------------------------------------------------------------------ *
 * 数据操作：所有增删改都走这里，组件不直接改数组
 * ------------------------------------------------------------------ */

/** 清除本地草稿，恢复到 src/data/trip.json 的内置内容 */
export function resetToDefault() {
  const fresh = withKeys(rawTrip)
  Object.keys(trip).forEach((k) => delete trip[k])
  Object.assign(trip, fresh)
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
}
/** 新增一天 */
export function addDay(day = {}) {
  const full = {
    key: uid('day'),
    date: '',
    theme: '新的一天 · 点击编辑主题',
    tips: ['点击编辑本日提示…'],
    slots: [],
    ...day,
  }
  if (!full.slots) full.slots = []
  trip.days.push(full)
  return full
}

export function removeDay(dayKey) {
  const i = trip.days.findIndex((d) => d.key === dayKey)
  if (i !== -1) trip.days.splice(i, 1)
}

/** 新增景点（可继承同日上一个景点的坐标，避免地图缺点位） */
export function addSlot(dayKey, slot = {}) {
  const day = trip.days.find((d) => d.key === dayKey)
  if (!day) return null

  const previous = day.slots[day.slots.length - 1]
  const full = {
    key: uid('slot'),
    period: 'afternoon',
    name: '新景点',
    time: '时间待定',
    review: '点击编辑点评…',
    rating: 4,
    pins: [],
    photos: [],
    ...slot,
  }
  if (full.lat == null && previous?.lat != null) {
    full.lat = previous.lat
    full.lng = previous.lng
  }
  day.slots.push(full)
  return full
}

export function removeSlot(dayKey, slotKey) {
  const day = trip.days.find((d) => d.key === dayKey)
  if (!day) return
  const i = day.slots.findIndex((s) => s.key === slotKey)
  if (i !== -1) day.slots.splice(i, 1)
}

/** 景点排序：上移 / 下移 / 拖拽落位 */
export function moveSlot(dayKey, fromIndex, toIndex) {
  const day = trip.days.find((d) => d.key === dayKey)
  if (!day) return
  if (toIndex < 0 || toIndex >= day.slots.length) return
  const [moved] = day.slots.splice(fromIndex, 1)
  day.slots.splice(toIndex, 0, moved)
}

/** 给某天追加一个自定义页签（攻略/备忘），可自由增删 */
export function addExtra(dayKey, extra = {}) {
  const day = trip.days.find((d) => d.key === dayKey)
  if (!day) return null
  if (!Array.isArray(day.extras)) day.extras = []
  const full = { icon: '📌', title: '新页签', lines: ['点击编辑内容…'], ...extra }
  day.extras.push(full)
  // tabs 记录页签顺序：tips 固定在前，自定义页签按添加顺序，food 在最后
  const order = day.tabs && day.tabs.length ? day.tabs.slice() : ['tips', 'food']
  order.splice(Math.max(order.length - 1, 0), 0, `ex${day.extras.length - 1}`)
  day.tabs = order
  return full
}

export function removeExtra(dayKey, index) {
  const day = trip.days.find((d) => d.key === dayKey)
  if (!day || !Array.isArray(day.extras)) return
  day.extras.splice(index, 1)
  // 重排 tabs，并同步其它 ex* 页签的下标
  day.tabs = (day.tabs || [])
    .filter((t) => t !== `ex${index}`)
    .map((t) => {
      const m = /^ex(\d+)$/.exec(t)
      if (!m) return t
      const n = Number(m[1])
      return n > index ? `ex${n - 1}` : t
    })
}

/** 按 day.tabs 的顺序输出该天的页签定义（供模板渲染） */
export function resolveTabs(day) {
  const defs = []
  if (day.tips && day.tips.length) defs.push({ key: 'tips', icon: '💡', label: '当日提示' })
  ;(day.extras ?? []).forEach((extra, i) =>
    defs.push({ key: `ex${i}`, icon: extra.icon || '📌', label: extra.title || `备忘 ${i + 1}` })
  )
  if (day.dining && day.dining.length) defs.push({ key: 'food', icon: '🍽️', label: '美食' })

  const order = day.tabs && day.tabs.length ? day.tabs : defs.map((d) => d.key)
  return defs.sort((a, b) => {
    const ai = order.indexOf(a.key)
    const bi = order.indexOf(b.key)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

/** 收集地图点位：按天/景点顺序展开，只取有坐标的 */
export function collectMapPoints() {
  const points = []
  for (const day of trip.days) {
    for (const slot of day.slots || []) {
      if (typeof slot.lat === 'number' && typeof slot.lng === 'number') {
        points.push({
          name: slot.name,
          time: [day.theme, slot.time].filter(Boolean).join(' · '),
          lat: slot.lat,
          lng: slot.lng,
        })
      }
    }
  }
  return points
}
