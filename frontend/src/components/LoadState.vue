<script setup>
// Khối trạng thái tải dữ liệu dùng chung cho các màn Chủ đồ: đang tải / lỗi (có nút Thử lại). Hết tải và không lỗi thì không hiển thị gì.
defineProps({ loading: Boolean, error: { type: String, default: '' }, text: { type: String, default: 'Đang tải dữ liệu…' } })
defineEmits(['retry'])
</script>
<template>
  <div v-if="loading" class="card muted" style="text-align:center;padding:40px">{{ text }}</div>
  <div v-else-if="error" class="card err" style="text-align:center;padding:32px">
    <h3>Không tải được dữ liệu</h3>
    <div class="muted mb12">{{ error }}</div>
    <a class="btn" @click="$emit('retry')">Thử lại</a>
  </div>
</template>
