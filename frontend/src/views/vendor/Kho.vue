<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import KpiRow from '@/components/KpiRow.vue'
import TabsBar from '@/components/TabsBar.vue'
import ImgPh from '@/components/ImgPh.vue'
import ModalBox from '@/components/ModalBox.vue'
import FormField from '@/components/FormField.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { errMsg } from '@/services/http'
import { INVENTORY_STATUS, INVENTORY_TABS, INVENTORY_NOTES } from '@/config/ownerUi'

import { mockInventory, copyMock } from '../../../mock/vendor'
const ui = useUiStore()
const items = ref([])
const shopName = ref('')
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const tab = ref('all')
const selectedId = ref(0)

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const [list, name] = [copyMock(mockInventory), 'Mochi Cosplay']
    items.value = list; shopName.value = name
    if (!list.some((i) => i.id === selectedId.value)) selectedId.value = list.length ? list[0].id : 0
  } catch (e) {
    const m = errMsg(e, 'Không tải được kho hàng')
    if (silent) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const selected = computed(() => items.value.find((i) => i.id === selectedId.value) || items.value[0] || null)
const info = (it) => [it.statusLabel || (INVENTORY_STATUS[it.status] || [it.status])[0], it.statusKind || (INVENTORY_STATUS[it.status] || [0, 'n'])[1]]
const countOf = (statuses) => (statuses ? items.value.filter((i) => statuses.includes(i.status)).length : items.value.length)
const tabs = computed(() => INVENTORY_TABS.map((t) => ({ key: t.key, label: t.label, count: countOf(t.statuses) })))
const shown = computed(() => {
  const t = INVENTORY_TABS.find((x) => x.key === tab.value)
  return t && t.statuses ? items.value.filter((i) => t.statuses.includes(i.status)) : items.value
})
const short = (code) => String(code || '').split('-').pop()
const kpis = computed(() => [
  { k: 'Tổng số bộ', v: String(items.value.length), d: shopName.value },
  { k: 'Sẵn sàng', v: String(countOf(['READY'])), d: items.value.filter((i) => i.status === 'READY').map((i) => i.name).join(', ') || '—' },
  { k: 'Đang thuê/giao', v: String(countOf(['SHIPPING', 'RENTING'])), d: items.value.filter((i) => ['SHIPPING', 'RENTING'].includes(i.status) && i.orderCode).map((i) => short(i.orderCode)).join(', ') || '—' },
  { k: 'Đang giữ', v: String(countOf(['HOLD'])), d: items.value.filter((i) => i.status === 'HOLD' && i.disputeCode).map((i) => i.disputeCode).join(', ') || '—', bad: true },
])
const accessories = computed(() => (selected.value && selected.value.accessories) || [])
const note = computed(() => (selected.value ? selected.value.note || INVENTORY_NOTES[selected.value.status] || '' : ''))
// Chủ đồ chỉ tự đặt: Sẵn sàng / Giặt-bảo trì / Ngừng. HOLD, SHIPPING, RENTING do đơn thuê tự đồng bộ (giữ nguyên nếu bộ đồ đang ở trạng thái đó).
const SYSTEM_STATUS = ['HOLD', 'SHIPPING', 'RENTING']
const statusOptions = computed(() => Object.keys(INVENTORY_STATUS)
  .filter((k) => !SYSTEM_STATUS.includes(k) || (selected.value && k === selected.value.status))
  .map((k) => ({ value: k, label: INVENTORY_STATUS[k][0] })))

const showEdit = ref(false)
const edit = reactive({ status: 'READY', location: '' })
function openEdit(it) {
  selectedId.value = it.id
  edit.status = it.status
  edit.location = it.location === '—' ? '' : it.location
  showEdit.value = true
}
async function patch(it, body, okMsg) {
  saving.value = true
  try {
    Object.assign(mockInventory.find(x => x.id === it.id), body)
    showEdit.value = false
    ui.toast('Minh họa: ' + okMsg)
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không cập nhật được kho hàng')) } finally { saving.value = false }
}
function saveEdit() {
  const it = selected.value
  if (!it) return
  const body = {}
  if (edit.status !== it.status) body.status = edit.status
  const loc = edit.location.trim()
  if (loc !== (it.location === '—' ? '' : it.location)) body.location = loc
  if (!Object.keys(body).length) { showEdit.value = false; ui.toast('Không có thay đổi nào để lưu'); return }
  patch(it, body, 'Đã cập nhật ' + it.code)
}
function toWash() {
  const it = selected.value
  if (!it) return
  if (SYSTEM_STATUS.includes(it.status)) { ui.toast(it.code + ' đang ' + info(it)[0].toLowerCase() + ' – chưa thể chuyển sang giặt / bảo trì'); return }
  if (it.status === 'WASH') { ui.toast(it.code + ' đã ở trạng thái giặt / bảo trì'); return }
  patch(it, { status: 'WASH' }, it.code + ' chuyển sang giặt / bảo trì – lịch tự chặn')
}
</script>

<template>
  <BoLayout role="owner" active="Kho hàng" title="Kho hàng" sub="Theo dõi từng bộ đồ: tình trạng, phụ kiện, vị trí và lịch sử thuê">
    <template #actions><RouterLink class="btn" :to="{ name: 'ChuDangSP' }">+ Thêm bộ đồ vào kho</RouterLink></template>
    <div class="muted sm mb12">Dữ liệu minh họa · thao tác trên trang không ghi vào hệ thống.</div><LoadState :loading="loading" :error="error" @retry="load(false)" />
    <div v-if="!loading && !error && !items.length" class="card muted">Kho chưa có bộ đồ nào. Hãy đăng sản phẩm đầu tiên của shop.</div>
    <div v-if="!loading && !error && selected" class="row as">
      <div class="col fl1">
        <KpiRow :items="kpis" />
        <TabsBar v-model="tab" :tabs="tabs" />
        <div class="tw">
          <table class="tbl">
            <thead><tr><th>Mã kho</th><th>Sản phẩm</th><th>Tình trạng kho</th><th>Vị trí</th><th>Lượt thuê</th><th></th></tr></thead>
            <tbody>
              <tr v-for="it in shown" :key="it.id" :class="{ hl: it.id === selectedId }" style="cursor:pointer" @click="selectedId = it.id">
                <td><b>{{ it.code }}</b></td>
                <td>{{ it.name }}</td>
                <td><ChipTag :kind="info(it)[1]">{{ info(it)[0] }}</ChipTag></td>
                <td>{{ it.location }}</td>
                <td>{{ it.rentals }}</td>
                <td><a class="btn s o" @click.stop="openEdit(it)">Sửa</a></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card tint">
          <b>Trạng thái kho tự đồng bộ với đơn thuê</b>
          <div class="muted mt8">Khi đơn chuyển sang "Đang giao / Đang thuê / Kiểm tra sau trả", bộ đồ tự chuyển trạng thái và khóa lịch cho khách khác. Bộ đồ chuyển sang "Đang giặt / bảo trì" sẽ tự chặn ngày trên lịch cho thuê.</div>
        </div>
      </div>
      <div class="card" style="width:310px;flex:none">
        <div class="row jb ac mb8"><h3 style="margin:0">{{ selected.code }}</h3><ChipTag :kind="info(selected)[1]">{{ info(selected)[0] }}</ChipTag></div>
        <div class="muted mb12">{{ note }}</div>
        <label class="lbl">Danh sách phụ kiện ({{ accessories.length }})</label>
        <div v-for="a in accessories" :key="a[0]" class="rw"><span>{{ a[0] }}</span><span><ChipTag :kind="a[2]">{{ a[1] }}</ChipTag></span></div>
        <div v-if="!accessories.length" class="muted sm">Chưa có danh sách phụ kiện.</div>
        <div class="row g8 mt12">
          <ImgPh label="Hiện trạng 23/10" :h="70" style="flex:1" />
          <ImgPh label="Hiện trạng 20/10" :h="70" style="flex:1" />
        </div>
        <div class="muted sm mt8">Ảnh/video hiện trạng tự gắn mốc thời gian và không sửa được sau khi tải lên.</div>
        <div class="col g8 mt12">
          <button type="button" class="btn w" :disabled="saving" @click="openEdit(selected)">Cập nhật tình trạng &amp; phụ kiện</button>
          <button type="button" class="btn o w" :disabled="saving" @click="toWash">Chuyển sang giặt / bảo trì</button>
          <RouterLink class="btn o w" :to="{ name: 'ChuLich', query: { productId: selected.productId } }">Xem lịch bộ đồ này</RouterLink>
        </div>
      </div>
    </div>

    <ModalBox v-model="showEdit" :title="'Cập nhật ' + (selected ? selected.code : '')">
      <FormField v-model="edit.status" label="Tình trạng kho" type="select" :options="statusOptions" />
      <FormField v-model="edit.location" label="Vị trí" placeholder="Ví dụ: Kệ A2" />
      <template #footer>
        <button type="button" class="btn o" @click="showEdit = false">Hủy</button>
        <button type="button" class="btn" :disabled="saving" @click="saveEdit">Lưu</button>
      </template>
    </ModalBox>
  </BoLayout>
</template>
