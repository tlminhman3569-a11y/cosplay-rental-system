<script setup>
// steps: ['Nhãn 1', ...]; current: chỉ số bước hiện tại (0-based)
defineProps({ steps: { type: Array, required: true }, current: { type: Number, default: 0 } })
</script>
<template>
  <div class="stp">
    <div v-for="(l, i) in steps" :key="l" class="s" :class="i < current ? 'd' : i === current ? 'c' : ''"><i>{{ i < current ? '✓' : i + 1 }}</i>{{ l }}</div>
  </div>
</template>
