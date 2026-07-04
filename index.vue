<template>
  <div class="m" @touchstart="ts" @touchend="te">
    <MenuBar 
      :filename="n" 
      :hasChanges="ch" 
      :syntaxOn="h_e" 
      @action="handleAction"
      @toggle-syntax="toggleSyntax"
      @replace="handleReplace"
    />

    <main v-if="!br" class="w">
      <div ref="ed" class="editor" contenteditable="true" @input="onIn" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
    </main>

    <FileBrowser 
      v-else 
      :saveMode="sm" 
      :currentName="n"
      :currentPath="pt"
      @close="br = 0"
      @file-selected="openFile"
      @save-confirm="executeSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { FsService } from './lib/fs.js'
import { useNotepadState } from './composables/useNotepadState.js'
import MenuBar from './components/MenuBar.vue'
import FileBrowser from './components/FileBrowser.vue'

const { txt, n, pt, ch, rec, un, re, reset } = useNotepadState()
const br = ref(0), sm = ref(0), h_e = ref(0), ed = ref(null)
let t_x = 0, t_y = 0

const ts = e => { t_x = e.touches[0].clientX; t_y = e.touches[0].clientY }
const te = e => {
  if (br.value) return
  let dx = e.changedTouches[0].clientX - t_x, dy = e.changedTouches[0].clientY - t_y
  if (Math.abs(dx) > 60 && Math.abs(dy) < 30) { if (dx > 0) handleUndo(); else handleRedo() }
}

const hl = t => {
  if (!t) return ''
  let a = [], o = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  o = o.replace(/(\/\/.*)/g, x => { a.push(`<span class="cmt">${x}</span>`); return `__T${a.length - 1}__` })
  o = o.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, x => { a.push(`<span class="str">${x}</span>`); return `__T${a.length - 1}__` })
  o = o.replace(/\b(const|let|var|function|return|if|else|for|import|from|true|false|null|class|export|default)\b/g, '<span class="kw">$&</span>')
  o = o.replace(/\b(\d+)\b/g, '<span class="num">$&</span>')
  for (let i = 0; i < a.length; i++) o = o.replace(`__T${i}__`, a[i])
  return o
}

const getCaret = x => {
  let s = window.getSelection(); if (!s.rangeCount) return 0
  let r = s.getRangeAt(0), p = r.cloneRange()
  p.selectNodeContents(x); p.setEnd(r.endContainer, r.endOffset)
  return p.toString().length
}

const setCaret = (x, p) => {
  let r = document.createRange(), s = window.getSelection(), cl = 0, fnd = 0
  const tv = n => {
    if (fnd) return
    if (n.nodeType === 3) {
      if (cl + n.length >= p) { r.setStart(n, p - cl); r.setEnd(n, p - cl); fnd = 1 } else cl += n.length
    } else for (let i = 0; i < n.childNodes.length; i++) tv(n.childNodes[i])
  }
  tv(x)
  if (!fnd) { r.setStart(x, x.childNodes.length); r.setEnd(x, x.childNodes.length) }
  s.removeAllRanges(); s.addRange(r)
}

const onIn = e => {
  ch.value = 1; txt.value = ed.value.innerText
  if (!e || (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo')) rec(txt.value)
  if (h_e.value) r_h()
}

const r_h = () => nextTick(() => {
  if (!ed.value) return
  if (h_e.value) { const p = getCaret(ed.value); ed.value.innerHTML = hl(txt.value); setCaret(ed.value, p) }
  else ed.value.innerText = txt.value
})

const handleUndo = () => { if (un()) r_h() }
const handleRedo = () => { if (re()) r_h() }
const toggleSyntax = () => { h_e.value = !h_e.value; r_h() }

const handleAction = (type) => {
  if (type === 'new') { if (ch.value && !confirm('Discard?')) return; reset(); r_h() }
  if (type === 'open') { sm.value = 0; br.value = 1 }
  if (type === 'save') { if (pt.value) { executeSave(pt.value.split('/').slice(0, -1).join('/'), n.value) } else { sm.value = 1; br.value = 1 } }
  if (type === 'saveas') { sm.value = 1; br.value = 1 }
  if (type === 'close') { if (ch.value && !confirm('Discard?')) return; reset(); r_h() }
  if (type === 'undo') handleUndo()
  if (type === 'redo') handleRedo()
  if (type === 'clearall') { txt.value = ''; ch.value = 1; rec(''); r_h() }
  if (type === 'selectall') { const r = document.createRange(); r.selectNodeContents(ed.value); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r) }
  if (type === 'copy') { handleAction('selectall'); document.execCommand('copy') }
  if (type === 'paste') { navigator.clipboard.readText().then(c => { if(c) { txt.value = c; ch.value = 1; rec(c); r_h() } }).catch(()=>{}) }
  if (type === 'delete') {
    if (!pt.value) return alert('No file loaded')
    if (confirm('Delete permanently?')) FsService.delete(pt.value).then(() => { reset(); r_h() })
  }
}

const openFile = (fullPath, filename) => {
  FsService.read(fullPath).then(c => {
    reset(c, filename, fullPath)
    br.value = 0
    r_h()
  })
}

const executeSave = (dir, filename) => {
  const targetPath = dir ? `${dir}/${filename}` : filename
  FsService.write(targetPath, txt.value).then(() => {
    pt.value = targetPath
    n.value = filename
    ch.value = 0
    br.value = 0
  })
}

const handleReplace = ({ find, replace }) => {
  txt.value = txt.value.replaceAll(find, replace)
  ch.value = 1
  rec(txt.value)
  r_h()
}

onMounted(() => { reset(); r_h() })
</script>

<style scoped>
.m{background:#121212;color:#e0e0e0;font-family:monospace;min-height:100vh;display:flex;flex-direction:column;box-sizing:border-box;}
:deep(.h){display:flex;align-items:center;background:#16161a;border-bottom:1px solid #24242e;height:40px;padding:0 0.5rem;}
:deep(.b-g){display:flex;gap:0.25rem;}
:deep(.b){background:#1f1f2e;border:1px solid #2e2e3f;color:#f1f5f9;padding:0.25rem 0.5rem;font-size:0.8rem;cursor:pointer;font-family:monospace;}
:deep(.b:active){background:#2e2e3f;}
:deep(.t){flex:1;font-size:0.8rem;text-align:right;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.w{flex:1;display:flex;background:#0f0f11;position:relative;overflow:hidden;}
.editor{width:100%;height:100%;position:absolute;top:0;left:0;margin:0;padding:12px;box-sizing:border-box;font-family:monospace!important;font-size:14px!important;line-height:22px!important;border:none;outline:none;white-space:pre-wrap!important;word-break:break-all!important;overflow:auto!important;tab-size:2;background:#0f0f11;color:#f8fafc;}

:deep(.kw){color:#ff79c6;font-weight:bold;}
:deep(.str){color:#f1fa8c;}
:deep(.num){color:#bd93f9;}
:deep(.cmt){color:#6272a4;font-style:italic;}

:deep(.d){position:fixed;top:40px;left:0;width:100vw;height:100vh;z-index:100;}
:deep(.c){background:#16161a;border:1px solid #24242e;display:flex;flex-direction:column;width:140px;box-shadow:0 4px 10px rgba(0,0,0,0.5);}
:deep(.c button){background:transparent;border:none;color:#cbd5e1;text-align:left;padding:0.5rem;font-size:0.85rem;cursor:pointer;font-family:monospace;}
:deep(.c button:active){background:#1f1f2e;}
:deep(.c button.danger-btn){color:#ef4444;}

:deep(.s){display:flex;flex-direction:column;gap:0.4rem;padding:0.5rem;background:#16161a;border-bottom:1px solid #24242e;}
:deep(.s input){background:#0f0f11;color:#fff;border:1px solid #24242e;padding:0.35rem;font-size:0.85rem;outline:none;font-family:monospace;}
:deep(.s-g){display:flex;gap:0.25rem;justify-content:flex-end;}
:deep(.s-btn){background:#1f1f2e;color:#34d399;border-color:#34d399;}
:deep(.c-btn){background:#1f1f2e;color:#cf6679;border-color:#cf6679;}

:deep(.o){position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0f0f11;display:flex;flex-direction:column;z-index:200;}
:deep(.l){list-style:none;padding:0;margin:0;flex:1;overflow-y:auto;}
:deep(.i){padding:0.5rem;border-bottom:1px solid #16161a;cursor:pointer;font-size:0.85rem;}
:deep(.u){color:#38bdf8;} :deep(.fld){color:#38bdf8;} :deep(.fle){color:#34d399;}
</style>

