<script setup>
// Biểu đồ cột mini "Doanh thu 6 tháng (triệu đồng)" bằng CSS thuần. data: [{ m, v, h }], cột cuối được nhấn màu.
defineProps({ data: { type: Array, required: true } })
</script>
<template>
  <div style="display:flex;gap:6px;align-items:flex-end;height:150px">
    <div v-for="(b, i) in data" :key="b.m" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px">
      <span class="sm muted">{{ b.v }}</span>
      <div :style="{ width: '70%', height: b.h + 'px', background: i === data.length - 1 ? '#6B4630' : '#D9C7AE', borderRadius: '5px 5px 0 0' }"></div>
      <span class="sm muted">{{ b.m }}</span>
    </div>
  </div>
</template>
