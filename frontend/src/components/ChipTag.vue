<script setup>
// kind: '' nâu | g xanh lá | a vàng | r đỏ | b xanh dương | n xám | p tím
defineProps({ kind: { type: String, default: '' } })
</script>
<template><span class="chip" :class="kind"><slot /></span></template>
