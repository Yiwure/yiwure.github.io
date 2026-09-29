import { computed, ref } from 'vue'

/**
 * 编辑模式状态：全局单例。
 * 编辑态下，页面上带 [data-path] 的文本节点变为 contenteditable，
 * 由 TripApp 统一通过 bindEditable 绑定输入事件把内容写回数据。
 */
const editing = ref(false)

export function useEditMode() {
  const toggle = () => {
    editing.value = !editing.value
  }

  const label = computed(() => (editing.value ? '✓ 完成' : '✏️ 编辑'))

  return { editing, toggle, label }
}

/** 安全输入：环境不支持 prompt/confirm 时优雅降级，不中断页面 */
export function ask(message, defaultValue = '') {
  try {
    return window.prompt(message, defaultValue)
  } catch {
    window.alert?.('当前环境不支持输入框，请直接编辑 src/data/trip.json')
    return null
  }
}

export function askOk(message) {
  try {
    return window.confirm(message)
  } catch {
    return true
  }
}

/** 轻量提示条 */
const toastMessage = ref('')
let toastTimer = null

export function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2400)
}

export function useToast() {
  return { toastMessage }
}
