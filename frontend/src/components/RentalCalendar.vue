<script setup>
// Lịch DÙNG CHUNG cho Người thuê (R07) và Chủ đồ (O05): 1 tháng, mũi tên ‹ › chuyển tháng.
// Quy ước: số ngày thuê = ngày trả − ngày nhận; ô Nhận và ô Trả đều được tô.
// props:
//   month      'YYYY-MM' tháng hiển thị ban đầu (mặc định 2026-10)
//   today      'YYYY-MM-DD' ngày giả lập hôm nay (ngày < today = 'pst' đã qua)
//   ranges     [{ start, end, cls, label?, startLabel?, endLabel? }]  tô cả khoảng start..end (gồm 2 đầu). cls: bk|ow|cf|lt|dp|hs|se
//   marks      { 'YYYY-MM-DD': 'td' }  viền "hôm nay"…
//   keepStatus ngày < today vẫn giữ màu trạng thái nếu thuộc một khoảng (lịch chủ đồ: 20–23/10 vẫn hiện Nhận/Trả/Trễ)
//   selectable bật chọn ngày nhận → ngày trả (v-model:selection = { start, end }), tối đa maxDays ngày, không băng qua ô đã kín
const props = defineProps({
  month: { type: String, default: '2026-10' }, today: { type: String, default: '2026-10-19' }, ranges: { type: Array, default: () => [] },
  marks: { type: Object, default: () => ({}) }, selectable: Boolean, selection: { type: Object, default: () => ({ start: null, end: null }) },
  maxDays: { type: Number, default: 7 }, legend: { type: Array, default: null }, keepStatus: Boolean,
})
const emit = defineEmits(['update:selection'])
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
const cur = ref(dayjs(props.month + '-01'))
const dows = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const title = computed(() => `Tháng ${cur.value.format('M/YYYY')}`)
const busyCls = (d) => { const r = props.ranges.find((x) => d >= x.start && d <= x.end && x.cls !== 'se'); return r }
const cells = computed(() => {
  const first = cur.value.startOf('month'); const lead = (first.day() + 6) % 7; const n = cur.value.daysInMonth(); const out = []
  for (let i = 0; i < lead; i++) out.push(null)
  for (let d = 1; d <= n; d++) {
    const date = first.date(d).format('YYYY-MM-DD'); const r = props.ranges.find((x) => date >= x.start && date <= x.end)
    const sel = props.selection; let cls = 'free', label = ''
    if (date < props.today && !(props.keepStatus && r)) cls = 'pst'
    else if (r) { cls = r.cls; if (r.startLabel && date === r.start) label = r.startLabel; if (r.endLabel && date === r.end) label = r.endLabel; if (r.label && !label) label = r.label }
    if (props.selectable && sel.start && date >= sel.start && date <= (sel.end || sel.start) && cls === 'free') { cls = 'se'; label = date === sel.start ? 'Nhận' : date === sel.end ? 'Trả' : '' }
    if (props.marks[date]) { cls += ' ' + props.marks[date]; if (props.marks[date] === 'td' && !label) label = 'Hôm nay' }
    out.push({ d, date, cls, label })
  }
  return out
})
function pick(c) {
  if (!props.selectable || !c || !c.cls.startsWith('free') && !c.cls.startsWith('se')) return
  if (c.date < props.today) return
  const s = props.selection
  if (!s.start || s.end) return emit('update:selection', { start: c.date, end: null })
  if (c.date <= s.start) return emit('update:selection', { start: c.date, end: null })
  if (dayjs(c.date).diff(dayjs(s.start), 'day') > props.maxDays) return emit('update:selection', { start: c.date, end: null })
  const blocked = props.ranges.some((x) => x.cls !== 'se' && x.end >= s.start && x.start <= c.date)
  if (blocked) return emit('update:selection', { start: c.date, end: null })
  emit('update:selection', { start: s.start, end: c.date })
}
const defaultLegend = [['free', 'Trống'], ['bk', 'Đã có người thuê / chủ đồ khóa'], ['se', 'Bạn chọn'], ['pst', 'Đã qua']]
const lg = computed(() => props.legend || defaultLegend)
</script>
<template>
  <div class="cal">
    <div class="cal-head">
      <button class="nav-btn" type="button" @click="cur = cur.subtract(1, 'month')">‹</button>
      <b>{{ title }}</b>
      <button class="nav-btn" type="button" @click="cur = cur.add(1, 'month')">›</button>
    </div>
    <div class="cal-grid">
      <div v-for="w in dows" :key="w" class="cal-dow">{{ w }}</div>
      <template v-for="(c, i) in cells" :key="i">
        <div v-if="!c" />
        <div v-else class="cal-day" :class="c.cls" @click="pick(c)">{{ c.d }}<small v-if="c.label">{{ c.label }}</small></div>
      </template>
    </div>
    <div class="cal-legend"><span v-for="[k, t] in lg" :key="k"><i class="cal-day" :class="k" style="width:12px;height:12px;padding:0;display:inline-block" />{{ t }}</span></div>
  </div>
</template>
