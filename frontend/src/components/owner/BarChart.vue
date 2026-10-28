<script setup>
// Biểu đồ cột CSS thuần có trục Y (bước 0,5 triệu) và nhãn giá trị trên đầu cột.
// bars: [{ label, sub, value }] (value tính bằng đồng)
import { computed } from 'vue'
const props = defineProps({ bars: { type: Array, required: true }, height: { type: Number, default: 160 }, step: { type: Number, default: 500000 } })
const maxTick = computed(() => {
  const m = Math.max(...props.bars.map((b) => b.value), 0)
  return Math.max(props.step, Math.ceil(m / props.step) * props.step)
})
const fmtTick = (n) => (n === 0 ? '0' : (n / 1000000).toString().replace('.', ',') + ' tr')
const ticks = computed(() => {
  const out = []
  for (let v = 0; v <= maxTick.value; v += props.step) out.push({ v, label: fmtTick(v), pos: (v / maxTick.value) * props.height })
  return out
})
const items = computed(() => props.bars.map((b) => ({ ...b, h: Math.round((b.value / maxTick.value) * props.height), text: Number(b.value).toLocaleString('vi-VN') })))
</script>
<template>
  <div style="display:flex">
    <div :style="{ width: '64px', position: 'relative', height: height + 'px', flex: 'none' }">
      <div v-for="t in ticks" :key="t.v" :style="{ position: 'absolute', right: '6px', bottom: (t.pos - 7) + 'px', fontSize: '11px', color: '#8C7A68' }">{{ t.label }}</div>
    </div>
    <div style="flex:1;min-width:0">
      <div :style="{ position: 'relative', height: height + 'px', borderBottom: '1.5px solid #8C7A68', borderLeft: '1.5px solid #8C7A68' }">
        <div v-for="t in ticks" :key="'g' + t.v" :style="{ position: 'absolute', left: 0, right: 0, bottom: t.pos + 'px', borderTop: '1px dashed #E3D8C8' }"></div>
        <div style="position:absolute;inset:0;display:flex">
          <div v-for="b in items" :key="b.label" :style="{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: height + 'px' }">
            <div :style="{ position: 'relative', width: '56%', height: b.h + 'px', background: '#6B4630', borderRadius: '6px 6px 0 0' }">
              <span style="position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:4px;font-size:11px;font-weight:700;white-space:nowrap">{{ b.text }}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex">
        <div v-for="b in items" :key="'l' + b.label" style="flex:1;text-align:center;font-size:12px;color:#4A3B30;padding-top:6px">{{ b.label }}<br>{{ b.sub }}</div>
      </div>
    </div>
  </div>
</template>
