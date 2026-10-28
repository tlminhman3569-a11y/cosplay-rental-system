<script setup>
import { ref, watch } from 'vue'
// Khung ảnh: có src thì hiện ảnh thật (object-fit cover), lỗi tải/không có thì giữ placeholder (nhãn).
// w/h là px; dash = viền nét đứt (ô tải ảnh); ts = dòng dấu thời gian đồng kiểm
const props = defineProps({ label: String, w: [Number, String], h: [Number, String], dash: Boolean, ts: String, src: String })
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>
<template>
  <div class="img" :class="{ dash, ts }" :data-ts="ts" :style="{ width: w ? w + 'px' : undefined, height: h ? h + 'px' : undefined }">
    <img v-if="src && !failed" :src="src" :alt="label" @error="failed = true"><template v-else>{{ label }}</template>
  </div>
</template>
