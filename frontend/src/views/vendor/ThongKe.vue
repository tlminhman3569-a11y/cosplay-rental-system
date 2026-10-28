<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import BoLayout from '@/layouts/BoLayout.vue'
import KpiRow from '@/components/KpiRow.vue'
import FormField from '@/components/FormField.vue'
import BarChart from '@/components/owner/BarChart.vue'
import DonutChart from '@/components/owner/DonutChart.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { vendorService } from '@/services/vendorService'
import { errMsg } from '@/services/http'
import { vnd, iso } from '@/utils/format'
import { STATS_RANGES } from '@/config/ownerUi'

const ui = useUiStore()
const range = ref('month')
const todayIso = iso(new Date())
const from = ref(todayIso.slice(0, 7) + '-01')
const to = ref(todayIso)
const data = ref(null)
const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
let seq = 0

async function load(key, params) {
  const my = ++seq
  if (data.value) refreshing.value = true; else loading.value = true
  error.value = ''
  try {
    const res = await vendorService.stats({ range: key, ...(params || {}) })
    if (my !== seq) return
    data.value = res
    range.value = key
    if (res.range) { from.value = res.range.from || from.value; to.value = res.range.to || to.value }
  } catch (e) {
    if (my !== seq) return
    const m = errMsg(e, 'Không tải được thống kê')
    if (data.value) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { if (my === seq) { loading.value = false; refreshing.value = false } }
}
onMounted(() => load('month'))

const bars = computed(() => (data.value ? data.value.bars : []))
const total = computed(() => bars.value.reduce((s, b) => s + b.value, 0))
const kpis = computed(() => {
  const k = data.value ? data.value.kpis : null
  if (!k) return []
  return [
    { k: 'Doanh thu nhận (sau phí)', v: vnd(k.revenue), d: k.delta },
    { k: 'Đơn trong kỳ', v: String(k.orders), d: k.done + ' đơn hoàn tất' },
    { k: 'Điểm đánh giá', v: k.rating, d: k.reviews + ' đánh giá' },
    { k: 'Tỷ lệ tranh chấp', v: k.dispute, d: k.disputeOf, bad: true },
  ]
})
const productSlices = computed(() => (data.value ? data.value.products : []).map((p) => ({ label: p.label, value: p.value, color: p.color, detail: vnd(p.value) })))
const statusSlices = computed(() => (data.value ? data.value.orderStatus : []).filter((s) => s.value > 0).map((s) => ({ label: s.label, value: s.value, color: s.color, detail: s.value + ' đơn' })))
const totalMillions = computed(() => (total.value / 1000000).toFixed(2).replace(/0$/, '').replace('.', ',') + ' tr')
const ordersTotal = computed(() => String(data.value ? data.value.kpis.orders : 0))

function pick(key) {
  if (key === 'custom') { applyCustom(); return }
  load(key)
}
function applyCustom() {
  if (!from.value || !to.value) { ui.toast('Chọn đủ từ ngày và đến ngày'); return }
  if (to.value < from.value) { ui.toast('Đến ngày phải sau hoặc bằng từ ngày'); return }
  if (to.value > todayIso) { ui.toast('Đến ngày không được sau hôm nay (' + dayjs(todayIso).format('DD/MM/YYYY') + ')'); return }
  load('custom', { from: from.value, to: to.value })
}
// API chưa có endpoint xuất báo cáo thống kê
function exportExcel() { ui.toast('Xuất Excel chưa được hỗ trợ – hiện chỉ xuất được lịch sử giao dịch (CSV) ở mục Doanh thu & rút tiền') }
function exportPdf() { ui.toast('Xuất PDF chưa được hỗ trợ trên bản này') }
</script>

<template>
  <BoLayout role="owner" active="Thống kê" title="Thống kê shop" sub="Biểu đồ cột theo khoảng ngày tùy chọn và biểu đồ tròn cơ cấu doanh thu / đơn thuê">
    <template #actions>
      <button type="button" class="btn o s" @click="exportExcel">Xuất Excel</button>
      <button type="button" class="btn s" @click="exportPdf">Xuất PDF</button>
    </template>
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load(range)" />
      <template v-if="data && !loading && !error">
      <div class="card">
        <div class="row jb ac wrap g12">
          <div class="row g8 ac">
            <b>Khoảng thời gian:</b>
            <a v-for="r in STATS_RANGES" :key="r[0]" @click="pick(r[0])"><span class="chip" :class="range === r[0] ? 'b' : 'n'">{{ r[1] }}</span></a>
          </div>
          <div class="row g12 ac" style="min-width:560px">
            <div class="fl1"><FormField v-model="from" label="Từ ngày" type="date" /></div>
            <div class="fl1"><FormField v-model="to" label="Đến ngày" type="date" /></div>
            <div style="align-self:flex-end;margin-bottom:19px"><button type="button" class="btn s" @click="applyCustom">Áp dụng</button></div>
          </div>
        </div>
        <div class="muted sm">Kỳ đang xem: {{ data.label }}<template v-if="refreshing"> · đang tải dữ liệu…</template></div>
      </div>

      <KpiRow :items="kpis" />

      <div class="row as">
        <div class="card fl1" style="flex:1.2 1 0;min-width:0">
          <h3>Doanh thu trong kỳ (biểu đồ cột)</h3>
          <BarChart :bars="bars" />
          <div class="muted sm mt8">Tổng kỳ: {{ vnd(total) }} · đơn vị đồng · khoảng ngày thay đổi theo bộ lọc phía trên</div>
        </div>
        <div class="card fl1">
          <h3>Doanh thu theo sản phẩm (biểu đồ tròn)</h3>
          <DonutChart :slices="productSlices" :center-top="totalMillions" center-bottom="tổng kỳ" />
        </div>
      </div>

      <div class="row as">
        <div class="card fl1">
          <h3>Đơn theo trạng thái (biểu đồ tròn)</h3>
          <DonutChart :slices="statusSlices" :center-top="ordersTotal" center-bottom="đơn trong kỳ" />
        </div>
        <div class="card fl1">
          <h3>Sản phẩm thuê nhiều nhất</h3>
          <div class="tw">
            <table class="tbl">
              <thead><tr><th>Sản phẩm</th><th>Lượt thuê</th><th>Doanh thu</th></tr></thead>
              <tbody>
                <tr v-for="p in data.top" :key="p.name"><td>{{ p.name }}</td><td>{{ p.rentals }}</td><td>{{ vnd(p.revenue) }}</td></tr>
                <tr v-if="!data.top.length"><td colspan="3" class="muted">Chưa có lượt thuê nào trong kỳ này.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </template>
    </div>
  </BoLayout>
</template>
