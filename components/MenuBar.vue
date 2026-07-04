<template>
  <div class="h">
    <div class="b-g">
      <button @click="toggle('m')" class="b">File</button>
      <button @click="toggle('e')" class="b">Edit</button>
      <button @click="v = !v" class="b">View</button>
    </div>
    <span class="t">{{ filename || 'Untitled' }}<span v-if="hasChanges">*</span></span>
  </div>

  <!-- File Menu Dropdown -->
  <div v-if="m" class="d" @click="m = 0">
    <div @click.stop class="c">
      <button @click="$emit('action', 'new')">New</button>
      <button @click="$emit('action', 'open')">Open</button>
      <button @click="$emit('action', 'save')">Save</button>
      <button @click="$emit('action', 'saveas')">Save As</button>
      <button @click="$emit('action', 'close')">Close</button>
    </div>
  </div>

  <!-- Edit Menu Dropdown -->
  <div v-if="e" class="d" @click="e = 0">
    <div @click.stop class="c">
      <button @click="$emit('action', 'undo')">Undo</button>
      <button @click="$emit('action', 'redo')">Redo</button>
      <button @click="$emit('action', 'selectall')">Select All</button>
      <button @click="$emit('action', 'copy')">Copy</button>
      <button @click="$emit('action', 'paste')">Paste</button>
      <button @click="$emit('action', 'delete')" class="danger-btn">Delete File</button>
      <button @click="$emit('action', 'clearall')">Clear All</button>
      <button @click="toggle('f')">Find/Replace</button>
    </div>
  </div>

  <!-- View Menu Dropdown -->
  <div v-if="v" class="d" @click="v = 0">
    <div @click.stop class="c">
      <button @click="$emit('toggle-syntax'); v = 0">Syntax: {{ syntaxOn ? 'ON' : 'OFF' }}</button>
    </div>
  </div>

  <!-- Find Panel -->
  <div v-if="f" class="s">
    <input v-model="f_t" placeholder="Find" />
    <input v-model="r_t" placeholder="Replace" />
    <div class="s-g">
      <button @click="$emit('replace', { find: f_t, replace: r_t }); f = 0" class="b s-btn">Confirm</button>
      <button @click="f = 0" class="b c-btn">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps(['filename', 'hasChanges', 'syntaxOn'])
defineEmits(['action', 'toggle-syntax', 'replace'])

const m = ref(0), e = ref(0), v = ref(0), f = ref(0)
const f_t = ref(''), r_t = ref('')

const toggle = (x) => {
  const flags = { m, e, f }; v.value = 0
  for (let k in flags) flags[k].value = (k === x) ? !flags[k].value : 0
}
</script>

