<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import FormField from '@/components/FormField.vue'
import ImgPh from '@/components/ImgPh.vue'
import StarRating from '@/components/StarRating.vue'
import LoadState from '@/components/LoadState.vue'
import { useUiStore } from '@/stores/ui'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'
import { uploadService } from '@/services/uploadService'

const FIELDS = ['logoUrl', 'name', 'description', 'region', 'hours', 'ship', 'bank', 'cancelPolicy']
const ui = useUiStore()
const shop = ref(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const saved = reactive({ initials: '' })
const logoBroken = ref(false)
const uploadingLogo = ref(false)
const logoSrc = computed(() => (logoBroken.value ? '' : form.logoUrl))
async function changeLogo() {
  if (uploadingLogo.value) return
  uploadingLogo.value = true
  try {
    const url = await uploadService.pickAndUpload()
    if (url) { form.logoUrl = url; logoBroken.value = false; ui.toast('Đã tải logo, bấm Lưu thay đổi để áp dụng') }
  } catch (e) { ui.toast(e.response ? errMsg(e, 'Không tải được logo') : e.message || 'Không tải được logo') } finally { uploadingLogo.value = false }
}
const form = reactive({ logoUrl: '', name: '', description: '', region: '', hours: '', ship: '', bank: '', cancelPolicy: '' })

function apply(sh) {
  shop.value = sh
  logoBroken.value = false
  saved.initials = sh.initials
  FIELDS.forEach((k) => { saved[k] = sh[k] || ''; form[k] = sh[k] || '' })
}
async function load() {
  loading.value = true; error.value = ''
  try { apply(await ownerService.shop()) } catch (e) {
    error.value = errMsg(e, 'Không tải được hồ sơ shop')
    ui.toast(error.value)
  } finally { loading.value = false }
}
onMounted(load)

const withCur = (list, cur) => (cur && !list.includes(cur) ? [...list, cur] : list)
const areaOptions = computed(() => withCur(shop.value ? shop.value.areas : [], form.region))
const shipOptions = computed(() => withCur(shop.value ? shop.value.shipOptions : [], form.ship))
const dirty = computed(() => FIELDS.some((k) => form[k] !== saved[k]))
const nameError = computed(() => (form.name.trim() ? '' : 'Tên shop không được để trống'))
async function save() {
  if (nameError.value) { ui.toast(nameError.value); return }
  saving.value = true
  try {
    const body = { logoUrl: form.logoUrl || '', name: form.name.trim(), description: form.description, region: form.region, hours: form.hours, ship: form.ship, cancelPolicy: form.cancelPolicy }
    apply(await ownerService.updateShop(body))
    ui.toast('Đã lưu hồ sơ shop')
  } catch (e) { ui.toast(errMsg(e, 'Không lưu được hồ sơ shop')) } finally { saving.value = false }
}
function cancel() { FIELDS.forEach((k) => { form[k] = saved[k] }); ui.toast('Đã hủy thay đổi') }
</script>

<template>
  <BoLayout role="owner" active="Hồ sơ shop" title="Hồ sơ shop" sub="Xem trước hồ sơ công khai bên phải">
    <LoadState :loading="loading" :error="error" @retry="load" />
    <div v-if="shop && !loading && !error" class="row as">
      <div class="card fl1">
        <h3>Chỉnh sửa hồ sơ</h3>
        <ImgPh label="Ảnh bìa shop (1200×300)" :h="90" style="width:100%" />
        <div class="row g12 ac mt12">
          <div class="col g8" style="align-items:center;flex:none">
            <span class="av l" style="overflow:hidden"><img v-if="logoSrc" :src="logoSrc" alt="" style="width:100%;height:100%;object-fit:cover" @error="logoBroken = true"><template v-else>{{ saved.initials }}</template></span>
            <a class="btn o s" :class="{ dis: uploadingLogo }" @click="changeLogo">{{ uploadingLogo ? 'Đang tải…' : 'Đổi logo' }}</a>
          </div>
          <div style="flex:1 1 auto;min-width:0"><FormField v-model="form.name" label="Tên shop" :error="nameError" /></div>
        </div>
        <FormField v-model="form.description" label="Mô tả" type="textarea" />
        <div class="row">
          <div class="fl1"><FormField v-model="form.region" label="Khu vực" type="select" :options="areaOptions" /></div>
          <div class="fl1"><FormField v-model="form.hours" label="Giờ nhận đồ" /></div>
        </div>
        <FormField v-model="form.ship" label="Phương thức giao mặc định" type="select" :options="shipOptions" />
        <FormField v-model="form.bank" label="Tài khoản ngân hàng" type="select" :options="[form.bank]" />
        <div v-if="shop.verified.cccd" class="ck on"><i></i>Xác minh CCCD ✓<template v-if="shop.verified.approvedAt"> (đã duyệt {{ shop.verified.approvedAt }})</template></div>
        <div v-else class="ck"><i></i>Chưa xác minh CCCD ({{ shop.verified.status }})</div>
        <FormField v-model="form.cancelPolicy" label="Chính sách hủy riêng của shop" type="textarea" />
        <div class="row g8">
          <button type="button" class="btn" :disabled="saving" @click="save">Lưu thay đổi</button>
          <button type="button" class="btn o" :disabled="!dirty" @click="cancel">Hủy</button>
        </div>
      </div>

      <div class="col fl1">
        <div class="card" style="padding:0;overflow:hidden">
          <ImgPh label="Ảnh bìa" :h="80" style="width:100%;border-radius:0" />
          <div style="padding:0 20px 20px">
            <div class="row g12 ac" style="margin-top:-24px">
              <span class="av l" style="overflow:hidden"><img v-if="logoSrc" :src="logoSrc" alt="" style="width:100%;height:100%;object-fit:cover" @error="logoBroken = true"><template v-else>{{ saved.initials }}</template></span>
              <div style="padding-top:26px">
                <h3 style="margin:0">{{ form.name || 'Tên shop' }}</h3>
                <span class="muted sm">{{ form.region }} <template v-if="shop.verified.cccd">· <ChipTag kind="g">CCCD ✓</ChipTag></template></span>
              </div>
            </div>
            <div class="muted mt12">{{ form.description }}</div>
            <div class="row mt16">
              <div v-for="s in shop.stats" :key="s[1]" class="fl1 tr"><b style="font-size:16px">{{ s[0] }}</b><div class="muted sm">{{ s[1] }}</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <h3>Đánh giá từ người thuê</h3>
          <div v-for="(r, i) in shop.reviews" :key="r.name + i" class="rw" style="display:block;padding:12px 0">
            <div class="row jb"><b>{{ r.name }}</b><StarRating :value="r.stars" /></div>
            <div class="muted" style="font-size:13px">{{ r.text }}</div>
            <div v-if="r.reply" class="card tint mt8" style="padding:8px 12px"><b class="sm">Phản hồi của shop:</b> <span class="muted">{{ r.reply }}</span></div>
          </div>
          <div v-if="!shop.reviews.length" class="muted">Shop chưa có đánh giá nào.</div>
        </div>
        <div class="card">
          <h3>Chính sách của shop</h3>
          <div v-for="p in shop.policies" :key="p" class="ck on"><i></i>{{ p }}</div>
        </div>
      </div>
    </div>
  </BoLayout>
</template>
