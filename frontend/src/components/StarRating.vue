<script setup>
import { computed } from 'vue'
const props = defineProps({ value: { type: Number, default: 0 }, max: { type: Number, default: 5 } })
const s = computed(() => '★'.repeat(Math.round(props.value)) + '☆'.repeat(props.max - Math.round(props.value)))
</script>
<template><span class="stars">{{ s }}</span></template>
