<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import ModalBox from '@/components/ModalBox.vue'
import FormField from '@/components/FormField.vue'
import RevenueBars from '@/components/owner/RevenueBars.vue'
import LoadState from '@/components/LoadState.vue'
import { useUiStore } from '@/stores/ui'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'
import { vnd } from '@/utils/format'

const ui = useUiStore()
const w = ref(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const accountId = ref('')
const amountText = ref('')

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    w.value = await ownerService.wallet()
    const accs = w.value.payoutAccounts || []
    if (!accs.some((a) => String(a.id) === String(accountId.value))) {
      const def = accs.find((a) => a.isDefault) || accs[0]
      accountId.value = def ? def.id : ''
    }
  } catch (e) {
    const m = errMsg(e, 'Không tải được dữ liệu ví')
    if (silent) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const minWithdraw = computed(() => (w.value ? w.value.minWithdraw : 0))
const available = computed(() => (w.value ? w.value.available : 0))
const accounts = computed(() => (w.value ? w.value.payoutAccounts || [] : []))
const bankOptions = computed(() => accounts.value.map((a) => ({ value: a.id, label: a.label })))
const bankLabel = computed(() => { const a = accounts.value.find((x) => String(x.id) === String(accountId.value)); return a ? a.label : '' })
const amount = computed(() => Number(String(amountText.value).replace(/[^\d]/g, '')) || 0)
// Kiểm tra số tiền nhập: trống / dưới mức tối thiểu / vượt số dư khả dụng
const amountError = computed(() => {
  if (!amountText.value) return ''
  if (amount.value < minWithdraw.value) return `Số tiền rút tối thiểu ${vnd(minWithdraw.value)}`
  if (amount.value > available.value) return `Vượt số dư khả dụng (${vnd(available.value)})`
  return ''
})
const canSubmit = computed(() => !!accountId.value && amount.value >= minWithdraw.value && amount.value <= available.value)
const placeholder = computed(() => `Nhập số tiền, tối đa ${vnd(available.value)} khả dụng`)
const noticeText = computed(() => {
  if (!accounts.value.length) return 'Bạn chưa có tài khoản nhận tiền – bấm "Quản lý" để thêm tài khoản ngân hàng.'
  if (available.value < minWithdraw.value) return `Số dư khả dụng ${vnd(available.value)} (dưới mức tối thiểu ${vnd(minWithdraw.value)}) nên chưa thể gửi yêu cầu rút tiền.`
  return ''
})
const pendingNote = computed(() => {
  const o = w.value ? w.value.pendingOrders || [] : []
  return o.length ? `${o.length} đơn chưa hoàn tất: ${o.map((c) => String(c).split('-').pop()).join(', ')}` : 'Không có đơn nào đang chờ nhả'
})

async function submit() {
  if (!canSubmit.value) { ui.toast(amountError.value || noticeText.value || 'Nhập số tiền rút hợp lệ'); return }
  busy.value = true
  try {
    const r = await ownerService.withdraw(amount.value, Number(accountId.value))
    amountText.value = ''
    ui.toast(`Đã gửi yêu cầu rút tiền – Admin duyệt trong ${r.approveHours || w.value.approveHours} giờ`)
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được yêu cầu rút tiền')) } finally { busy.value = false }
}
async function exportCsv() {
  try {
    const blob = await ownerService.exportWalletCsv()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'lich-su-giao-dich.csv'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    ui.toast('Đã xuất báo cáo giao dịch (CSV)')
  } catch (e) { ui.toast(errMsg(e, 'Không xuất được báo cáo')) }
}

// ----- Quản lý tài khoản nhận tiền -----
const showBank = ref(false)
const banks = ref(['Vietcombank', 'Techcombank', 'MB Bank', 'BIDV', 'VPBank'])
const nb = reactive({ bankName: 'Vietcombank', accountNumber: '', accountName: '', isDefault: false })
const bankBusy = ref(false)
async function manageBank() {
  showBank.value = true
  try { const m = await ownerService.meta(); if (m.banks && m.banks.length) { banks.value = m.banks; nb.bankName = m.banks[0] } } catch { /* dùng danh sách mặc định */ }
}
async function addBank() {
  const no = nb.accountNumber.replace(/\s/g, '')
  if (!/^\d{8,16}$/.test(no)) { ui.toast('Số tài khoản gồm 8–16 chữ số'); return }
  if (!nb.accountName.trim()) { ui.toast('Nhập tên chủ tài khoản'); return }
  bankBusy.value = true
  try {
    await ownerService.addPayoutAccount({ bankName: nb.bankName, accountNumber: no, accountName: nb.accountName.trim().toUpperCase(), isDefault: nb.isDefault || !accounts.value.length })
    nb.accountNumber = ''; nb.accountName = ''; nb.isDefault = false
    ui.toast('Đã thêm tài khoản nhận tiền')
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không thêm được tài khoản')) } finally { bankBusy.value = false }
}
async function setDefault(a) {
  bankBusy.value = true
  try { await ownerService.updatePayoutAccount(a.id, { isDefault: true }); ui.toast('Đã đặt làm tài khoản mặc định'); await load(true) } catch (e) { ui.toast(errMsg(e, 'Không đổi được tài khoản mặc định')) } finally { bankBusy.value = false }
}
async function removeBank(a) {
  bankBusy.value = true
  try { await ownerService.deletePayoutAccount(a.id); ui.toast('Đã xóa tài khoản'); await load(true) } catch (e) { ui.toast(errMsg(e, 'Không xóa được tài khoản')) } finally { bankBusy.value = false }
}
</script>

<template>
  <BoLayout role="owner" active="Doanh thu & rút tiền" title="Doanh thu &amp; rút tiền">
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load(false)" />
      <template v-if="w && !loading && !error">
      <div class="row">
        <div class="card kpi"><div class="k">Khả dụng</div><div class="v">{{ vnd(available) }}</div><div class="d" style="color:#6F5F52">{{ vnd(w.pendingWithdrawTotal) }} đang chờ duyệt rút</div></div>
        <div class="card kpi"><div class="k">Đang chờ nhả</div><div class="v">{{ vnd(w.pendingRelease) }}</div><div class="d" style="color:#6F5F52">{{ pendingNote }}</div></div>
        <div class="card kpi"><div class="k">Đã rút tháng này</div><div class="v">{{ vnd(w.withdrawnMonth) }}</div><div class="d" style="color:#6F5F52">{{ w.withdrawCountMonth }} lần rút (+{{ w.pendingWithdrawCount }} đang chờ duyệt)</div></div>
      </div>

      <div class="row as">
        <div class="card fl1">
          <h3>Rút tiền</h3>
          <div class="col g12">
            <div>
              <label class="lbl">Số tiền rút (tối thiểu {{ vnd(minWithdraw) }})</label>
              <input v-model="amountText" class="inp" inputmode="numeric" :placeholder="placeholder">
              <div v-if="amountError" class="sm mt8" style="color:#B5432F">{{ amountError }}</div>
              <div v-else-if="noticeText" class="muted sm mt8">{{ noticeText }}</div>
              <div v-else-if="canSubmit" class="muted sm mt8">Sẽ rút {{ vnd(amount) }} về {{ bankLabel }}</div>
            </div>
            <div>
              <label class="lbl">Ngân hàng</label>
              <select v-model="accountId" class="sel"><option v-for="b in bankOptions" :key="b.value" :value="b.value">{{ b.label }}</option></select>
            </div>
            <div class="row jb"><ChipTag kind="g">Đã xác minh</ChipTag><span class="muted">Phí rút: {{ vnd(w.withdrawFee) }} · duyệt trong {{ w.approveHours }} giờ</span></div>
            <button type="button" class="btn w" :class="{ dis: !canSubmit }" :disabled="!canSubmit || busy" @click="submit">Gửi yêu cầu rút tiền</button>
          </div>
          <div v-if="w.pendingWithdraw" class="card warn mt12" style="padding:12px">
            <div class="row jb ac">
              <div><b>{{ w.pendingWithdraw.code }}</b> · {{ vnd(w.pendingWithdraw.amount) }}<div class="muted sm">→ {{ w.pendingWithdraw.bank }}</div></div>
              <ChipTag kind="a">Chờ duyệt</ChipTag>
            </div>
          </div>
        </div>
        <div class="card fl1">
          <h3>Doanh thu 6 tháng (triệu đồng)</h3>
          <RevenueBars v-if="w.revenue6m.length" :data="w.revenue6m" />
          <div v-else class="muted">Chưa có dữ liệu doanh thu.</div>
          <div class="div"></div>
          <div class="row jb ac"><b>Tài khoản ngân hàng</b><button type="button" class="btn s o" @click="manageBank">Quản lý</button></div>
          <div v-for="a in accounts" :key="a.id" class="rw"><span>{{ a.bankName }} {{ a.accountNumber }}</span><ChipTag v-if="a.isDefault" kind="g">Mặc định</ChipTag></div>
          <div v-if="!accounts.length" class="muted sm mt8">Chưa có tài khoản nhận tiền.</div>
        </div>
      </div>

      <div class="row jb ac">
        <h3 style="font-size:16px">Lịch sử giao dịch</h3>
        <button type="button" class="btn s o" @click="exportCsv">Xuất báo cáo (CSV)</button>
      </div>
      <div class="tw">
        <table class="tbl">
          <thead><tr><th>Mã GD</th><th>Ngày</th><th>Nội dung</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
          <tbody>
            <tr v-for="(t, i) in w.history" :key="t.code + i">
              <td>{{ t.code }}</td>
              <td>{{ t.date }}</td>
              <td>{{ t.text }}</td>
              <td>
                <b :style="t.tone === 'in' ? 'color:#2F6F4F' : t.tone === 'out' ? 'color:#B5432F' : ''">{{ t.amountText }}</b>
                <span v-if="t.note" class="muted sm"> {{ t.note }}</span>
              </td>
              <td><ChipTag :kind="t.chip[1]">{{ t.chip[0] }}</ChipTag></td>
            </tr>
            <tr v-if="!w.history.length"><td colspan="5" class="muted">Chưa có giao dịch nào.</td></tr>
          </tbody>
        </table>
      </div>
      </template>
    </div>
    <ModalBox v-model="showBank" title="Tài khoản nhận tiền">
      <div v-for="a in accounts" :key="a.id" class="rw">
        <span>{{ a.label }}</span>
        <span class="row g8 ac">
          <ChipTag v-if="a.isDefault" kind="g">Mặc định</ChipTag>
          <button v-else type="button" class="btn s o" :disabled="bankBusy" @click="setDefault(a)">Đặt mặc định</button>
          <button type="button" class="btn s ro" :disabled="bankBusy" @click="removeBank(a)">Xóa</button>
        </span>
      </div>
      <div v-if="!accounts.length" class="muted">Chưa có tài khoản nhận tiền nào.</div>
      <div class="div"></div>
      <b>Thêm tài khoản</b>
      <FormField v-model="nb.bankName" label="Ngân hàng" type="select" :options="banks" />
      <FormField v-model="nb.accountNumber" label="Số tài khoản" placeholder="8–16 chữ số" />
      <FormField v-model="nb.accountName" label="Chủ tài khoản" placeholder="Trùng họ tên trên CCCD" />
      <div class="ck" :class="{ on: nb.isDefault }" style="cursor:pointer" @click="nb.isDefault = !nb.isDefault"><i></i>Đặt làm mặc định</div>
      <template #footer>
        <button type="button" class="btn o" @click="showBank = false">Đóng</button>
        <button type="button" class="btn" :disabled="bankBusy" @click="addBank">Thêm tài khoản</button>
      </template>
    </ModalBox>
  </BoLayout>
</template>
