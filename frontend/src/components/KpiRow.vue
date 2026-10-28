<script setup>
// items: [{ k: 'Nhãn', v: 'Giá trị', d: 'ghi chú', bad: false }]
defineProps({ items: { type: Array, required: true } })
</script>
<template>
  <div class="row nowrap">
    <div v-for="i in items" :key="i.k" class="card kpi"><div class="k">{{ i.k }}</div><div class="v">{{ i.v }}</div><div class="d" :class="{ bad: i.bad }">{{ i.d }}</div></div>
  </div>
</template>
