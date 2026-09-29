<script setup>
import { computed } from 'vue'
import { trip } from '@/composables/useTrip'
import { minusDays, weekdayOf } from '@/utils/helpers'

/**
 * 出发前待办清单：仅作示例提醒，不需要勾选。
 * 按「提前天数」倒序排列，截止日由 site.startDate 自动倒推。
 */
const items = computed(() => {
  const start = trip.site?.startDate
  return (trip.todo?.items ?? [])
    .map((item) => {
      const leadDays = Number(item.leadDays ?? 0)
      return {
        ...item,
        leadDays,
        deadline: start && leadDays ? minusDays(start, leadDays) : '',
      }
    })
    .sort((a, b) => b.leadDays - a.leadDays)
})

const startInfo = computed(() => {
  const start = trip.site?.startDate
  return start ? `${start}（${weekdayOf(start)}）出发` : ''
})
</script>

<template>
  <section id="todo">
    <h2 class="sec-title">
      <span class="bar" />{{ trip.todo.title }}
      <span class="day-note">{{ startInfo }}</span>
    </h2>

    <div class="todo-grid">
      <div v-for="item in items" :key="item.key" class="todo-card">
        <b>
          ⏰
          <template v-if="item.deadline">{{ item.deadline }} 前</template>
          <template v-else>出发前</template>
          <span v-if="item.leadDays" class="todo-lead">提前 {{ item.leadDays }} 天</span>
        </b>
        <span class="todo-text">{{ item.text }}</span>
      </div>
    </div>

    <p class="todo-note">
      💡 以上为示例提醒（不必逐项勾选），请按自己的节奏核实并安排；
      具体时间与价格请以官方渠道为准。
    </p>
  </section>
</template>
