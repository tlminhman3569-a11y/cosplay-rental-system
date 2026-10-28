<script setup>
// v-model = khóa tab đang chọn; tabs: [{ key, label, count? }]
defineProps({ modelValue: String, tabs: { type: Array, required: true } })
defineEmits(['update:modelValue'])
</script>
<template>
  <div class="tabs">
    <a v-for="t in tabs" :key="t.key" :class="{ on: t.key === modelValue }" @click="$emit('update:modelValue', t.key)">{{ t.label }}<template v-if="t.count != null"> ({{ t.count }})</template></a>
  </div>
</template>
