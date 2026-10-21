<script setup>
// Biểu đồ tròn (donut) bằng SVG thuần + chú giải. slices: [{ label, value, color, detail }]
import { computed } from 'vue'
const props = defineProps({ slices: { type: Array, required: true }, centerTop: String, centerBottom: String })
const R = 62
const C = 2 * Math.PI * R
const total = computed(() => props.slices.reduce((s, x) => s + x.value, 0))
const arcs = computed(() => {
  let acc = 0
  return props.slices.map((s) => {
    const len = total.value ? (s.value / total.value) * C : 0
    const a = { ...s, dash: len.toFixed(2) + ' ' + (C - len).toFixed(2), offset: (-acc).toFixed(2), pct: total.value ? Math.round((s.value / total.value) * 100) : 0 }
    acc += len
    return a
  })
})
</script>
<template>
  <div style="display:flex;align-items:center;gap:20px">
    <svg width="160" height="160" viewBox="0 0 160 160" style="flex:none">
      <circle v-for="a in arcs" :key="a.label" cx="80" cy="80" :r="R" fill="none" :stroke="a.color" stroke-width="28" :stroke-dasharray="a.dash" :stroke-dashoffset="a.offset" transform="rotate(-90 80 80)" />
      <text x="80" y="78" font-size="20" font-weight="700" fill="#2B211B" text-anchor="middle" font-family="Merriweather,serif">{{ centerTop }}</text>
      <text x="80" y="96" font-size="11" fill="#6F5F52" text-anchor="middle">{{ centerBottom }}</text>
    </svg>
    <div style="flex:1;min-width:0">
      <div v-for="a in arcs" :key="'k' + a.label" style="display:flex;align-items:center;gap:8px;font-size:13px;padding:4px 0">
        <i :style="{ width: '12px', height: '12px', borderRadius: '3px', background: a.color, flex: 'none' }"></i>
        <span style="flex:1">{{ a.label }}</span><b>{{ a.pct }}%</b>
        <span class="muted sm" style="width:84px;text-align:right">{{ a.detail }}</span>
      </div>
    </div>
  </div>
</template>
