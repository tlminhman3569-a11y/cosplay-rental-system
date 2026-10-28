<script setup>
import { ref, watch } from 'vue'
import { isImageUrl } from '@/services/uploadService'
// Tệp đính kèm trong tin nhắn: ảnh hiện thu nhỏ (bấm để mở ảnh lớn), tệp khác hiện liên kết; ảnh lỗi thì quay về liên kết.
const props = defineProps({ url: String })
const broken = ref(false)
watch(() => props.url, () => { broken.value = false })
</script>
<template>
  <a v-if="url" :href="url" target="_blank" rel="noopener" class="sm" style="display:block;margin-top:4px;text-decoration:underline;color:inherit">
    <img v-if="isImageUrl(url) && !broken" :src="url" alt="Ảnh đính kèm" style="max-width:200px;max-height:200px;border-radius:8px;display:block" @error="broken = true">
    <template v-else>Tệp đính kèm</template>
  </a>
</template>
