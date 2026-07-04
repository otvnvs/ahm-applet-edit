# Device File Browser & Editor (`index.vue`)

A minimalist, single-file IDE component optimized for mobile devices running inside an Android WebView container. It intercepts native storage coordinates using a localized REST API mesh (`/api/fs/*`) and manages real-time source file editing, directory tracking, and state persistence.

---

## Technical Specifications

### Architecture
* **Single-Layer DOM View**: Leverages a `contenteditable` node matrix instead of dual-layer stacked overlays (`<textarea>` + `<pre>`). This unifies text layouts and input frames into one layer, preventing caret and touch tracking drift under Android WebView layout engines.
* **Non-Recursive Token Isolation**: The syntax highlighter isolates comments and string literals using temporary placeholder anchors (`__T{index}__`) *before* executing keyword regex matches. This blocks recursive matching cycles (e.g., nesting `<span class="<span class="kw">...`) and prevents memory leak crashes.
* **Deterministic Menu Toggle**: Restricts view states via a centralized mutation loop to ensure no more than one dropdown layout array (File, Edit, View, Find) mounts into active view memory pools at the same time.

### State Persistence
* **Directory Track Point Key**: `ahm-applet-editor` (stores the last verified folder path string inside `localStorage`).
* **Session Stack Arrays**: Tracks state adjustments sequentially via explicit value tracking arrays (`hst`) and pointer metrics indices (`idx`) to support local histories.

---

## Feature Control Mapping

### Gestures
* **Swipe Right (`dx > 60px`)**: Pulls the historic session layer backwards (`idx--`) to execute a local text **Undo**.
* **Swipe Left (`dx < -60px`)**: Advances the index pointer forward (`idx++`) to trigger a **Redo**.

### Input Matrix Shortcuts (via UI Menu)
* **File Menu**: `New` (clears workspace and history index loops), `Open` (triggers path explorer overlay), `Save` (in-place `/write` call if pointer exists), `Save As` (forces explorer view target inputs frame), `Close`.
* **Edit Menu**: `Undo`, `Redo`, `Select All`, `Copy` (legacy document selector copy execute path fallback), `Paste`, `Clear All`, `Find/Replace`.
* **View Menu**: Toggle syntax highlighting mode dynamically. Hiding tokens returns the DOM matrix to a plain-text engine container.

---

## API Contract Layout

All communications are dispatched to the relative endpoints exposed by the native Android WebView interceptor framework:


```
GET    /api/fs/list?path={encoded_string}
GET    /api/fs/read?path={encoded_string}
POST   /api/fs/write?path={encoded_string}&content={encoded_string}
POST   /api/fs/mkdir?path={encoded_string}
DELETE /api/fs/delete?path={encoded_string}
```


## Deployment Code Signature

```vue
<!-- Core Style Configurations Matrix -->
<style scoped>
textarea, .editor {
  tab-size: 2;
  font-family: monospace !important;
  font-size: 14px !important;
  line-height: 22px !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
}
:deep(.kw)  { color: #ff79c6; font-weight: bold; }
:deep(.str) { color: #f1fa8c; }
:deep(.num) { color: #bd93f9; }
:deep(.cmt) { color: #6272a4; font-style: italic; }
</style>
```



