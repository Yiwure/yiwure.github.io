<script setup>
/**
 * 可编辑文本：编辑模式下 contenteditable，
 * 输入失焦/回车时把纯文本回写到数据（v-model:value + update:value）。
 */
const props = defineProps({
  value: { type: [String, Number], default: '' },
  editing: { type: Boolean, default: false },
  tag: { type: String, default: 'span' },
  placeholder: { type: String, default: '点击编辑…' },
  multiline: { type: Boolean, default: true },
})

const emit = defineEmits(['update:value'])

function commit(event) {
  const text = event.target.innerText.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
  emit('update:value', text === props.placeholder ? '' : text)
}

function onKeydown(event) {
  if (!props.multiline && event.key === 'Enter') {
    event.preventDefault()
    event.target.blur()
  }
}
</script>

<template>
  <component
    :is="tag"
    class="editable"
    :class="{ 'editable--on': editing }"
    :contenteditable="editing ? 'true' : 'false'"
    spellcheck="false"
    @blur="editing && commit($event)"
    @keydown="onKeydown"
    v-text="value || (editing ? placeholder : '')"
  />
</template>
