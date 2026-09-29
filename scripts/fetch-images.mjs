#!/usr/bin/env node
/**
 * 图片本地化：把 trip.json 引用的远程图片下载到 public/images/，并改写成本地路径。
 *
 * 设计说明：
 *   本机网络依赖代理（127.0.0.1:7890），而 Node 的 fetch 不使用系统代理，
 *   直接下载会失败；PowerShell 的 Invoke-WebRequest 会走系统代理。
 *   因此由 Node 负责并发调度，每张图起一个 PowerShell 进程下载。
 *
 * 用法：
 *   npm run fetch-images              # 只下载缺失的
 *   npm run fetch-images -- --force   # 全部重新下载
 *   npm run fetch-images -- -c 6      # 并发数（默认 6）
 *   npm run fetch-images -- --only d5 # 只处理文件名含 d5 的
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tripPath = resolve(root, 'src/data/trip.json')
const outDir = resolve(root, 'public/images')
const oneScript = resolve(root, 'scripts/download-one.ps1')

const args = process.argv.slice(2)
const force = args.includes('--force')
const cIdx = args.indexOf('-c')
const CONCURRENCY = cIdx !== -1 ? Number(args[cIdx + 1]) || 6 : 6
const oIdx = args.indexOf('--only')
const only = oIdx !== -1 ? args[oIdx + 1] : null

/** 景点名 -> 英文短名，生成可读文件名 */
const SLUGS = {
  '关西国际机场 T1': 'kansai-airport-t1',
  '宜必思大阪梅田酒店（Check-in）': 'ibis-osaka-umeda',
  '大阪天满宫': 'osaka-tenmangu',
  '大阪城（天守阁）': 'osaka-castle',
  '天神桥筋商店街 或 黑门市场（午餐）': 'kuromon-market',
  '难波八坂神社（可选）': 'namba-yasaka-shrine',
  '心斋桥（逛街 + Harbs 蛋糕）': 'shinsaibashi',
  '道顿堀（晚餐+夜景）': 'dotonbori',
  '清水寺': 'kiyomizu-dera',
  '八坂神社': 'yasaka-shrine',
  '祇园 · 花见小路（午餐）': 'gion-hanami-koji',
  '伏见稻荷大社': 'fushimi-inari',
  '岚山小火车（龟冈 → 嵯峨野）': 'sagano-romantic-train',
  '天龙寺（曹源池庭园）': 'tenryu-ji',
  '竹林小径': 'arashiyama-bamboo',
  '金阁寺（鹿苑寺）': 'kinkaku-ji',
  '京都站八条口（夜行巴士集合）': 'kyoto-station-hachijo',
  '新宿 Busta 3F（夜巴抵达）': 'shinjuku-busta',
  '东京晴空塔（天望甲板/回廊）': 'tokyo-skytree',
  '隅田公园（晴空塔合影）': 'sumida-park',
  '浅草寺 · 雷门 · 仲见世': 'senso-ji-asakusa',
  '上野公园 · 阿美横町': 'ueno-park',
  '秋叶原（采购 + 女仆咖啡）': 'akihabara',
  '东京站 · 丸之内站舍': 'tokyo-station-marunouchi',
  '皇居外苑 · 二重桥': 'imperial-palace',
  '明治神宫': 'meiji-jingu',
  '代代木公园': 'yoyogi-park',
  '涩谷（十字路口 + SHIBUYA SKY）': 'shibuya-crossing',
  '新宿御苑（秋色散步）': 'shinjuku-gyoen',
  '原宿 · 表参道': 'harajuku-omotesando',
  '池袋（补购物/乙女路）': 'ikebukuro',
  '羽田机场 T3（值机 + 免税购物）': 'haneda-airport-t3',
}

const pad = (n) => String(n).padStart(2, '0')
const isLocal = (p) => p.startsWith('/images/')
const hasFile = (p) => existsSync(p) && statSync(p).size > 1024

/** 为一天里的景点图片规划本地文件名 */
function planDay(day, di) {
  const plan = []
  ;(day.slots ?? []).forEach((slot, si) => {
    const photos = slot.photos ?? []
    if (!photos.length) return
    const slug = SLUGS[slot.name] || `slot-${pad(si + 1)}`
    const base = `d${di + 1}-${pad(si + 1)}-${slug}`

    const targets = photos.map((url, pi) => {
      if (isLocal(url)) return { url: null, file: url.replace('/images/', '') }
      let ext = '.jpg'
      try {
        const raw = extname(new URL(url).pathname.split('?')[0]).toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(raw)) ext = raw
      } catch { /* 默认 .jpg */ }
      const file = photos.length > 1 ? `${base}-${pi + 1}${ext}` : `${base}${ext}`
      return { url, file }
    })
    plan.push({ slot, targets })
  })
  return plan
}

/** 用 PowerShell 下载一张图（走系统代理），返回 { ok, bytes|error } */
function fetchOne(url, dest) {
  return new Promise((resolvePromise) => {
    execFile(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', oneScript, '-Url', url, '-Dest', dest],
      { maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        const out = String(stdout || '').trim()
        if (!err && out.startsWith('OK')) {
          resolvePromise({ ok: true, bytes: Number(out.slice(2).trim()) || 0 })
        } else {
          resolvePromise({ ok: false, error: (out || err?.message || 'unknown').slice(0, 100) })
        }
      }
    )
  })
}

async function main() {
  const data = JSON.parse(readFileSync(tripPath, 'utf8'))
  mkdirSync(outDir, { recursive: true })

  // 1) 规划任务（过滤掉已存在的）
  const plans = (data.days ?? []).map((day, di) => planDay(day, di))
  const tasks = []
  for (const dayPlan of plans) {
    for (const { slot, targets } of dayPlan) {
      for (const t of targets) {
        if (!t.url) continue
        if (only && !t.file.includes(only)) continue
        const dest = resolve(outDir, t.file)
        if (!force && hasFile(dest)) continue
        tasks.push({ ...t, dest, slot: slot.name })
      }
    }
  }

  console.log(`待下载 ${tasks.length} 张，并发 ${CONCURRENCY}`)

  // 2) 并发下载（Node 控制并发，每张一个 PowerShell 进程）
  const results = []
  let cursor = 0
  let done = 0
  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor]
      cursor += 1
      const r = await fetchOne(task.url, task.dest)
      done += 1
      const tag = r.ok ? 'OK  ' : 'FAIL'
      console.log(`[${done}/${tasks.length}] ${tag} ${task.file}${r.ok ? `  ${(r.bytes / 1024).toFixed(0)}KB` : `  (${r.error})`}`)
      results.push({ ...task, ...r })
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker))

  // 3) 回写 trip.json：有本地文件的换本地路径，否则保留远程
  let localCount = 0
  const stillRemote = []
  const usedFiles = []
  for (const dayPlan of plans) {
    for (const { slot, targets } of dayPlan) {
      slot.photos = targets.map((t) => {
        const file = t.file
        const dest = resolve(outDir, file)
        if (isLocal(t.file)) { localCount += 1; usedFiles.push(file); return `/images/${file}` }
        if (hasFile(dest)) {
          localCount += 1
          usedFiles.push(file)
          return `/images/${file}`
        }
        stillRemote.push(`${slot.name}: ${t.url}`)
        return t.url
      })
    }
  }
  writeFileSync(tripPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

  const okCount = results.filter((r) => r.ok).length
  const failList = results.filter((r) => !r.ok)
  writeFileSync(
    resolve(root, 'image-report.txt'),
    [
      `本次下载：成功 ${okCount} / 失败 ${failList.length}（待下载 ${tasks.length}）`,
      `本地图片总数：${localCount} 张`,
      `仍为远程地址：${stillRemote.length} 条`,
      '',
      ...(failList.length ? ['--- 下载失败 ---', ...failList.map((f) => `${f.file}  ${f.error}`), ''] : []),
      ...(stillRemote.length ? ['--- 保留远程 ---', ...stillRemote, ''] : []),
      '--- 本地图片清单 ---',
      ...[...new Set(usedFiles)].sort(),
      '',
    ].join('\n'),
    'utf8'
  )

  console.log(`\n完成：本次成功 ${okCount} / 失败 ${failList.length}；本地图片共 ${localCount} 张，仍远程 ${stillRemote.length} 条`)
  console.log('明细见 image-report.txt')
}

main().catch((err) => {
  console.error('执行失败：', err)
  process.exit(1)
})
