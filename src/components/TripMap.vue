<script setup>
import { computed, onMounted, watch } from 'vue'
import { trip } from '@/composables/useTrip'
import { useTravelMap } from '@/composables/useTravelMap'

const { mapEl, render } = useTravelMap()

/** 扁平化所有景点，按天/景点顺序生成地图点位 */
const points = computed(() =>
  trip.days.flatMap((day) =>
    (day.slots || [])
      .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
      .map((s) => ({
        name: s.name,
        time: [day.date, s.time].filter(Boolean).join(' · '),
        lat: s.lat,
        lng: s.lng,
      }))
  )
)

const totalSlots = computed(() => trip.days.reduce((sum, d) => sum + (d.slots?.length ?? 0), 0))

onMounted(() => {
  if (points.value.length) render(points.value)
})

/** 编辑增删景点、调序、改坐标后自动重绘 */
watch(
  points,
  (next) => {
    if (next.length) render(next)
  },
  { deep: true }
)
</script>

<template>
  <section>
    <h2 class="sec-title">
      <span class="bar" />🗺️ 行程地图（点击标记查看导航）
      <span class="day-note">共 {{ points.length }} 个点位 · {{ totalSlots }} 个景点</span>
    </h2>
    <div ref="mapEl" id="map" />
    <div v-if="!points.length" class="map-fallback">
      🗺️ 暂无带坐标的景点，可在编辑模式下用「📍」为景点设置坐标
    </div>
  </section>
</template>
