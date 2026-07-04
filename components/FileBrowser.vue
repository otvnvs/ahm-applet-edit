<template>
  <div class="o">
    <!-- Header Controls -->
    <div class="h">
      <button @click="$emit('close')" class="b">Cancel</button>
      <span class="t">~/{{ dr || 'Root' }}</span>
      <button @click="mk" class="b">+Folder</button>
    </div>

    <!-- Live Search Filter Bar -->
    <div v-if="!saveMode" class="search-bar-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input v-model="searchQuery" @input="triggerSearch" placeholder="Search" class="search-input" />
        <button v-if="searchQuery || isSearching" @click="clearSearch" class="clear-search-btn">✕</button>
      </div>
      <div v-if="isSearching" class="search-status">
        <span v-if="usingCachedResults">Cached view</span>
        <span v-else>Scanning subdirectories...</span>
      </div>
    </div>

    <!-- Save File Input Panel -->
    <div v-if="saveMode" class="s">
      <input v-model="s_n" class="i" />
      <button @click="confirmSave" class="b">Save</button>
    </div>

    <!-- Main Content Grid Wrapper -->
    <ul class="l">
      <li v-if="dr !== '' && !searchQuery" @click="up" class="i u">
        <svg class="icon back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>.. Back</span>
      </li>
      
      <li v-for="i in visibleFiles" :key="i.relativePath || i.name" @click="lk(i)" class="i">
        <div class="item-content">
          <svg v-if="i.isDirectory" class="icon fld" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <svg v-else class="icon fle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          
          <div class="text-group">
            <span :class="i.isDirectory ? 'fld' : 'fle'">{{ i.name }}</span>
            <small v-if="searchQuery && i.relativePath && i.relativePath.includes('/')" class="path-sub">
              in {{ i.relativePath.substring(0, i.relativePath.lastIndexOf('/')) }}
            </small>
          </div>
        </div>
      </li>

      <li v-if="visibleFiles.length === 0" class="empty-state">
        No matching assets found.
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { FsService } from '../lib/fs.js'

const props = defineProps(['saveMode', 'currentName', 'currentPath'])
const emit = defineEmits(['close', 'file-selected', 'save-confirm'])

const dr = ref('')
const fl = ref([])
const s_n = ref(props.currentName || 'app.json')

const searchQuery = ref('')
const isSearching = ref(false)
const usingCachedResults = ref(false)
const recursiveResults = ref([])

const sd = val => localStorage.setItem('ahm-applet-editor', val)
const ld = () => localStorage.getItem('ahm-applet-editor') || ''

const l = () => FsService.list(dr.value).then(res => { fl.value = res }).catch(() => {})

const visibleFiles = computed(() => {
  return !searchQuery.value ? fl.value : recursiveResults.value
})

const triggerSearch = () => {
  const query = searchQuery.value.trim();
  if (!query) {
    clearSearch();
    return;
  }

  usingCachedResults.value = false;
  isSearching.value = true;

  // Fire isolated service coordinator
  FsService.searchRecursiveDebounced({
    term: query,
    baseDir: dr.value,
    onCacheHit: (cachedData) => {
      recursiveResults.value = cachedData;
      usingCachedResults.value = true;
    },
    onComplete: (freshData, verifiedKey) => {
      // Guard against race conditions if search parameters shifted in background
      const activeKey = `${dr.value}::${searchQuery.value.trim().toLowerCase()}`;
      if (activeKey === verifiedKey && searchQuery.value) {
        recursiveResults.value = freshData;
        isSearching.value = false;
        usingCachedResults.value = false;
      }
    }
  });
}

const clearSearch = () => {
  searchQuery.value = ''
  recursiveResults.value = []
  isSearching.value = false
  usingCachedResults.value = false
}

const up = () => {
  if (!dr.value) return
  const parts = dr.value.split('/')
  parts.pop()
  dr.value = parts.join('/')
  sd(dr.value)
  clearSearch()
  l()
}

const lk = (i) => {
  const targetPath = i.relativePath || (dr.value ? `${dr.value}/${i.name}` : i.name)
  if (i.isDirectory) { 
    dr.value = targetPath
    sd(dr.value)
    clearSearch()
    l() 
  } else if (!props.saveMode) { 
    emit('file-selected', targetPath, i.name) 
  }
}

const mk = () => {
  const nm = prompt('Folder Name:')
  if (nm) {
    const targetPath = dr.value ? `${dr.value}/${nm}` : nm
    FsService.mkdir(targetPath).then(l).catch(() => alert('Could not create folder'))
  }
}

const confirmSave = () => {
  if (!s_n.value) return
  emit('save-confirm', dr.value, s_n.value)
}

onMounted(() => {
  dr.value = ld()
  l()
})
</script>

<style scoped>
.o { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #0f0f11; display: flex; flex-direction: column; z-index: 200; }
.h { display: flex; align-items: center; background: #16161a; border-bottom: 1px solid #24242e; height: 40px; padding: 0 0.5rem; }
.b { background: #1f1f2e; border: 1px solid #2e2e3f; color: #f1f5f9; padding: 0.25rem 0.5rem; font-size: 0.8rem; cursor: pointer; font-family: monospace; }
.b:active { background: #2e2e3f; }
.t { flex: 1; font-size: 0.8rem; text-align: right; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.search-bar-container { background: #16161a; padding: 0.5rem; border-bottom: 1px solid #24242e; }
.search-input-wrapper { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; width: 16px; height: 16px; color: #64748b; pointer-events: none; }
.search-input { width: 100%; background: #0f0f11; color: #fff; border: 1px solid #24242e; padding: 0.45rem 2rem 0.45rem 2.2rem; font-size: 0.85rem; outline: none; font-family: monospace; border-radius: 4px; }
.search-input:focus { border-color: #3b82f6; }
.clear-search-btn { position: absolute; right: 10px; background: transparent; border: none; color: #64748b; font-size: 0.9rem; cursor: pointer; padding: 2px; }

.search-status { font-size: 0.75rem; color: #3b82f6; padding-top: 4px; padding-left: 2px; font-family: monospace; }

.s { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.5rem; background: #16161a; border-bottom: 1px solid #24242e; }
.s input { background: #0f0f11; color: #fff; border: 1px solid #24242e; padding: 0.35rem; font-size: 0.85rem; outline: none; font-family: monospace; }

.l { list-style: none; padding: 0; margin: 0; flex: 1; overflow-y: auto; }
.i { padding: 0.65rem 0.5rem; border-bottom: 1px solid #16161a; cursor: pointer; font-size: 0.85rem; }
.empty-state { text-align: center; color: #64748b; padding: 2rem; font-size: 0.85rem; font-style: italic; }

.item-content { display: flex; align-items: center; gap: 0.6rem; }
.text-group { display: flex; flex-direction: column; }
.path-sub { font-size: 0.7rem; color: #64748b; font-family: monospace; margin-top: 2px; }

.u { display: flex; align-items: center; gap: 0.6rem; color: #38bdf8; }

.icon { width: 18px; height: 18px; flex-shrink: 0; display: inline-block; vertical-align: middle; }
.back-icon { color: #38bdf8; }
.fld { color: #38bdf8; } 
.fle { color: #34d399; }
</style>

