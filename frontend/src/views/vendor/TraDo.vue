<script setup>
import { ref, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import KpiRow from '@/components/KpiRow.vue'
import TabsBar from '@/components/TabsBar.vue'
import TimelineList from '@/components/TimelineList.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { errCode, errMsg } from '@/services/http'
import { RETURN_TABS, RETURN_FLOW } from '@/config/ownerUi'

import { mockReturns, copyMock } from '../../../mock/vendor'
const ui = useUiStore()
const data = ref(null)
const rows = ref([])
const loading = ref(true)
const error = ref('')
const tab = ref('all')

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const d = copyMock(mockReturns)
    data.value = d
    rows.value = d.rows.map((r) => ({ ...r, done: false, busy: false }))
  } catch (e) {
    const m = errMsg(e, 'Không tải được danh sách trả đồ')
    if (silent) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const tabs = computed(() => RETURN_TABS.map((t) => ({ key: t.key, label: t.label, count: t.key === 'all' ? rows.value.length : rows.value.filter((r) => r.group === t.key).length })))
const shown = computed(() => (tab.value === 'all' ? rows.value : rows.value.filter((r) => r.group === tab.value)))
const kpis = computed(() => {
  const k = data.value ? data.value.kpis : null
  if (!k) return []
  return [
    { k: 'Sắp đến hạn trả', v: String(k.dueSoon), d: k.dueSoonNote },
    { k: 'Đang trễ', v: String(k.late), d: k.late ? 'Có đơn trễ' : 'Không có đơn trễ' },
    { k: 'Chờ kiểm tra sau trả', v: String(k.check), d: k.checkNote, bad: true },
    { k: 'Nhận lại tháng này', v: String(k.receivedMonth), d: k.receivedMonthNote },
  ]
})
const flow = computed(() => RETURN_FLOW.map((x) => (x.title.startsWith('Kiểm tra trong') && data.value ? { ...x, title: 'Kiểm tra trong ' + data.value.inspectionHours + ' giờ' } : x)))

async function remind(r) {
  r.busy = true
  try {
    // Chỉ đánh dấu trên giao diện minh họa.
    r.done = true
    ui.toast(`Minh họa nhắc ${r.renter} trả đồ đúng hạn`)
  } catch (e) {
    if (errCode(e) === 'already_reminded') r.done = true
    ui.toast(errMsg(e, 'Không gửi được lời nhắc'))
  } finally { r.busy = false }
}
</script>

<template>
  <BoLayout role="owner" active="Theo dõi trả đồ" title="Theo dõi trả đồ" sub="Đơn sắp đến hạn, trả trễ và chờ kiểm tra sau trả">
    <div class="col">
      <div class="muted sm mb12">Dữ liệu minh họa · thao tác trên trang không ghi vào hệ thống.</div><LoadState :loading="loading" :error="error" @retry="load(false)" />
      <template v-if="data && !loading && !error">
      <KpiRow :items="kpis" />
      <TabsBar v-model="tab" :tabs="tabs" />
      <div class="tw">
        <table class="tbl">
          <thead><tr><th>Đơn</th><th>Sản phẩm</th><th>Người thuê</th><th>Hạn trả</th><th>Nhận lại bằng</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            <tr v-for="r in shown" :key="r.code">
              <td><b>{{ r.code }}</b></td>
              <td>{{ r.product }}</td>
              <td>{{ r.renter }}</td>
              <td>{{ r.due }}</td>
              <td>{{ r.via }}</td>
              <td><ChipTag :kind="r.kind">{{ r.label }}</ChipTag><div class="muted sm mt8">{{ r.sub }}</div></td>
              <td>
                <RouterLink v-if="r.action === 'view'" class="btn s" :class="{ o: !r.primary }" :to="{ name: 'ChuDonChiTiet', query: { code: r.code } }">Xem đơn</RouterLink>
                <button v-else-if="r.action === 'remind'" type="button" class="btn s o" :disabled="r.done || r.busy" @click="remind(r)">{{ r.done ? 'Đã nhắc' : 'Nhắc khách' }}</button>
                <RouterLink v-else class="btn s o" :to="{ name: 'ChuDonChiTiet', query: { code: r.code } }">Theo dõi giao</RouterLink>
              </td>
            </tr>
            <tr v-if="!shown.length"><td colspan="7" class="muted">Không có đơn nào trong mục này.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="row as">
        <div class="card warn fl1">
          <b>Khi khách trả trễ</b>
          <div class="muted mt8">Phí trễ {{ data.lateFeeRate }}% giá thuê/ngày tự trừ vào cọc. Trễ quá 3 ngày không liên lạc được, bạn có thể mở tranh chấp.</div>
        </div>
        <div class="card fl1"><h4>Quy trình nhận lại đồ</h4><TimelineList :items="flow" /></div>
        <div class="card tint fl1">
          <b>Ảnh/video có mốc thời gian</b>
          <div class="muted mt8">Ảnh lúc nhận và lúc trả được Clarity gắn giờ hệ thống, làm bằng chứng khi có tranh chấp.</div>
        </div>
      </div>
      </template>
    </div>
  </BoLayout>
</template>
