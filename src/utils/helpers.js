/** 通用工具函数 */

/** 转义 HTML，避免用户编辑内容破坏结构 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 'YYYY-MM-DD' -> Date（本地时区，避免 UTC 偏移） */
export function parseDate(iso) {
  const parts = String(iso ?? '').split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function weekdayOf(iso) {
  const date = parseDate(iso)
  return date ? WEEKDAYS[date.getDay()] : ''
}

/** Date -> 'YYYY-MM-DD' */
export function formatDate(date) {
  if (!date) return ''
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** 基准日期往前推 n 天，返回 'YYYY-MM-DD' */
export function minusDays(iso, n) {
  const date = parseDate(iso)
  if (!date) return null
  date.setDate(date.getDate() - Number(n || 0))
  return formatDate(date)
}

/** 时段 -> 图标 + 文案 */
export const PERIOD_LABELS = {
  morning: '☀️ 上午',
  noon: '🌤️ 中午/下午',
  afternoon: '🌤️ 中午/下午',
  evening: '🌙 晚上',
}

export function periodLabel(period) {
  return PERIOD_LABELS[period] || PERIOD_LABELS.afternoon
}

/** 生成唯一 id（用于新增景点/日程时做 key） */
let seq = 0
export function uid(prefix = 'id') {
  seq += 1
  return `${prefix}_${Date.now().toString(36)}_${seq}`
}
