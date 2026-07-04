<template>
  <div class="m" @touchstart="ts" @touchend="te">
    <div class="h">
      <div class="b-g">
        <button @click="u('m')" class="b">File</button>
        <button @click="u('e')" class="b">Edit</button>
        <button @click="v=!v" class="b">View</button>
      </div>
      <span class="t">{{n||'Untitled'}}<span v-if="ch">*</span></span>
    </div>

    <div v-if="m" class="d" @click="m=0"><div @click.stop class="c"><button @click="nw">New</button><button @click="op">Open</button><button @click="sv(0)">Save</button><button @click="sv(1)">Save As</button><button @click="cl">Close</button></div></div>
    <div v-if="e" class="d" @click="e=0"><div @click.stop class="c"><button @click="un">Undo</button><button @click="re">Redo</button><button @click="sa">Select All</button><button @click="cp">Copy</button><button @click="ps">Paste</button><button @click="clr">Clear All</button><button @click="u('f')">Find/Replace</button></div></div>
    <div v-if="v" class="d" @click="v=0"><div @click.stop class="c"><button @click="h_e=!h_e;v=0;r_h()">Syntax: {{h_e?'ON':'OFF'}}</button></div></div>

    <div v-if="f" class="s">
      <input v-model="f_t" placeholder="Find"/>
      <input v-model="r_t" placeholder="Replace"/>
      <div class="s-g">
        <button @click="rp" class="b s-btn">Confirm</button>
        <button @click="f=0" class="b c-btn">Cancel</button>
      </div>
    </div>

    <main v-if="!br" class="w">
      <div ref="ed" class="editor" contenteditable="true" @input="onIn" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
    </main>

    <div v-else class="o">
      <div class="h"><button @click="br=0" class="b">Cancel</button><span class="t">~/{{dr}}</span><button @click="mk" class="b">+ Folder</button></div>
      <div v-if="sm" class="s"><input v-model="s_n" class="i"/><button @click="cm" class="b">Save</button></div>
      <ul class="l">
        <li v-if="dr" @click="up" class="i u">..</li>
        <li v-for="i in fl" :key="i.name" @click="lk(i)" class="i"><span :class="i.isDirectory?'fld':'fle'">{{i.isDirectory?'['+i.name+']':i.name}}</span></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import {ref,onMounted,nextTick} from 'vue'
const txt=ref(''),n=ref(''),pt=ref(''),dr=ref(''),fl=ref([]),f_t=ref(''),r_t=ref(''),s_n=ref('')
const m=ref(0),e=ref(0),v=ref(0),br=ref(0),sm=ref(0),ch=ref(0),f=ref(0),h_e=ref(0),ed=ref(null)
const enc=encodeURIComponent,k='ahm-applet-editor'
const hst=ref([]),idx=ref(-1)
let t_x = 0, t_y = 0

const sd=val=>localStorage.setItem(k,val)
const ld=()=>localStorage.getItem(k)||''
const u=x=>{const states={m,e,v,f};for(let s in states)states[s].value=(s===x)?!states[s].value:0}

const ts=e=>{t_x=e.touches[0].clientX;t_y=e.touches[0].clientY}
const te=e=>{
  if(br.value)return
  let dx=e.changedTouches[0].clientX-t_x,dy=e.changedTouches[0].clientY-t_y
  if(Math.abs(dx)>60&&Math.abs(dy)<30){if(dx>0)un();else re()}
}

const hl=t=>{
  if(!t)return''
  let a=[],o=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  o=o.replace(/(\/\/.*)/g,x=>{a.push(`<span class="cmt">${x}</span>`);return`__T${a.length-1}__`})
  o=o.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g,x=>{a.push(`<span class="str">${x}</span>`);return`__T${a.length-1}__`})
  o=o.replace(/\b(const|let|var|function|return|if|else|for|import|from|true|false|null|class|export|default)\b/g,'<span class="kw">$&</span>')
  o=o.replace(/\b(\d+)\b/g,'<span class="num">$&</span>')
  for(let i=0;i<a.length;i++)o=o.replace(`__T${i}__`,a[i])
  return o
}

const getCaret=x=>{
  let s=window.getSelection()
  if(!s.rangeCount)return 0
  let r=s.getRangeAt(0),p=r.cloneRange()
  p.selectNodeContents(x);p.setEnd(r.endContainer,r.endOffset)
  return p.toString().length
}

const setCaret=(x,p)=>{
  let r=document.createRange(),s=window.getSelection(),cl=0,fnd=0
  const tv=n=>{
    if(fnd)return
    if(n.nodeType===3){
      if(cl+n.length>=p){r.setStart(n,p-cl);r.setEnd(n,p-cl);fnd=1}else cl+=n.length
    }else for(let i=0;i<n.childNodes.length;i++)tv(n.childNodes[i])
  }
  tv(x)
  if(!fnd){r.setStart(x,x.childNodes.length);r.setEnd(x,x.childNodes.length)}
  s.removeAllRanges();s.addRange(r)
}

const onIn=e=>{
  ch.value=1;txt.value=ed.value.innerText
  if(!e||e.inputType!=='historyUndo'&&e.inputType!=='historyRedo')rec(txt.value)
  if(h_e.value)r_h()
}

const r_h=()=>nextTick(()=>{
  if(!ed.value)return
  if(h_e.value){const p=getCaret(ed.value);ed.value.innerHTML=hl(txt.value);setCaret(ed.value,p)}
  else ed.value.innerText=txt.value
})

const rec=t=>{
  if(idx.value<hst.value.length-1)hst.value=hst.value.slice(0,idx.value+1)
  if(hst.value[idx.value]===t)return
  hst.value.push(t);idx.value++
}
const un=()=>{e.value=0;if(idx.value>0){idx.value--;txt.value=hst.value[idx.value];r_h()}}
const re=()=>{e.value=0;if(idx.value<hst.value.length-1){idx.value++;txt.value=hst.value[idx.value];r_h()}}

const l=()=>fetch(`/api/fs/list?path=${enc(dr.value)}`).then(r=>r.json()).then(d=>{
  fl.value=d.files.sort((a,b)=>b.isDirectory-a.isDirectory||a.name.localeCompare(b.name))
})

const nw=()=>{if(ch.value&&!confirm('Discard?'))return;txt.value='';n.value='';pt.value='';ch.value=0;m.value=0;hst.value=[''];idx.value=0;r_h()}
const cl=()=>{if(ch.value&&!confirm('Discard?'))return;nw()}
const clr=()=>{txt.value='';ch.value=1;e.value=0;rec('');r_h()}
const op=()=>{sm.value=0;m.value=0;br.value=1;dr.value=ld();l()}
const sv=a=>{
  m.value=0
  if(!a&&pt.value){s_n.value=n.value;dr.value=pt.value.split('/').slice(0,-1).join('/');cm()} 
  else{br.value=1;sm.value=1;s_n.value=n.value||'app.json';dr.value=pt.value?pt.value.split('/').slice(0,-1).join('/'):ld();l()}
}
const cm=()=>{
  if(!s_n.value)return
  const t=dr.value?`${dr.value}/${s_n.value}`:s_n.value
  fetch(`/api/fs/write?path=${enc(t)}&content=${enc(txt.value)}`,{method:'POST'}).then(() => {
    pt.value=t;n.value=s_n.value;ch.value=0;br.value=0;sd(dr.value)
  })
}
const mk=()=>{
  const nm=prompt('Folder:')
  if(!nm)return
  fetch(`/api/fs/mkdir?path=${enc(dr.value?`${dr.value}/${nm}`:nm)}`,{method:'POST'}).then(l)
}
const lk=i=>{
  const t=dr.value?`${dr.value}/${i.name}`:i.name
  if(i.isDirectory){dr.value=t;sd(dr.value);l()} 
  else if(!sm.value){
    fetch(`/api/fs/read?path=${enc(t)}`).then(r=>r.text()).then(c=>{
      txt.value=c;pt.value=t;n.value=i.name;ch.value=0;br.value=0;sd(dr.value);hst.value=[c];idx.value=0;r_h()
    })
  }
}
const up=()=>{dr.value=dr.value.split('/').slice(0,-1).join('/');sd(dr.value);l()}
const sa=()=>{e.value=0;const r=document.createRange();r.selectNodeContents(ed.value);const s=window.getSelection();s.removeAllRanges();s.addRange(r)}
const cp=()=>{e.value=0;sa();document.execCommand('copy')}
const ps=async()=>{e.value=0;try{const c=await navigator.clipboard.readText();if(c){txt.value=c;ch.value=1;rec(c);r_h()}}catch{}}
const rp=()=>{txt.value=txt.value.replaceAll(f_t.value,r_t.value);ch.value=1;f.value=0;rec(txt.value);r_h()}
onMounted(nw)
</script>

<style scoped>
.m{background:#121212;color:#e0e0e0;font-family:monospace;min-height:100vh;display:flex;flex-direction:column;box-sizing:border-box;}
.h{display:flex;align-items:center;background:#16161a;border-bottom:1px solid #24242e;height:40px;padding:0 0.5rem;}
.b-g{display:flex;gap:0.25rem;}
.b{background:#1f1f2e;border:1px solid #2e2e3f;color:#f1f5f9;padding:0.25rem 0.5rem;font-size:0.8rem;cursor:pointer;font-family:monospace;}
.b:active{background:#2e2e3f;}
.t{flex:1;font-size:0.8rem;text-align:right;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.w{flex:1;display:flex;background:#0f0f11;position:relative;overflow:hidden;}
.editor{width:100%;height:100%;position:absolute;top:0;left:0;margin:0;padding:12px;box-sizing:border-box;font-family:monospace!important;font-size:14px!important;line-height:22px!important;border:none;outline:none;white-space:pre-wrap!important;word-break:break-all!important;overflow:auto!important;tab-size:2;background:#0f0f11;color:#f8fafc;}

:deep(.kw){color:#ff79c6;font-weight:bold;}
:deep(.str){color:#f1fa8c;}
:deep(.num){color:#bd93f9;}
:deep(.cmt){color:#6272a4;font-style:italic;}

.d{position:fixed;top:40px;left:0;width:100vw;height:100vh;z-index:100;}
.c{background:#16161a;border:1px solid #24242e;display:flex;flex-direction:column;width:140px;box-shadow:0 4px 10px rgba(0,0,0,0.5);}
.c button{background:transparent;border:none;color:#cbd5e1;text-align:left;padding:0.5rem;font-size:0.85rem;cursor:pointer;font-family:monospace;}
.c button:active {background:#1f1f2e;}

.s{display:flex;flex-direction:column;gap:0.4rem;padding:0.5rem;background:#16161a;border-bottom:1px solid #24242e;}
.s input{background:#0f0f11;color:#fff;border:1px solid #24242e;padding:0.35rem;font-size:0.85rem;outline:none;font-family:monospace;}
.s-g{display:flex;gap:0.25rem;justify-content:flex-end;}
.s-btn{background:#1f1f2e;color:#34d399;border-color:#34d399;}
.c-btn{background:#1f1f2e;color:#cf6679;border-color:#cf6679;}

.o{position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0f0f11;display:flex;flex-direction:column;z-index:200;}
.l{list-style:none;padding:0;margin:0;flex:1;overflow-y:auto;}
.i{padding:0.5rem;border-bottom:1px solid #16161a;cursor:pointer;font-size:0.85rem;}
.u{color:#38bdf8;} .fld{color:#38bdf8;} .fle{color:#34d399;}
</style>
