<script setup>
// items: [{ state: 'd'|'c'|'p'|'x', title, sub }]  d xong · c hiện tại · p chờ · x lỗi
defineProps({ items: { type: Array, required: true } })
</script>
<template>
  <div class="tl">
    <div v-for="(it, i) in items" :key="i" class="ti">
      <div class="dt" :class="it.state === 'd' ? '' : it.state">{{ it.state === 'd' ? '✓' : it.state === 'x' ? '!' : i + 1 }}</div>
      <div><b>{{ it.title }}</b><div class="muted">{{ it.sub }}</div></div>
    </div>
  </div>
</template>
