import { ref } from 'vue'

export function useNotepadState() {
  const txt = ref('')
  const n = ref('')
  const pt = ref('')
  const ch = ref(0)
  const hst = ref([''])
  const idx = ref(0)

  const rec = (t) => {
    if (idx.value < hst.value.length - 1) hst.value = hst.value.slice(0, idx.value + 1)
    if (hst.value[idx.value] === t) return
    hst.value.push(t)
    idx.value++
  }

  const un = () => {
    if (idx.value > 0) {
      idx.value--
      txt.value = hst.value[idx.value]
      return true
    }
    return false
  }

  const re = () => {
    if (idx.value < hst.value.length - 1) {
      idx.value++
      txt.value = hst.value[idx.value]
      return true
    }
    return false
  }

  const reset = (content = '', name = '', path = '') => {
    txt.value = content
    n.value = name
    pt.value = path
    ch.value = 0
    hst.value = [content]
    idx.value = 0
  }

  return { txt, n, pt, ch, rec, un, re, reset }
}

