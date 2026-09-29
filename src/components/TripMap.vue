<script setup>
import { computed, onMounted, watch } from 'vue'
import { trip } from '@/composables/useTrip'
import { useTravelMap } from '@/composables/useTravelMap'

const { mapEl, render, tileStatus, tileSourceName, nextTileSource } = useTravelMap()

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

    <div class="map-toolbar">
      <span class="map-status" :class="`map-status--${tileStatus}`">
        <i class="map-dot" />
        <template v-if="tileStatus === 'loading'">地图加载中…</template>
        <template v-else-if="tileStatus === 'ok'">底图：{{ tileSourceName }}</template>
        <template v-else>底图加载失败，请检查网络或代理</template>
      </span>
      <button class="map-switch" type="button" @click="nextTileSource">
        🔄 切换底图
      </button>
    </div>

    <div ref="mapEl" id="map" />

    <div v-if="!points.length" class="map-fallback">
      🗺️ 暂无带坐标的景点，可在编辑模式下用「📍」为景点设置坐标
    </div>

    <p v-if="tileStatus === 'failed'" class="map-hint">
      💡 当前网络无法加载地图瓦片（本页底图来自境外服务）。
      行程文字与景点列表不受影响；可点「🔄 切换底图」换其他源，
      或稍后重试（若使用代理，请确认代理正常工作）。
    </p>
  </section>
</template>
