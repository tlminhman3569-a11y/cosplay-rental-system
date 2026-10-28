<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import BoLayout from '@/layouts/BoLayout.vue'
import RentalCalendar from '@/components/owner/RentalCalendar.vue'
import KpiRow from '@/components/KpiRow.vue'
import ChipTag from '@/components/ChipTag.vue'
import FormField from '@/components/FormField.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { errMsg } from '@/services/http'

import { mockCalendar, copyMock } from '../../../mock/vendor'
const ui = useUiStore()
const route = useRoute()
const data = ref(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const sel = ref(Number(route.query.productId) || 0)
const calKey = ref(0)
const selection = ref({ start: null, end: null })
const form = reactive({ from: '', to: '', reason: '' })
const formError = ref('')

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const res = copyMock(mockCalendar)
    data.value = res
    if (!sel.value) sel.value = res.products[0].id
  } catch (e) {
    const m = errMsg(e, 'Không tải được lịch cho thuê')
    if (silent && data.value) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const products = computed(() => (data.value ? data.value.products : []))
const current = computed(() => products.value.find((p) => p.id === sel.value) || products.value[0] || { name: '', title: '' })
const productOptions = computed(() => products.value.map((p) => ({ value: p.id, label: p.title })))
const today = computed(() => (data.value ? data.value.today : ''))
const month = computed(() => (data.value ? data.value.month : '2026-10'))
const legend = computed(() => {
  const lg = data.value ? [...data.value.legend] : []
  if (!lg.some((x) => x[0] === 'cl')) lg.splice(Math.max(0, lg.findIndex((x) => x[0] === 'hs')), 0, ['cl', 'Ngày giặt / vệ sinh sau khi trả'])
  return lg
})
const calRanges = computed(() => (data.value ? data.value.ranges : []))
const marks = computed(() => (today.value ? { [today.value]: 'td' } : {}))

// ----- đếm ô trong tháng đang hiển thị ban đầu -----
const monthDays = computed(() => {
  const n = dayjs(month.value + '-01').daysInMonth()
  return Array.from({ length: n }, (_, i) => dayjs(month.value + '-01').date(i + 1).format('YYYY-MM-DD'))
})
const daysOf = (cls) => monthDays.value.filter((d) => calRanges.value.some((r) => r.cls === cls && d >= r.start && d <= r.end))
const freeDays = computed(() => monthDays.value.filter((d) => d >= today.value && !calRanges.value.some((r) => d >= r.start && d <= r.end)))
function compress(days) {
  if (!days.length) return '—'
  const groups = []
  days.forEach((d) => {
    const last = groups[groups.length - 1]
    if (last && dayjs(d).diff(dayjs(last[last.length - 1]), 'day') === 1) last.push(d)
    else groups.push([d])
  })
  return groups.map((g) => (g.length === 1 ? dayjs(g[0]).format('DD') : dayjs(g[0]).format('DD') + '–' + dayjs(g[g.length - 1]).format('DD')) + '/' + dayjs(g[0]).format('MM')).join(', ')
}
const kpis = computed(() => [
  { k: 'Đã xác nhận', v: daysOf('cf').length + ' ô', d: compress(daysOf('cf')) },
  { k: 'Trả trễ', v: daysOf('lt').length + ' ô', d: compress(daysOf('lt')), bad: true },
  { k: 'Tạm giữ', v: daysOf('dp').length + ' ô', d: compress(daysOf('dp')), bad: true },
  { k: 'Chủ đồ khóa', v: daysOf('ow').length + ' ô', d: compress(daysOf('ow')) },
  { k: 'Còn trống', v: freeDays.value.length + ' ô', d: compress(freeDays.value) },
])

// ----- bảng mốc -----
function fmtRange(a, b) {
  const x = dayjs(a), y = dayjs(b)
  if (a === b) return x.format('DD/MM')
  if (x.format('MM') === y.format('MM')) return x.format('DD') + '–' + y.format('DD/MM')
  return x.format('DD/MM') + '–' + y.format('DD/MM')
}
const events = computed(() => (data.value ? [...data.value.events] : []).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)))

// ----- chọn trên lịch → điền form khóa -----
watch(selection, (s) => {
  if (s && s.start) { form.from = s.start; form.to = s.end || s.start; formError.value = '' }
})
function pickProduct(key) {
  const id = Number(key)
  if (!id || id === sel.value) return
  sel.value = id; selection.value = { start: null, end: null }; formError.value = ''; calKey.value++
  load(false)
}
function goToday() { calKey.value++ }

async function addLock() {
  formError.value = ''
  if (!form.from || !form.to) { formError.value = 'Chọn đủ ngày bắt đầu và kết thúc'; return }
  if (form.to < form.from) { formError.value = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'; return }
  if (form.from < today.value) { formError.value = 'Chỉ khóa được các ngày từ hôm nay (' + dayjs(today.value).format('DD/MM/YYYY') + ') trở đi'; return }
  const clash = calRanges.value.find((r) => form.from <= r.end && r.start <= form.to)
  if (clash) { formError.value = 'Khoảng ngày này đã có đơn hoặc đã bị khóa/tạm giữ'; return }
  saving.value = true
  try {
    mockCalendar.ranges.push({start:form.from,end:form.to,cls:'ow'}); mockCalendar.events.push({start:form.from,end:form.to,blockId:Date.now(),text:form.reason || 'Chủ đồ khóa',who:'Chủ shop',chip:['Đã khóa','n'],deletable:true})
    ui.toast(`Đã khóa ${fmtRange(form.from, form.to)} cho ${current.value.name}`)
    form.from = ''; form.to = ''; form.reason = ''
    selection.value = { start: null, end: null }
    await load(true)
  } catch (e) { formError.value = errMsg(e, 'Không khóa được lịch'); ui.toast(formError.value) } finally { saving.value = false }
}
async function unlock(e) {
  if (!e.blockId) return
  saving.value = true
  try {
    mockCalendar.events = mockCalendar.events.filter(x => x.blockId !== e.blockId); mockCalendar.ranges = mockCalendar.ranges.filter(x => !(x.cls === 'ow' && x.start === e.start && x.end === e.end))
    ui.toast(`Đã mở khóa ${fmtRange(e.start, e.end)} cho ${current.value.name}`)
    await load(true)
  } catch (err) { ui.toast(errMsg(err, 'Không mở khóa được')) } finally { saving.value = false }
}
// API chưa có endpoint ghi quy tắc cho thuê (do Admin cấu hình trong system_settings)
function saveRules() { ui.toast('Quy tắc cho thuê do Admin cấu hình trong hệ thống, chủ đồ chỉ xem – chức năng lưu quy tắc riêng chưa được hỗ trợ') }
</script>

<template>
  <BoLayout role="owner" active="Lịch cho thuê" title="Lịch cho thuê" sub="Lịch minh họa theo từng bộ đồ">
    <div class="muted sm mb12">Dữ liệu minh họa · thao tác trên trang không ghi vào hệ thống.</div><LoadState :loading="loading" :error="error" @retry="load(false)" />
    <div v-if="data && !loading && !error && !products.length" class="card muted">Shop chưa có sản phẩm nào nên chưa có lịch cho thuê. Hãy đăng sản phẩm đầu tiên.</div>
    <div v-if="data && !loading && !error && products.length" class="row as">
      <div class="col fl1">
        <div class="card">
          <div class="row jb ac">
            <label class="lbl" style="margin:0">Chọn bộ đồ để xem và chỉnh lịch</label>
            <ChipTag kind="g">Lịch minh họa</ChipTag>
          </div>
          <div class="mt8"><FormField :model-value="sel" type="select" :options="productOptions" @update:modelValue="pickProduct" /></div>
          <div class="muted sm">Kho có {{ products.length }} bộ, mỗi bộ có lịch riêng. Các thay đổi chỉ hiển thị trong bản minh họa này.</div>
          <div class="div"></div>
          <div class="row g8 wrap ac">
            <span class="sm muted">Chuyển nhanh:</span>
            <a v-for="p in products" :key="p.id" @click="pickProduct(p.id)">
              <span class="chip" :class="{ n: p.id !== sel }" :style="p.id === sel ? 'background:#6B4630;color:#fff' : ''">{{ p.name }}</span>
            </a>
          </div>
        </div>

        <div class="card">
          <div class="row jb ac mb8">
            <h3 style="margin:0">Lịch {{ current.name }} · {{ String(current.title).split('– ')[1] }}</h3>
            <button type="button" class="btn o s" @click="goToday">Hôm nay</button>
          </div>
          <RentalCalendar :key="sel + '-' + calKey" v-model:selection="selection" :month="month" class="ocal" :today="today" keep-status :ranges="calRanges" :marks="marks" selectable :max-days="31" :legend="legend" />
          <div class="muted sm mt8">Ô Nhận và ô Trả đều được tô; số ngày thuê = ngày trả − ngày nhận (20 → 22 = 2 ngày). Bấm một ô trống để chọn nhanh ngày cần khóa.</div>
        </div>

        <KpiRow :items="kpis" />

        <div class="card">
          <h4>Các mốc của bộ đồ này</h4>
          <div class="tw">
            <table class="tbl">
              <thead><tr><th>Ngày</th><th>Nội dung</th><th>Người thuê</th><th>Trạng thái</th></tr></thead>
              <tbody>
                <tr v-for="(e, i) in events" :key="i + e.start + e.text">
                  <td><span style="white-space:nowrap">{{ fmtRange(e.start, e.end) }}</span></td>
                  <td><template v-if="e.code"><b>{{ e.code }}</b> · </template>{{ e.text }}</td>
                  <td>{{ e.who }}</td>
                  <td>
                    <ChipTag :kind="e.chip[1]">{{ e.chip[0] }}</ChipTag>
                    <a v-if="e.deletable && e.blockId" class="sm b" style="color:#6B4630;margin-left:8px" @click="unlock(e)">Mở khóa</a>
                  </td>
                </tr>
                <tr v-if="!events.length"><td colspan="4" class="muted">Chưa có mốc nào.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col" style="width:340px;flex:none">
        <div class="card">
          <h4>Khóa lịch riêng</h4>
          <div class="muted sm mb8">Dùng khi bạn tự dùng bộ đồ, đi sự kiện hoặc cần nghỉ cho thuê.</div>
          <FormField v-model="form.from" label="Từ ngày" type="date" />
          <FormField v-model="form.to" label="Đến ngày" type="date" />
          <FormField v-model="form.reason" label="Lý do (chỉ mình bạn thấy)" placeholder="Ví dụ: đi sự kiện cosplay" :error="formError" />
          <div class="mt12"><button type="button" class="btn w" :disabled="saving" @click="addLock">Khóa các ngày này</button></div>
        </div>
        <div class="card">
          <h4>Quy tắc cho thuê</h4>
          <div v-for="r in data.rules" :key="r[0]" class="rw"><span>{{ r[0] }}</span><span>{{ r[1] }}</span></div>
          <div class="mt12"><button type="button" class="btn o w" @click="saveRules">Lưu quy tắc</button></div>
        </div>
        <div class="card tint"><b class="sm">Đơn chờ xác nhận tự giữ chỗ trong 12 giờ. Từ chối hoặc quá hạn thì các ngày đó mở lại cho khách khác.</b></div>
      </div>
    </div>
  </BoLayout>
</template>

<style>
/* Lịch chủ đồ: màu theo wireframe (.mc) */
.ocal .cal-head { margin-bottom: 10px; }
.ocal .cal-head .nav-btn { width: 34px; height: 34px; border-radius: 50%; border: 0; background: #F1EADF; color: #6B4630; font-weight: 700; font-size: 16px; }
.ocal .cal-head b { font-family: 'Merriweather', serif; font-size: 15px; }
.ocal .cal-day { background: #F1EADF; border: 0; color: #2B211B; }
.ocal .cal-day.free:hover { box-shadow: 0 0 0 1.5px #6B4630 inset; }
.ocal .cal-day.pst { background: #F6F1E9; color: #B9A78F; }
.ocal .cal-day.hs { background: #EFE6D8; color: #8C7A68; }
.ocal .cal-day.ow { background: #CDBFAE; color: #4A3B30; text-decoration: none; }
.ocal .cal-day.se { background: #6B4630; color: #fff; font-weight: 700; }
.ocal .cal-day.cf { background: #6B4630; color: #fff; font-weight: 700; }
.ocal .cal-day.lt { background: #B5432F; color: #fff; font-weight: 700; }
.ocal .cal-day.dp { background: #F5C9C2; color: #8F1D14; font-weight: 700; }
.ocal .cal-day.pd { background: #F3D9A0; color: #6B4200; font-weight: 700; }
.ocal .cal-day.td { box-shadow: 0 0 0 2px #2B211B inset; }
.ocal .cal-legend { gap: 6px 14px; }
</style>
