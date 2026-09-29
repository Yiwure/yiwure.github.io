# 日本 9.30–10.07 · 关西 × 东京 8 日旅行计划

一个可离线阅读、可在页面内直接编辑的旅行计划站点（Vue 3 + Vite），部署在 GitHub Pages。

> 内容由 AI（DeepSeek Harness / DeepSeek V4 Flash）基于公开资料整理，参考了
> [travel-plan-viz](https://github.com/zexuanw958-svg/travel-plan-viz) 的思路，**所有信息请以官方渠道核实**。

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物 http://localhost:4173
```

## 怎么改行程内容

**唯一数据源：`src/data/trip.json`**。改完保存，`npm run dev` 下页面会热更新。

```jsonc
{
  "site":     { "title": "...", "startDate": "2026-09-30", "disclaimer": "..." },
  "preTrip":  { "title": "...", "items": [{ "icon": "🌤️", "label": "天气", "text": "..." }] },
  "todo":     { "title": "...", "items": [{ "key": "vjw", "text": "...", "leadDays": 14 }] },
  "flights":  { "booked": [{ "code": "CX502", "label": "...", "time": "..." }] },
  "hotels":   { "title": "...", "areas": [{ "area": "📍 大阪 · 梅田", "reason": "...",
                "options": [{ "tier": "已预订", "name": "...", "priceRange": "...", "note": "..." }] }] },
  "tips":     { "title": "...", "items": ["..."] },

  "days": [{
    "date": "2026-09-30",           // 星期几与 Day N 编号由此自动计算
    "theme": "出发日 · 深圳 → 香港 → 大阪",
    "tips": ["提示一", "提示二"],     // 「当日提示」页签
    "extras": [                      // 自定义页签（可选，可多个）
      { "icon": "🔀", "title": "当日可选方案", "lines": ["方案 A …", "方案 B …"] }
    ],
    "tabs": ["tips", "ex0", "food"], // 页签顺序（可省略，默认 tips → extras → food）
    "slots": [{
      "period": "evening",           // morning / noon / afternoon / evening
      "name": "关西国际机场 T1",
      "time": "21:15 抵达",
      "lat": 34.4347, "lng": 135.2431,    // 有坐标即出现在地图，可省略
      "rating": 4.4,
      "review": "落地入境审查+取行李 …",
      "openingHours": "入境审查 24 小时",
      "ticket": "利木津巴士 ¥1,600",
      "pins": ["🚇 利木津巴士 · 约 55–75 分钟"],       // 卡片底部小标签
      "pinUrls": [null],                               // 与 pins 一一对应，给了 URL 即为可点链接
      "photos": ["https://…/a.jpg", "https://…/b.jpg"] // 首张为主图，其余为缩略图；留空则不显示图片
    }],
    "dining": [{ "meal": "🍽️ 晚餐", "place": "便利店补给", "hours": "营业：24 小时",
                 "items": [{ "name": "饭团+炸鸡", "price": "约 ¥600" }] }]
  }]
}
```

常用推算规则：

| 字段 | 说明 |
| --- | --- |
| `site.startDate` | 出发日；待办清单按 `leadDays` 自动倒推「截止日」并排序 |
| `days[].date` | `YYYY-MM-DD`；星期几、`Day N` 编号自动生成 |
| `todo.items[].leadDays` | 提前天数，越大截止日越早、排序越靠前 |
| `days[].extras` + `tabs` | 想加「交通备忘 / 注意事项」这类页签，加在 `extras` 并在 `tabs` 里列出 |

> 旧版单文件 HTML 保留在 `legacy/`，仅作参考，不再维护。

## 页面内编辑

右下角 **✏️ 编辑** 进入编辑模式：

- 点任何文字直接改写；点图片可粘贴**多个**图片地址（每行一个）
- 景点卡片支持 拖动 或 ▲▼ 调序、✕ 删除、**📍 坐标** 设置地图位置
- 「＋ 添加景点」「＋ 添加一天」「＋ 页签」随时增补内容

改动会**自动存到本机浏览器（localStorage）**，刷新不丢。页脚会提示「恢复内置数据」，点一下即可清除本地改动、回到 `src/data/trip.json` 的内容。

> 注意：页面内编辑只影响你自己的浏览器，**不会修改仓库文件**。要让所有人看到改动，请直接编辑 `src/data/trip.json` 并提交。

## 项目结构

```
index.html                   Vite 入口（极薄，仅挂载 #app）
vite.config.js               别名 @ → src，base '/'（用户站点根路径）
.github/workflows/deploy.yml 推送 main 后自动构建并发布到 Pages
src/
  main.js                    创建 Vue 应用
  App.vue                    页面骨架 + 编辑模式开关 + 恢复入口
  data/trip.json             ★ 唯一数据源
  styles/main.css            全局样式（和风配色、卡片、编辑态样式）
  utils/helpers.js           日期/文本/转义等纯函数
  utils/map.js               经纬度转换与地图外链生成
  composables/
    useTrip.js               行程数据 + localStorage 持久化 + 增删改操作
    useEditMode.js           编辑模式、提示条、安全输入框
    useTravelMap.js          Leaflet 地图实例（点位渲染、自适应）
  components/
    TripHeader.vue           标题 + 待办清单（勾选状态本地保存）
    TripPreTrip.vue          行前须知
    TripFlights.vue          航班
    TripHotels.vue           酒店
    TripMap.vue              地图区块
    DayCard.vue              单日卡片（页签 / 景点网格 / 美食）
    SlotCard.vue             单个景点卡片（图集 / 排序 / 坐标）
    TripTips.vue             全程贴士
    EditableText.vue         可编辑文本原子组件
scripts/extract-data.mjs     一次性迁移脚本（从旧版 HTML 抽数据）
legacy/                      旧版单文件 HTML（参考用）
```

## 部署

推送 `main` 分支后，GitHub Actions 会自动构建并发布 `dist/`。

首次部署需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**（只需设置一次）。

## 技术栈

Vue 3（`<script setup>`）· Vite 6 · Leaflet 1.9 · 无 UI 框架、无状态管理库（用 `reactive` + composable 保持轻量）
