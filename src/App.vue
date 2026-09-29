<script setup>
import { onBeforeUnmount, watch } from 'vue'
import { trip, addDay, removeDay, resetToDefault, hasLocalDraft } from '@/composables/useTrip'
import { useEditMode, useToast, showToast, askOk } from '@/composables/useEditMode'

import TripHeader from '@/components/TripHeader.vue'
import TripTodo from '@/components/TripTodo.vue'
import TripPreTrip from '@/components/TripPreTrip.vue'
import TripFlights from '@/components/TripFlights.vue'
import TripHotels from '@/components/TripHotels.vue'
import TripMap from '@/components/TripMap.vue'
import DayCard from '@/components/DayCard.vue'
import TripTips from '@/components/TripTips.vue'

const { editing, toggle, label } = useEditMode()
const { toastMessage } = useToast()

/** 全局样式以 body.edit-mode 为开关，这里把响应式状态同步到 body 上 */
watch(
  editing,
  (on) => document.body.classList.toggle('edit-mode', on),
  { immediate: true }
)
onBeforeUnmount(() => document.body.classList.remove('edit-mode'))

function onAddDay() {
  addDay()
  showToast('已添加一天，可编辑日期与主题')
}

function onRemoveDay(day) {
  removeDay(day.key)
  showToast('已删除该天')
}

/** 清除本地草稿，恢复 src/data/trip.json 里的内置内容 */
function onReset() {
  if (!askOk('恢复内置数据？本机浏览器上的所有编辑改动将丢失。')) return
  resetToDefault()
  showToast('已恢复内置数据')
}
</script>

<template>
  <TripHeader />

  <main class="wrap">
    <TripTodo />
    <TripPreTrip />
    <TripFlights />
    <TripHotels />

    <section>
      <div class="disclaimer">
        <b>⚠️ 免责声明：</b>{{ trip.site.disclaimer }}
      </div>
    </section>

    <!-- 地图：显示全部景点连线 -->
    <TripMap />

    <section>
      <h2 class="sec-title"><span class="bar" />📅 每日行程</h2>
      <div id="timeline">
        <DayCard
          v-for="(day, i) in trip.days"
          :key="day.key"
          :day="day"
          :index="i"
          :dining="day.dining || []"
          :extras="day.extras || []"
          :tips="day.tips || []"
          @remove="onRemoveDay(day)"
          @update:dining="(list) => (day.dining = list)"
          @update:extras="(list) => (day.extras = list)"
          @update:tips="(list) => (day.tips = list)"
        />
      </div>
      <button v-if="editing" class="add-day" @click="onAddDay">＋ 添加一天（新日程）</button>
    </section>

    <TripTips />
  </main>

  <footer>
    <p>{{ trip.site.footer }}</p>
    <p class="day-note">Vue 3 + Vite · 数据源：src/data/trip.json</p>
    <button v-if="hasLocalDraft" class="reset-btn" @click="onReset">↺ 恢复内置数据（清除本机编辑）</button>
  </footer>

  <!-- 浮动编辑工具 -->
  <div class="editbar">
    <button id="btn-edit" @click="toggle">{{ label }}</button>
  </div>

  <Transition name="fade">
    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </Transition>
</template>
