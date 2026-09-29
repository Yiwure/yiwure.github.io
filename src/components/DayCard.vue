<script setup>
import { computed, ref } from 'vue'
import {
  addExtra,
  addSlot,
  moveSlot,
  removeExtra,
  removeSlot,
  resolveTabs,
} from '@/composables/useTrip'
import { askOk, showToast, useEditMode } from '@/composables/useEditMode'
import { weekdayOf } from '@/utils/helpers'
import EditableText from './EditableText.vue'
import SlotCard from './SlotCard.vue'

const props = defineProps({
  day: { type: Object, required: true },
  index: { type: Number, required: true },
  dining: { type: Array, default: () => [] },
  extras: { type: Array, default: () => [] },
  tips: { type: Array, default: () => [] },
  editing: { type: Boolean, default: false },
})

const emit = defineEmits(['remove', 'update:dining', 'update:extras', 'update:tips'])

const { editing } = useEditMode()
const activeTab = ref('tips')
const draggingIndex = ref(-1)

const weekday = computed(() => props.day.weekday || weekdayOf(props.day.date))

/** 页签定义与顺序：复用状态层逻辑，避免重复实现 */
const tabs = computed(() => resolveTabs(props.day))

/** 当前页签：若被删除则回退到第一个 */
const currentTab = computed(() =>
  tabs.value.some((t) => t.key === activeTab.value) ? activeTab.value : tabs.value[0]?.key
)

/* ---------------- 页签增删 ---------------- */

function onAddExtraTab() {
  const created = addExtra(props.day.key)
  if (!created) return
  activeTab.value = `ex${props.extras.length - 1}`
  showToast('已新增页签：点标题/内容直接改写文字')
}

function onRemoveExtraTab(key) {
  if (!askOk('删除该页签？')) return
  const index = Number(/^ex(\d+)$/.exec(key)?.[1])
  if (Number.isNaN(index)) return
  removeExtra(props.day.key, index)
  activeTab.value = 'tips'
  showToast('页签已删除')
}

/* ---------------- 景点增删排序 ---------------- */

function onAddSlot() {
  addSlot(props.day.key)
  showToast('已添加景点：可点图片配图、📍 设地图坐标')
}

function onRemoveSlot(i) {
  if (!askOk('删除这个景点？')) return
  removeSlot(props.day.key, props.day.slots[i].key)
  showToast('已删除该景点')
}

function onMoveSlot(from, to) {
  moveSlot(props.day.key, from, to)
}

function onDragStart(i) {
  draggingIndex.value = i
}

function onDrop(i) {
  if (draggingIndex.value === -1 || draggingIndex.value === i) return
  onMoveSlot(draggingIndex.value, i)
  draggingIndex.value = -1
}

function onRemoveDay() {
  if (!askOk('删除这一整天？（其中所有景点都会移除）')) return
  emit('remove')
  showToast('已删除该天')
}

/* ---------------- 提示行 ---------------- */

function updateTip(i, value) {
  const list = [...props.tips]
  list[i] = value
  emit('update:tips', list)
}

function addTip() {
  emit('update:tips', [...props.tips, '点击编辑本日提示…'])
}

function removeTip(i) {
  emit('update:tips', props.tips.filter((_, k) => k !== i))
}

/* ---------------- 美食 ---------------- */

function cloneDining() {
  return props.dining.map((d) => ({ ...d, items: (d.items || []).map((it) => ({ ...it })) }))
}

function updateDining(i, key, value) {
  const list = cloneDining()
  list[i][key] = value
  emit('update:dining', list)
}

function updateDiningItem(di, ii, key, value) {
  const list = cloneDining()
  list[di].items[ii][key] = value
  emit('update:dining', list)
}

function addDiningItem(di) {
  const list = cloneDining()
  list[di].items.push({ name: '新菜品', price: '¥0' })
  emit('update:dining', list)
}

function removeDiningItem(di, ii) {
  const list = cloneDining()
  list[di].items.splice(ii, 1)
  emit('update:dining', list)
}
</script>

<template>
  <div class="day-card">
    <div class="day-head">
      <span class="day-date">
        Day {{ index + 1 }} · <EditableText v-model:value="day.date" :editing="editing" />
      </span>
      <span class="day-week">{{ weekday }}</span>
      <button v-if="editing" class="day-del" title="删除这一天" @click="onRemoveDay">🗑 删</button>
    </div>

    <div class="day-theme"><EditableText v-model:value="day.theme" :editing="editing" /></div>

    <!-- 页签栏 -->
    <div class="day-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="day-tab"
        :class="{ active: currentTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.icon }} {{ tab.label }}
        <span
          v-if="editing && tab.key.startsWith('ex')"
          class="tab-del"
          title="删除此页签"
          @click.stop="onRemoveExtraTab(tab.key)"
        >✕</span>
      </button>
      <button v-if="editing" class="tab-add-btn" title="新增信息页签" @click="onAddExtraTab">＋ 页签</button>
    </div>

    <!-- 页签内容 -->
    <div class="day-panels">
      <div v-if="currentTab === 'tips'" class="day-panel active">
        <div class="day-tips">
          <b>💡 当日提示</b>
          <div v-for="(tip, i) in tips" :key="i" class="tip-row">
            · <EditableText :value="tip" :editing="editing" @update:value="(v) => updateTip(i, v)" />
            <button v-if="editing" class="tab-del" title="删除该行" @click="removeTip(i)">✕</button>
          </div>
          <button v-if="editing" class="tab-add-btn" @click="addTip">＋ 提示</button>
        </div>
      </div>

      <div
        v-for="(extra, i) in extras"
        v-show="currentTab === `ex${i}`"
        :key="`ex${i}`"
        class="day-panel active"
      >
        <div class="alternatives">
          <b>
            <EditableText v-model:value="extra.icon" :editing="editing" />
            <EditableText v-model:value="extra.title" :editing="editing" />
          </b>
          <p v-for="(line, j) in extra.lines" :key="j" class="tip-row">
            ·
            <EditableText
              :value="line"
              :editing="editing"
              @update:value="(v) => {
                const list = extras.map((e, k) => k === i ? { ...e, lines: e.lines.map((l, m) => m === j ? v : l) } : e)
                emit('update:extras', list)
              }"
            />
            <button
              v-if="editing"
              class="tab-del"
              title="删除该行"
              @click="emit('update:extras', extras.map((e, k) => k === i ? { ...e, lines: e.lines.filter((_, m) => m !== j) } : e))"
            >✕</button>
          </p>
          <button
            v-if="editing"
            class="tab-add-btn"
            @click="emit('update:extras', extras.map((e, k) => k === i ? { ...e, lines: [...e.lines, '新增一行…'] } : e))"
          >＋ 一行</button>
        </div>
      </div>

      <div v-if="currentTab === 'food'" class="day-panel active">
        <div class="day-tips">
          <b>🍽️ 美食推荐</b>
          <div v-for="(d, di) in dining" :key="di" class="dining">
            <div class="meal"><EditableText v-model:value="d.meal" :editing="editing" /></div>
            <div class="place"><EditableText v-model:value="d.place" :editing="editing" /></div>
            <div v-if="d.hours" class="hours"><EditableText v-model:value="d.hours" :editing="editing" /></div>
            <ul>
              <li v-for="(it, ii) in d.items || []" :key="ii">
                <EditableText :value="it.name" :editing="editing" @update:value="(v) => updateDiningItem(di, ii, 'name', v)" />
                <span><EditableText :value="it.price" :editing="editing" @update:value="(v) => updateDiningItem(di, ii, 'price', v)" /></span>
                <button v-if="editing" class="tab-del" title="删除" @click="removeDiningItem(di, ii)">✕</button>
              </li>
            </ul>
            <button v-if="editing" class="tab-add-btn" @click="addDiningItem(di)">＋ 菜品</button>
          </div>
          <div v-if="!dining.length" class="day-note">暂无美食记录</div>
        </div>
      </div>
    </div>

    <!-- 景点网格 -->
    <div class="slots-grid">
      <SlotCard
        v-for="(slot, i) in day.slots"
        :key="slot.key || i"
        :slot="slot"
        :index="i"
        :total="day.slots.length"
        @move-up="onMoveSlot(i, i - 1)"
        @move-down="onMoveSlot(i, i + 1)"
        @remove="onRemoveSlot(i)"
        @drag-start="onDragStart"
        @drop="onDrop"
      />
    </div>

    <button v-if="editing" class="add-slot" @click="onAddSlot">＋ 添加景点</button>
  </div>
</template>
