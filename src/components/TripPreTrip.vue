<script setup>
import { trip } from '@/composables/useTrip'
import { useEditMode } from '@/composables/useEditMode'
import EditableText from './EditableText.vue'

/**
 * 行程天气：按城市分段展示逐日预报。
 * 数据来自 trip.preTrip，可在编辑模式下直接改写。
 */
const { editing } = useEditMode()

/** 温度条：把当日温度区间映射到该城市整体区间，直观呈现冷暖 */
function barStyle(city) {
  const lows = city.days.map((d) => Number(d.low))
  const highs = city.days.map((d) => Number(d.high))
  return { min: Math.min(...lows), max: Math.max(...highs) }
}

function rangeStyle(city, day) {
  const { min, max } = barStyle(city)
  const span = Math.max(max - min, 1)
  const low = Number(day.low)
  const high = Number(day.high)
  return {
    left: `${((low - min) / span) * 100}%`,
    width: `${Math.max(((high - low) / span) * 100, 12)}%`,
  }
}

/** 降雨概率对应的提示强度 */
function rainLevel(rain) {
  const n = Number(rain) || 0
  if (n >= 60) return 'high'
  if (n >= 30) return 'mid'
  return 'low'
}
</script>

<template>
  <section id="pretrip">
    <h2 class="sec-title">
      <span class="bar" />🌤️ {{ trip.preTrip.title }}
    </h2>

    <div class="weather-grid">
      <article v-for="(city, ci) in trip.preTrip.cities" :key="ci" class="weather-card">
        <header class="weather-head">
          <span class="weather-city">
            {{ city.icon }}
            <EditableText v-model:value="city.city" :editing="editing" />
          </span>
          <span class="weather-range"><EditableText v-model:value="city.range" :editing="editing" /></span>
        </header>

        <p class="weather-summary"><EditableText v-model:value="city.summary" :editing="editing" /></p>

        <ul class="weather-days">
          <li v-for="(day, di) in city.days" :key="di" class="weather-day">
            <span class="wd-date">
              <EditableText v-model:value="day.date" :editing="editing" />
              <i v-if="day.weekday">{{ day.weekday }}</i>
            </span>

            <span class="wd-icon"><EditableText v-model:value="day.icon" :editing="editing" /></span>
            <span class="wd-desc"><EditableText v-model:value="day.desc" :editing="editing" /></span>

            <span class="wd-temp">
              <em>{{ day.low }}°</em>
              <span class="wd-bar" :aria-label="`${day.low} 到 ${day.high} 度`">
                <span class="wd-bar-fill" :style="rangeStyle(city, day)" />
              </span>
              <b>{{ day.high }}°</b>
            </span>

            <span class="wd-rain" :class="`rain-${rainLevel(day.rain)}`">
              {{ day.rain }}%
              <i>降雨</i>
            </span>
          </li>
        </ul>
      </article>
    </div>

    <div class="weather-notes">
      <div v-for="(note, ni) in trip.preTrip.notes" :key="ni" class="weather-note">
        <b>{{ note.icon }} <EditableText v-model:value="note.label" :editing="editing" /></b>
        <span><EditableText v-model:value="note.text" :editing="editing" /></span>
      </div>
    </div>

    <p class="weather-source">
      <EditableText v-model:value="trip.preTrip.source" :editing="editing" />
    </p>
  </section>
</template>
