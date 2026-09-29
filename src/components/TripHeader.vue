<script setup>
import { computed } from 'vue'
import { trip } from '@/composables/useTrip'
import { minusDays, weekdayOf } from '@/utils/helpers'

/** 页头：标题 + 出发前待办清单（勾选状态存 localStorage） */
const CHECK_KEY = 'travel-plan:checklist:v2'

const checklist = computed(() => {
  const items = trip.todo?.items ?? []
  const start = trip.site?.startDate
  return items
    .map((item) => {
      const leadDays = Number(item.leadDays ?? 0)
      const deadline = start && leadDays ? minusDays(start, leadDays) : ''
      return { ...item, leadDays, deadline }
    })
    // 截止日更早的排在前面
    .sort((a, b) => b.leadDays - a.leadDays)
})

function loadChecked() {
  try {
    return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}')
  } catch {
    return {}
  }
}

const checked = import.meta.env.SSR ? {} : loadChecked()

function toggle(key) {
  checked[key] = !checked[key]
  try {
    localStorage.setItem(CHECK_KEY, JSON.stringify(checked))
  } catch (error) {
    console.warn('[trip] 待办状态写入失败：', error)
  }
}

const doneCount = computed(() => checklist.value.filter((i) => checked[i.key]).length)
const startWeekday = computed(() => weekdayOf(trip.site?.startDate))
</script>

<template>
  <header class="hero">
    <div class="kicker">{{ trip.site.kicker }}</div>
    <h1>{{ trip.site.title }}</h1>
    <p class="sub">{{ trip.site.sub }}</p>
    <span class="jpy-note">{{ trip.site.jpyNote }}</span>

    <div class="checklist-card">
      <h2>{{ trip.todo.title }}</h2>
      <ul class="pretrip-todo">
        <li v-for="item in checklist" :key="item.key" class="todo-item" :class="{ done: checked[item.key] }">
          <input
            type="checkbox"
            :checked="!!checked[item.key]"
            @change="toggle(item.key)"
          >
          <span v-if="item.deadline" class="todo-deadline">{{ item.deadline }}前</span>
          <span class="todo-text">{{ item.text }}</span>
        </li>
      </ul>
      <span class="todo-progress">已完成 {{ doneCount }} / {{ checklist.length }}</span>
      <span class="day-note">（{{ trip.site.startDate }} 出发 · {{ startWeekday }}）</span>
    </div>

    <div class="ed-hint">
      ✏️ 编辑模式：点文字直接改 / 点图片改图集（可多张）/ 拖拽或 ▲▼ 调序 /
      ＋ 添加景点、＋ 添加一天 / 「＋ 页签」加提示或备忘<br>
      改动会自动保存在本机浏览器；想分享或永久保留，请编辑仓库里的
      <code>src/data/trip.json</code>。
    </div>
  </header>
</template>
