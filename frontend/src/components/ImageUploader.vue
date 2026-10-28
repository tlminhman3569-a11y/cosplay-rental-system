<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/store/ui'
import { uploadService, checkFile, IMAGE_ACCEPT, UPLOAD_MAX_MB } from '@/services/uploadService'
import { errMsg } from '@/services/http'

// Tải ảnh lên: chọn nhiều ảnh hoặc kéo thả, xem trước, xóa, tiến trình, báo lỗi dung lượng/định dạng.
// v-model = mảng URL (chuỗi) do server trả về. fixed = ảnh đã lưu trên server (chỉ hiển thị): mảng URL hoặc { url, label }.
// private = ảnh nhạy cảm (CCCD, selfie): lưu riêng, xem qua blob kèm token. accept có 'application/pdf' = cho phép PDF (bằng chứng).
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  fixed: { type: Array, default: () => [] },
  max: { type: Number, default: 8 },
  accept: { type: String, default: IMAGE_ACCEPT },
  private: Boolean,
  label: { type: String, default: 'Tải ảnh lên' },
  h: { type: Number, default: 90 },
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue', 'uploaded'])
const ui = useUiStore()
const input = ref(null)
const busy = ref(false)
const percent = ref(0)
const pending = ref(0)
const over = ref(false)
const error = ref('')
const blobs = ref({}) // url riêng tư -> blob: URL

const allowPdf = computed(() => props.accept.includes('application/pdf'))
const fixedList = computed(() => props.fixed.map((p) => (typeof p === 'string' ? { url: p, label: '' } : p)))
const total = computed(() => fixedList.value.length + props.modelValue.length)
const isPdf = (u) => /\.pdf$/i.test(u)
const isPriv = (u) => String(u).startsWith('/api/uploads/private/')
const srcOf = (u) => (isPriv(u) ? blobs.value[u] || '' : u)

async function loadPrivate() {
  const urls = [...fixedList.value.map((p) => p.url), ...props.modelValue].filter((u) => isPriv(u) && !(u in blobs.value))
  for (const u of urls) {
    blobs.value[u] = ''
    try { blobs.value[u] = await uploadService.privateBlobUrl(u) } catch { /* giữ placeholder */ }
  }
}
watch(() => [props.modelValue, props.fixed], loadPrivate, { deep: true, immediate: true })
onBeforeUnmount(() => { Object.values(blobs.value).forEach((b) => b && URL.revokeObjectURL(b)) })

function pick() { if (!props.disabled && !busy.value && total.value < props.max) input.value && input.value.click() }
function onInput(e) { handle(Array.from(e.target.files || [])); e.target.value = '' }
function onDrop(e) { over.value = false; if (!props.disabled) handle(Array.from(e.dataTransfer?.files || [])) }

async function handle(files) {
  error.value = ''
  if (!files.length || props.disabled || busy.value) return
  const room = props.max - total.value
  if (room <= 0) { error.value = 'Tối đa ' + props.max + ' tệp'; return }
  const problems = []
  let ok = []
  for (const f of files) {
    const msg = checkFile(f, { pdf: allowPdf.value })
    if (msg) problems.push(msg); else ok.push(f)
  }
  if (ok.length > room) { problems.push('Chỉ còn chỗ cho ' + room + ' tệp, đã bỏ bớt ' + (ok.length - room) + ' tệp'); ok = ok.slice(0, room) }
  if (problems.length) error.value = problems.join('. ')
  if (!ok.length) return
  busy.value = true; percent.value = 0; pending.value = ok.length
  try {
    const res = await uploadService.upload(ok, { private: props.private, evidence: allowPdf.value, onProgress: (p) => { percent.value = p } })
    const urls = res.map((r) => r.url)
    emit('update:modelValue', [...props.modelValue, ...urls])
    emit('uploaded', res)
  } catch (e) {
    error.value = errMsg(e, 'Không tải được tệp lên')
    ui.toast(error.value)
  } finally { busy.value = false; pending.value = 0 }
}
function remove(i) { emit('update:modelValue', props.modelValue.filter((_, k) => k !== i)) }
const tile = computed(() => ({ position: 'relative', height: props.h + 'px', overflow: 'hidden' }))
const closeBtn = 'position:absolute;top:4px;right:6px;cursor:pointer;background:#fff;border-radius:50%;width:18px;height:18px;line-height:17px;text-align:center;font-size:13px;z-index:1'
</script>

<template>
  <div>
    <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(110px,1fr))">
      <div v-for="(p, i) in fixedList" :key="'f' + i" class="img" :style="tile">
        <a v-if="isPdf(p.url)" :href="p.url" target="_blank" rel="noopener">PDF</a>
        <img v-else-if="srcOf(p.url)" :src="srcOf(p.url)" alt="" @error="blobs[p.url] = ''">
        <template v-else>{{ p.label || 'Ảnh' }}</template>
        <span v-if="p.label && srcOf(p.url) && !isPdf(p.url)" style="position:absolute;left:4px;bottom:4px;background:rgba(255,255,255,.85);padding:1px 6px;border-radius:6px;font-size:11px">{{ p.label }}</span>
      </div>
      <div v-for="(u, i) in modelValue" :key="'n' + u + i" class="img" :style="tile">
        <a v-if="isPdf(u)" :href="u" target="_blank" rel="noopener">PDF {{ i + 1 }}</a>
        <img v-else-if="srcOf(u)" :src="srcOf(u)" alt="" @error="blobs[u] = ''">
        <template v-else>Ảnh {{ i + 1 }}</template>
        <a v-if="!disabled" title="Xóa" :style="closeBtn" @click="remove(i)">×</a>
      </div>
      <template v-if="busy"><div v-for="n in pending" :key="'p' + n" class="img dash" :style="tile">Đang tải {{ percent }}%</div></template>
      <div v-if="!disabled && total + pending < max" class="img dash" :style="[tile, { cursor: 'pointer', flexDirection: 'column', gap: '4px', borderColor: over ? '#6B4630' : undefined }]"
        @click="pick" @dragover.prevent="over = true" @dragleave.prevent="over = false" @drop.prevent="onDrop">
        <b>+ {{ label }}</b>
        <span class="sm">hoặc kéo thả vào đây</span>
      </div>
    </div>
    <div v-if="busy" style="height:6px;border-radius:3px;background:#E7DCCB;margin-top:8px;overflow:hidden"><div :style="{ width: percent + '%', height: '100%', background: '#6B4630' }"></div></div>
    <input ref="input" type="file" multiple :accept="accept" style="display:none" @change="onInput">
    <div v-if="error" class="sm mt8" style="color:#B5432F">{{ error }}</div>
    <div v-if="!disabled" class="muted sm mt8">{{ allowPdf ? 'JPG, PNG, WEBP, GIF hoặc PDF' : 'JPG, PNG, WEBP, GIF' }}, tối đa {{ UPLOAD_MAX_MB }}MB mỗi tệp. Đã có {{ total }}/{{ max }}.</div>
  </div>
</template>
