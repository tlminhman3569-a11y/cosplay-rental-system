<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import FormField from '@/components/FormField.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import LoadState from '@/components/LoadState.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'
import { ITEM_KIND_GROUPS } from '@/config/ownerUi'
import { vnd, calcOrder } from '@/utils/format'

const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const editId = computed(() => Number(route.query.id) || 0)
const DRAFT_KEY = 'clarity_owner_product_draft'
const MEASURE_RE = /\n?Số đo \(cao \/ ngực\): (.*)$/

const loading = ref(true)
const error = ref('')
const saving = ref(false)
const meta = ref(null)
const f = reactive({
  name: '', brand: '', series: '', character: '', categoryId: '', description: '',
  size: 'M', measure: '', condition: 'LIKE_NEW',
  pricePerDay: '', itemValue: '', deposit: '', minDays: 1, maxDays: 7,
  pickupArea: '', blockedDates: '', care: '',
})
const photos = ref([]) // mảng URL ảnh (/uploads/...)
const mainItems = ref([{ name: 'Trang phục chính', kind: 'MAIN' }])
const accessories = ref([])
const shipping = ref([])
const meta0 = reactive({ productType: 'COSTUME', gender: 'UNISEX', sizes: [] })
const cccdVerified = computed(() => auth.user && auth.user.verifyStatus === 'VERIFIED')

const form = computed(() => (meta.value ? meta.value.productForm : {}))
const categoryOptions = computed(() => (form.value.categories || []).map((c) => ({ value: c.id, label: c.name })))
const minRate = computed(() => form.value.minDepositRate || 0.5)
const fullFrom = computed(() => form.value.fullDepositFrom || 5000000)
const withCur = (list, cur) => (cur && !list.includes(cur) ? [...list, cur] : list)
const brandOptions = computed(() => withCur(form.value.brands || [], f.brand))
const seriesOptions = computed(() => withCur(form.value.series || [], f.series))
const sizeOptions = computed(() => withCur(form.value.sizes || ['XS', 'S', 'M', 'L', 'XL'], f.size))
const conditionOptions = computed(() => form.value.conditions || [])
const areaOptions = computed(() => withCur(meta.value ? meta.value.areas : [], f.pickupArea))
const mainNames = computed(() => mainItems.value.map((m) => m.name))

function addAccessory() { accessories.value.push({ group: 'Nhóm mới', kind: 'OTHER', name: 'Phụ kiện mới', optional: true, discount: 10000, deposit: 0 }) }
function addGroup() { accessories.value.push({ group: 'Nhóm mới', kind: 'OTHER', name: '', optional: true, discount: 0, deposit: 0 }) }
function removeAccessory(i) { accessories.value.splice(i, 1) }

// Cọc tối thiểu: 50% giá trị đồ; đồ từ 5.000.000đ yêu cầu cọc 100%
const minDeposit = computed(() => (Number(f.itemValue) >= fullFrom.value ? Number(f.itemValue) : Math.round(Number(f.itemValue) * minRate.value)))
const depositOk = computed(() => Number(f.deposit) >= minDeposit.value && Number(f.deposit) > 0)
const depositHint = computed(() => `Cọc tự tính = ${Number(f.itemValue) >= fullFrom.value ? '100' : '50'}% giá trị đồ = ${vnd(minDeposit.value)}. Đồ từ 5.000.000đ yêu cầu cọc 100%.`)
const depositError = computed(() => (depositOk.value ? '' : `Tiền cọc tối thiểu ${vnd(minDeposit.value)}`))
function autoDeposit() { f.deposit = minDeposit.value }

const preview = computed(() => calcOrder({ pricePerDay: Number(f.pricePerDay) || 0, days: 2, deposit: Number(f.deposit) || 0 }))
const checklist = computed(() => [
  ['Ít nhất 5 ảnh thật', photos.value.length >= 5],
  ['Tên & danh mục 3 cấp', !!(f.name.trim() && f.brand && f.series && f.character.trim())],
  ['Mô tả ≥ 50 ký tự', f.description.trim().length >= 50],
  ['Size & số đo', !!f.size],
  ['Giá thuê & cọc ≥ 50%', Number(f.pricePerDay) > 0 && depositOk.value],
  ['Phương thức giao ≥ 1', shipping.value.some((s) => s.on)],
  ['Hướng dẫn giặt', f.care.trim().length > 0],
  ['Xác minh CCCD', !!cccdVerified.value],
])
const doneCount = computed(() => checklist.value.filter((c) => c[1]).length)
const allDone = computed(() => doneCount.value === checklist.value.length)

function fillFromProduct(p) {
  f.name = p.name || ''
  f.brand = p.brand || ''
  f.series = p.series || ''
  f.character = p.character || ''
  const cat = (form.value.categories || []).find((c) => c.name === p.category)
  f.categoryId = cat ? cat.id : ''
  const desc = p.description || ''
  const m = desc.match(MEASURE_RE)
  f.measure = m ? m[1] : ''
  f.description = m ? desc.replace(MEASURE_RE, '') : desc
  f.size = (p.sizes && p.sizes[0]) || p.size || 'M'
  f.condition = p.conditionLevel || 'LIKE_NEW'
  f.pricePerDay = p.pricePerDay
  f.itemValue = p.itemValue || ''
  f.deposit = p.depositAmount
  f.care = p.careGuide || ''
  meta0.productType = p.productType || 'COSTUME'
  meta0.gender = p.gender || 'UNISEX'
  meta0.sizes = p.sizes || []
  photos.value = (p.images || []).slice()
  const items = p.items || []
  const mains = items.filter((it) => it.kind === 'MAIN')
  mainItems.value = mains.length ? mains.map((it) => ({ id: it.id, name: it.name, kind: 'MAIN', pricePerDay: it.pricePerDay, deposit: it.deposit })) : [{ name: 'Trang phục chính', kind: 'MAIN' }]
  accessories.value = items.filter((it) => it.kind !== 'MAIN').map((it) => ({
    id: it.id, group: it.group || 'Khác', kind: it.kind, name: it.name, optional: !it.isRequired, discount: it.pricePerDay, deposit: it.deposit,
  }))
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    Object.assign(f, d.f || {})
    if (Array.isArray(d.accessories)) accessories.value = d.accessories
    if (Array.isArray(d.photos)) photos.value = d.photos.map((x) => (typeof x === 'string' ? x : x && x.url)).filter((u) => u && !u.startsWith('/placeholder'))
    if (Array.isArray(d.shipping)) shipping.value = shipping.value.map((s) => ({ ...s, on: (d.shipping.find((x) => x.key === s.key) || s).on }))
  } catch { /* bỏ qua nháp hỏng */ }
}

async function load() {
  loading.value = true; error.value = ''
  try {
    meta.value = await ownerService.meta()
    const pf = meta.value.productForm
    shipping.value = (pf.shipping || []).map((s) => ({ key: s.key, name: s.label, on: true }))
    f.brand = (pf.brands || [])[0] || ''
    f.series = (pf.series || [])[0] || ''
    f.categoryId = (pf.categories || [])[0] ? pf.categories[0].id : ''
    f.pickupArea = (meta.value.areas || [])[0] || ''
    if (editId.value) fillFromProduct(await ownerService.product(editId.value))
    else loadDraft()
  } catch (e) {
    error.value = errMsg(e, 'Không tải được biểu mẫu sản phẩm')
    ui.toast(error.value)
  } finally { loading.value = false }
}
onMounted(load)

function buildBody() {
  const price = Number(f.pricePerDay) || 0
  const dep = Number(f.deposit) || 0
  const acc = accessories.value.filter((a) => a.name.trim())
  const accPrice = acc.reduce((s, a) => s + (Number(a.discount) || 0), 0)
  const accDeposit = acc.reduce((s, a) => s + (Number(a.deposit) || 0), 0)
  let items = []
  if (acc.length || mainItems.value.some((m) => m.id)) {
    const mains = mainItems.value.map((m) => ({ ...m }))
    const otherPrice = mains.slice(1).reduce((s, m) => s + (Number(m.pricePerDay) || 0), 0)
    const otherDep = mains.slice(1).reduce((s, m) => s + (Number(m.deposit) || 0), 0)
    mains[0].pricePerDay = Math.max(0, price - accPrice - otherPrice)
    mains[0].deposit = Math.max(0, dep - accDeposit - otherDep)
    items = [
      ...mains.map((m) => ({ ...(m.id ? { id: m.id } : {}), kind: 'MAIN', name: m.name, isRequired: true, pricePerDay: Number(m.pricePerDay) || 0, deposit: Number(m.deposit) || 0 })),
      ...acc.map((a) => {
        const g = ITEM_KIND_GROUPS.find((x) => x.group === a.group.trim())
        return { ...(a.id ? { id: a.id } : {}), kind: g ? g.kind : (a.kind || 'OTHER'), name: a.name.trim(), isRequired: !a.optional, pricePerDay: Number(a.discount) || 0, deposit: Number(a.deposit) || 0 }
      }),
    ]
  }
  const measure = f.measure.trim()
  const sizes = meta0.sizes.length && meta0.sizes[0] === f.size ? meta0.sizes : [f.size]
  return {
    name: f.name.trim(), character: f.character.trim(), series: f.series, brand: f.brand, category: Number(f.categoryId),
    productType: meta0.productType, gender: meta0.gender, conditionLevel: f.condition,
    description: f.description.trim() + (measure ? '\nSố đo (cao / ngực): ' + measure : ''),
    pricePerDay: price, depositAmount: dep, itemValue: Number(f.itemValue) || null,
    sizes, items, images: photos.value, careGuide: f.care.trim(),
  }
}

async function submit() {
  const mn = Number(f.minDays), mx = Number(f.maxDays)
  if (!(mn >= 1) || !(mx >= mn) || mx > 7) { ui.toast('Số ngày thuê không hợp lệ: tối thiểu ≥ 1, tối đa ≥ tối thiểu và không quá 7 ngày'); return }
  if (!allDone.value) { ui.toast('Chưa đủ điều kiện gửi kiểm duyệt: ' + checklist.value.filter((c) => !c[1]).map((c) => c[0]).join('; ')); return }
  if (!f.categoryId) { ui.toast('Chọn danh mục sản phẩm'); return }
  saving.value = true
  try {
    if (editId.value) await ownerService.updateProduct(editId.value, buildBody())
    else await ownerService.createProduct(buildBody())
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* bỏ qua */ }
    ui.toast('Đã gửi kiểm duyệt – Staff sẽ duyệt trong 24 giờ')
    router.push({ name: 'ChuSanPham' })
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được sản phẩm, vui lòng thử lại')) } finally { saving.value = false }
}
function saveDraft() {
  if (editId.value) { ui.toast('Sản phẩm đã có trên hệ thống – bấm "Gửi kiểm duyệt" để lưu thay đổi'); return }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: { ...f }, accessories: accessories.value, photos: photos.value, shipping: shipping.value }))
    ui.toast('Đã lưu nháp sản phẩm (trên trình duyệt này)')
  } catch { ui.toast('Không lưu được nháp trên trình duyệt này') }
}
</script>

<template>
  <BoLayout role="owner" active="Sản phẩm của tôi" title="Đăng / sửa sản phẩm" crumb="Sản phẩm của tôi › Đăng sản phẩm">
    <LoadState :loading="loading" :error="error" @retry="load" />
    <div v-if="!loading && !error" class="row as">
      <div class="col fl1">
        <div class="card">
          <h3>1. Ảnh sản phẩm</h3>
          <ImageUploader v-model="photos" :max="20" label="Thêm ảnh" :h="96" />
          <div class="card warn mt12" style="padding:10px 14px">Tối thiểu 5 ảnh thật chính chủ (mặt trước, sau, chi tiết, phụ kiện, cận chất liệu). Ảnh lấy từ mạng sẽ bị từ chối.</div>
        </div>

        <div class="card">
          <h3>2. Thông tin cơ bản</h3>
          <FormField v-model="f.name" label="Tên sản phẩm" />
          <div class="row">
            <div class="fl1"><FormField v-model="f.brand" label="Thể loại" type="select" :options="brandOptions" /></div>
            <div class="fl1"><FormField v-model="f.series" label="Series" type="select" :options="seriesOptions" /></div>
            <div class="fl1"><FormField v-model="f.character" label="Nhân vật" placeholder="Ví dụ: Raiden Shogun" /></div>
          </div>
          <FormField v-model="f.categoryId" label="Danh mục" type="select" :options="categoryOptions" />
          <FormField v-model="f.description" label="Mô tả" type="textarea" :hint="f.description.trim().length + ' ký tự (tối thiểu 50)'" />
        </div>

        <div class="card">
          <h3>3. Size, tình trạng &amp; phụ kiện</h3>
          <div class="row">
            <div class="fl1"><FormField v-model="f.size" label="Size" type="select" :options="sizeOptions" /></div>
            <div class="fl1"><FormField v-model="f.measure" label="Số đo (cao / ngực)" /></div>
            <div class="fl1"><FormField v-model="f.condition" label="Tình trạng" type="select" :options="conditionOptions" /></div>
          </div>
          <div class="field">
            <label class="lbl">Trang phục chính (bắt buộc, gồm trong giá)</label>
            <div class="row wrap g8"><ChipTag v-for="m in mainNames" :key="m">{{ m }}</ChipTag></div>
          </div>
          <div class="field">
            <label class="lbl">Phụ kiện đi kèm ({{ accessories.length }}) – chia theo nhóm, khách chọn thuê kèm hoặc không</label>
            <div class="tw">
              <table class="tbl">
                <thead><tr><th>Nhóm</th><th>Phụ kiện</th><th>Khách được chọn?</th><th>Giá giảm nếu khách bỏ</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="(a, i) in accessories" :key="i">
                    <td><input v-model="a.group" class="inp" style="height:34px"></td>
                    <td><input v-model="a.name" class="inp" style="height:34px" placeholder="Tên phụ kiện"></td>
                    <td><div class="ck" :class="{ on: a.optional }" style="cursor:pointer" @click="a.optional = !a.optional"><i></i>Tùy chọn</div></td>
                    <td><div class="row g8 ac"><span>−</span><input v-model.number="a.discount" type="number" class="inp" style="height:34px;width:110px"><span class="sm muted">đ/ngày</span></div></td>
                    <td><a class="btn s ro" @click="removeAccessory(i)">Xóa</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="row g8 mt8">
              <a @click="addAccessory"><ChipTag kind="n">+ Thêm phụ kiện</ChipTag></a>
              <a @click="addGroup"><ChipTag kind="n">+ Thêm nhóm</ChipTag></a>
            </div>
            <div class="muted sm mt8">Giá {{ vnd(f.pricePerDay) }}/ngày là giá khi khách thuê đủ bộ. Bỏ chọn món nào thì giá thuê và cọc giảm theo mức bạn đặt.</div>
          </div>
        </div>

        <div class="card">
          <h3>4. Giá &amp; cọc</h3>
          <div class="row">
            <div class="fl1"><FormField v-model="f.pricePerDay" label="Giá thuê / ngày" type="number" :hint="vnd(f.pricePerDay)" /></div>
            <div class="fl1"><FormField v-model="f.itemValue" label="Giá trị đồ" type="number" :hint="vnd(f.itemValue)" /></div>
            <div class="fl1"><FormField v-model="f.deposit" label="Tiền cọc (tối thiểu 50%)" type="number" :error="depositError" :hint="depositOk ? vnd(f.deposit) : ''" /></div>
          </div>
          <div class="muted">{{ depositHint }} <a class="b" style="color:#6B4630" @click="autoDeposit">Dùng mức cọc tối thiểu</a></div>
          <div class="row mt12">
            <div class="fl1"><FormField v-model="f.minDays" label="Số ngày thuê tối thiểu" type="number" /></div>
            <div class="fl1"><FormField v-model="f.maxDays" label="Số ngày thuê tối đa" type="number" /></div>
          </div>
        </div>

        <div class="card">
          <h3>5. Giao nhận &amp; lịch</h3>
          <label class="lbl">Phương thức giao (chọn nhiều)</label>
          <div class="row wrap" style="gap:4px 24px">
            <div v-for="s in shipping" :key="s.key" style="width:30%"><div class="ck" :class="{ on: s.on }" style="cursor:pointer" @click="s.on = !s.on"><i></i>{{ s.name }}</div></div>
          </div>
          <div class="row mt12">
            <div class="fl1"><FormField v-model="f.pickupArea" label="Khu vực lấy hàng" type="select" :options="areaOptions" /></div>
            <div class="fl1"><FormField v-model="f.blockedDates" label="Lịch không cho thuê" /></div>
          </div>
        </div>

        <div class="card">
          <h3>6. Hướng dẫn giặt &amp; bảo quản</h3>
          <FormField v-model="f.care" type="textarea" />
        </div>
      </div>

      <div class="col" style="width:290px;flex:none">
        <div class="card">
          <h3>Danh sách kiểm tra</h3>
          <div v-for="c in checklist" :key="c[0]" class="ck" :class="{ on: c[1] }"><i></i>{{ c[0] }}</div>
          <div class="muted mt8">{{ doneCount }}/{{ checklist.length }} hoàn tất</div>
        </div>
        <div class="card tint">
          <h3>Xem trước phí (thuê 2 ngày)</h3>
          <div class="rw"><span>Tiền thuê 2 × {{ vnd(f.pricePerDay) }}</span><span>{{ vnd(preview.rentalTotal) }}</span></div>
          <div class="rw"><span>Phí nền tảng 7%</span><span>− {{ vnd(preview.platformFee) }}</span></div>
          <div class="rw tot"><span>Chủ đồ nhận</span><span>{{ vnd(preview.ownerPayout) }}</span></div>
          <div class="muted sm mt8">Khách không trả thêm phí; Clarity trừ 7% tiền thuê rồi chuyển cho bạn sau khi đơn hoàn tất.</div>
        </div>
        <div class="card">
          <h4>Kiểm duyệt</h4>
          <div class="muted mb12">Staff kiểm duyệt duyệt trong 24 giờ. Bạn sẽ nhận thông báo khi có kết quả.</div>
          <button type="button" class="btn w" :class="{ dis: !allDone }" :disabled="saving" @click="submit">{{ saving ? 'Đang gửi…' : 'Gửi kiểm duyệt' }}</button>
          <div class="mt8"><button type="button" class="btn w o" @click="saveDraft">Lưu nháp</button></div>
        </div>
      </div>
    </div>
  </BoLayout>
</template>
