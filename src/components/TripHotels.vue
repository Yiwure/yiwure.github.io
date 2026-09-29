<script setup>
import { trip } from '@/composables/useTrip'
import { useEditMode } from '@/composables/useEditMode'
import EditableText from './EditableText.vue'

/**
 * 酒店：按入住顺序展示
 * 结构 = 日期（入住/退房）→ 位置 → 当天注意事项
 */
const { editing } = useEditMode()

/** 每张卡的序号，方便和行程对照 */
function addNote(area) {
  if (!Array.isArray(area.notes)) area.notes = []
  area.notes.push('新增一条注意事项…')
}

function removeNote(area, i) {
  area.notes.splice(i, 1)
}
</script>

<template>
  <section id="hotels">
    <h2 class="sec-title">
      <span class="bar" />🏨 {{ trip.hotels.title }}
      <span class="day-note">共 {{ trip.hotels.areas.length }} 家 · 依次换住</span>
    </h2>

    <div class="stay-list">
      <article v-for="(h, hi) in trip.hotels.areas" :key="hi" class="stay-card">
        <!-- 1) 日期：入住 / 退房 / 晚数 -->
        <header class="stay-dates">
          <span class="stay-seq">{{ hi + 1 }}</span>
          <span class="stay-date">
            <b><EditableText v-model:value="h.checkIn" :editing="editing" /></b>
            <i>入住</i>
          </span>
          <span class="stay-arrow">→</span>
          <span class="stay-date">
            <b><EditableText v-model:value="h.checkOut" :editing="editing" /></b>
            <i>退房</i>
          </span>
          <span class="stay-nights"><EditableText v-model:value="h.nights" :editing="editing" /></span>
        </header>

        <!-- 2) 位置 -->
        <div class="stay-body">
          <div class="stay-name">
            <span class="stay-city">
              {{ h.icon }} <EditableText v-model:value="h.city" :editing="editing" />
            </span>
            <span class="stay-tier">{{ h.tier }}</span>
            <span class="stay-price"><EditableText v-model:value="h.priceRange" :editing="editing" /></span>
          </div>
          <div class="stay-hotel"><EditableText v-model:value="h.name" :editing="editing" /></div>
          <div class="stay-loc">
            <span class="stay-loc-icon">📍</span>
            <EditableText v-model:value="h.location" :editing="editing" />
          </div>

          <!-- 3) 当天的注意事项 -->
          <div class="stay-notes">
            <b class="stay-notes-title">📌 注意事项</b>
            <ul>
              <li v-for="(note, ni) in h.notes || []" :key="ni">
                <EditableText
                  :value="note"
                  :editing="editing"
                  @update:value="(v) => {
                    const list = [...(h.notes || [])]
                    list[ni] = v
                    h.notes = list
                  }"
                />
                <button v-if="editing" class="tab-del" title="删除该条" @click="removeNote(h, ni)">✕</button>
              </li>
            </ul>
            <button v-if="editing" class="tab-add-btn" @click="addNote(h)">＋ 注意事项</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
