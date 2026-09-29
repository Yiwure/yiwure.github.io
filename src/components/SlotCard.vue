<script setup>
import { computed, ref } from 'vue'
import { useEditMode, ask, showToast } from '@/composables/useEditMode'
import { periodLabel } from '@/utils/helpers'
import EditableText from './EditableText.vue'

const props = defineProps({
  slot: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
})

const emit = defineEmits(['move-up', 'move-down', 'remove', 'drag-start', 'drop'])

const { editing } = useEditMode()
const dragging = ref(false)
const imageLoaded = ref(false)

const periodText = computed(() => periodLabel(props.slot.period))

/** 图集：过滤空值；有图时 CSS 会隐藏占位文字，避免小字压在图上看不清 */
const gallery = computed(() => (props.slot.photos || []).filter(Boolean))
const mainImage = computed(() => gallery.value[0])
const thumbs = computed(() => gallery.value.slice(1))

/** 编辑图集：多行输入，每行一个图片地址 */
function editPhotos() {
  if (!editing.value) return
  const next = ask(
    `图片地址（每行一个，可放多张；全部删空则不显示图片）：\n${props.slot.name}`,
    gallery.value.join('\n')
  )
  if (next === null) return
  const list = next
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  imageLoaded.value = false
  props.slot.photos = list
  showToast(list.length ? `已设置 ${list.length} 张图片` : '已清空图片')
}

/** 编辑坐标：写回数据后地图会自动重绘 */
function editPosition() {
  if (!editing.value) return
  const lat = ask('纬度 lat（如 35.6812）：', String(props.slot.lat ?? ''))
  if (lat === null) return
  const lng = ask('经度 lng（如 139.7671）：', String(props.slot.lng ?? ''))
  if (lng === null) return
  const nLat = Number.parseFloat(lat)
  const nLng = Number.parseFloat(lng)
  if (Number.isNaN(nLat) || Number.isNaN(nLng)) {
    showToast('坐标格式不正确')
    return
  }
  props.slot.lat = nLat
  props.slot.lng = nLng
  showToast('✅ 坐标已设置，地图已更新')
}

/** 编辑带链接的提示条地址 */
function editPinUrl(i, current) {
  if (!editing.value || !current) return
  const next = ask('链接地址（留空则取消链接）：', current)
  if (next === null) return
  const url = next.trim()
  const urls = [...(props.slot.pinUrls || [])]
  urls[i] = url
  props.slot.pinUrls = urls
}

function onKeydown(i, url, event) {
  if (!editing.value || !url) return
  if (event.key === 'Enter') {
    event.preventDefault()
    editPinUrl(i, url)
  }
}
</script>

<template>
  <div
    class="slot"
    :class="{ 'sortable-dragging': dragging }"
    :draggable="editing ? 'true' : 'false'"
    @dragstart="dragging = true; emit('drag-start', index)"
    @dragend="dragging = false"
    @dragover.prevent
    @drop.prevent="emit('drop', index)"
  >
    <button v-if="editing" class="del-slot" title="删除此景点" @click="emit('remove')">✕</button>

    <!-- 图集：有图显示照片，无图/加载失败时回退为居中占位字（两者互斥，不叠加） -->
    <div class="ph" :class="{ 'has-img': imageLoaded }" @click="editPhotos">
      <span class="ph-name">{{ slot.name }}</span>
      <img
        v-if="mainImage"
        :src="mainImage"
        :alt="slot.name"
        loading="lazy"
        @load="imageLoaded = true"
        @error="imageLoaded = false"
      >
      <div v-if="thumbs.length" class="ph-thumbs">
        <img
          v-for="(url, i) in thumbs"
          :key="i"
          :src="url"
          :alt="`${slot.name} 图 ${i + 2}`"
          loading="lazy"
          @error="$event.target.remove()"
        >
      </div>
    </div>

    <!-- 编辑工具条：拖动 / 上下移 / 设坐标 -->
    <div v-if="editing" class="slot-tools">
      <span class="drag-handle" title="拖动排序">⠿</span>
      <button class="mv-btn mv-up" title="上移" :disabled="index === 0" @click="emit('move-up')">▲</button>
      <button class="mv-btn mv-down" title="下移" :disabled="index === total - 1" @click="emit('move-down')">▼</button>
      <button class="mv-btn set-pos" title="设置地图坐标" @click="editPosition">📍 坐标</button>
    </div>

    <div class="body">
      <div class="nm"><EditableText v-model:value="slot.name" :editing="editing" /></div>
      <div class="tm">{{ periodText }} · <EditableText v-model:value="slot.time" :editing="editing" /></div>
      <div class="rv"><EditableText v-model:value="slot.review" :editing="editing" /></div>
      <div v-if="slot.rating" class="rate">★ {{ slot.rating }}</div>

      <div class="pills">
        <span v-if="slot.openingHours" class="pill">
          🕘 <EditableText v-model:value="slot.openingHours" :editing="editing" />
        </span>
        <span v-if="slot.ticket" class="pill">
          🎫 <EditableText v-model:value="slot.ticket" :editing="editing" />
        </span>
        <component
          v-for="(pin, i) in slot.pins || []"
          :key="i"
          :is="(slot.pinUrls || [])[i] ? 'a' : 'span'"
          class="pill"
          :href="(slot.pinUrls || [])[i] || undefined"
          :target="(slot.pinUrls || [])[i] ? '_blank' : undefined"
          rel="noopener"
          @click="editing ? editPinUrl(i, (slot.pinUrls || [])[i]) : null"
          @keydown="onKeydown(i, (slot.pinUrls || [])[i], $event)"
        >
          <EditableText
            :value="pin"
            :editing="editing"
            @update:value="(v) => { const list = [...(slot.pins || [])]; list[i] = v; slot.pins = list }"
          />
        </component>
      </div>
    </div>
  </div>
</template>
