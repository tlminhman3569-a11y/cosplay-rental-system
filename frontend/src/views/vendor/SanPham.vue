<script setup>
import { ref, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import TabsBar from '@/components/TabsBar.vue'
import ImgPh from '@/components/ImgPh.vue'
import LoadState from '@/components/LoadState.vue'
import { useUiStore } from '@/stores/ui'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'
import { PRODUCT_TABS } from '@/config/ownerUi'
import { vnd } from '@/utils/format'

const ui = useUiStore()
const rows = ref([])
const shopName = ref('')
const loading = ref(true)
const error = ref('')
const busyId = ref(0)
const tab = ref('all')

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const [list, name] = await Promise.all([ownerService.products('ALL'), ownerService.shopName()])
    rows.value = list; shopName.value = name
  } catch (e) {
    const m = errMsg(e, 'Không tải được danh sách sản phẩm')
    if (silent) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const tabs = computed(() => PRODUCT_TABS.map((t) => ({ key: t.key, label: t.label, count: t.key === 'all' ? rows.value.length : rows.value.filter((r) => r.displayStatus === t.key).length })))
const shown = computed(() => (tab.value === 'all' ? rows.value : rows.value.filter((r) => r.displayStatus === tab.value)))
const rejected = computed(() => rows.value.find((r) => r.displayStatus === 'REJECTED'))
const reported = computed(() => rows.value.find((r) => r.displayStatus === 'REPORTED'))
const shortName = (n) => String(n || '').split(' – ')[0].replace('Cosplay ', '')
const sub = computed(() => rows.value.length + ' sản phẩm' + (shopName.value ? ' của ' + shopName.value : ''))

async function toggleHide(r) {
  if (!r.canHide && !r.canShow) { ui.toast('Sản phẩm ' + r.sku + ' đang ở trạng thái "' + r.statusLabel + '" nên chưa thể ẩn / hiện'); return }
  busyId.value = r.id
  try {
    if (r.canShow) { await ownerService.showProduct(r.id); ui.toast('Đã hiện lại sản phẩm ' + r.sku) } else { await ownerService.hideProduct(r.id); ui.toast('Đã ẩn sản phẩm ' + r.sku) }
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không đổi được trạng thái sản phẩm')) } finally { busyId.value = 0 }
}
</script>

<template>
  <BoLayout role="owner" active="Sản phẩm của tôi" title="Sản phẩm của tôi" :sub="loading ? '' : sub">
    <template #actions><RouterLink class="btn" :to="{ name: 'ChuDangSP' }">+ Đăng sản phẩm</RouterLink></template>
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load(false)" />
      <template v-if="!loading && !error">
        <TabsBar v-model="tab" :tabs="tabs" />
        <div v-if="rejected" class="card err">
          <div class="row g12 as">
            <b>Lý do từ chối – {{ rejected.sku }} {{ shortName(rejected.name) }}:</b>
            <div class="fl1">{{ rejected.note }}</div>
            <RouterLink class="btn s r" :to="{ name: 'ChuDangSP', query: { id: rejected.id } }">Sửa &amp; gửi lại</RouterLink>
          </div>
        </div>
        <div v-if="reported" class="card warn">
          <div class="row g12 as"><b>Cảnh báo – {{ reported.sku }} {{ shortName(reported.name) }}:</b><div class="fl1">{{ reported.reportNote }}</div></div>
        </div>
        <div class="tw">
          <table class="tbl">
            <thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Giá/ngày</th><th>Cọc</th><th>Trạng thái</th><th>Lượt thuê</th><th>Hành động</th></tr></thead>
            <tbody>
              <tr v-for="r in shown" :key="r.id">
                <td>
                  <ImgPh label="Ảnh" :src="r.image" :w="48" :h="60" />
                </td>
                <td><b style="white-space:normal">{{ r.name }}</b><div class="muted sm">{{ r.sku }}</div></td>
                <td>{{ vnd(r.price) }}</td>
                <td>{{ vnd(r.deposit) }}</td>
                <td>
                  <ChipTag :kind="r.statusKind">{{ r.statusLabel }}</ChipTag>
                  <div v-if="r.displayStatus === 'REPORTED'" class="muted sm">{{ r.reportCount }} báo cáo</div>
                </td>
                <td>{{ r.rentals }} lượt</td>
                <td>
                  <div class="row g8">
                    <RouterLink class="btn s o" :to="{ name: 'ChuDangSP', query: { id: r.id } }">Sửa</RouterLink>
                    <button type="button" class="btn s o" :disabled="busyId === r.id || (!r.canHide && !r.canShow)" @click="toggleHide(r)">{{ r.canShow ? 'Hiện' : 'Ẩn' }}</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!shown.length"><td colspan="7" class="muted">Không có sản phẩm nào trong mục này.</td></tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </BoLayout>
</template>
