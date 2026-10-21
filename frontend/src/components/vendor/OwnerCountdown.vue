<script setup>
// Đếm ngược theo giờ thật tới 'deadline' (ISO, giờ VN). Nếu có 'seconds' (secondsLeft do server tính lúc tải) thì ưu tiên dùng để khỏi lệch múi giờ.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
const props = defineProps({ deadline: String, seconds: { type: Number, default: null } })
const t0 = ref(Date.now())
const now = ref(Date.now())
let timer = null
watch(() => [props.deadline, props.seconds], () => { t0.value = Date.now(); now.value = t0.value })
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
onBeforeUnmount(() => clearInterval(timer))
const txt = computed(() => {
  const s = props.seconds != null
    ? props.seconds - Math.floor((now.value - t0.value) / 1000)
    : dayjs(props.deadline).diff(dayjs(now.value), 'second')
  const v = Math.max(0, s)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(v / 3600))}:${p(Math.floor((v % 3600) / 60))}:${p(v % 60)}`
})
</script>
<template><span>{{ txt }}</span></template>
