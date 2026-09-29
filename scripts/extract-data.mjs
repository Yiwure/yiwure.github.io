/**
 * 一次性迁移脚本：从旧版单文件 index.html 中抽取 trip-data JSON，
 * 输出到 src/data/trip.json（作为 Vue 项目的唯一数据源）。
 *
 * 用法：node scripts/extract-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(root, 'index.html'), 'utf8')

const matched = html.match(/<script id="trip-data" type="application\/json">([\s\S]*?)<\/script>/)
if (!matched) throw new Error('未找到 <script id="trip-data">，请确认旧版 index.html 存在。')

const data = JSON.parse(matched[1])

// 清理运行时字段（旧版曾用 _sid 做 DOM/数据映射，新版不再需要）
for (const day of data.days ?? []) {
  delete day._sid
  for (const slot of day.slots ?? []) delete slot._sid
}

const outFile = resolve(root, 'src/data/trip.json')
mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

const slots = (data.days ?? []).reduce((n, d) => n + (d.slots?.length ?? 0), 0)
console.log(`✅ 已生成 src/data/trip.json`)
console.log(`   天数：${data.days?.length ?? 0}　景点：${slots}　贴士：${data.tips?.items?.length ?? 0}　待办：${data.todo?.items?.length ?? 0}`)
