<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoLayout from '@/layouts/BoLayout.vue'
import FormField from '@/components/FormField.vue'
import ImgPh from '@/components/ImgPh.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { vendorService } from '@/services/vendorService'
import { errMsg } from '@/services/http'
import { vnd } from '@/utils/format'
const route = useRoute(), router = useRouter(), ui = useUiStore()
const editId = computed(() => String(route.query.id || ''))
const loading = ref(true), error = ref(''), saving = ref(false), meta = ref(null), imageText = ref('')
const blank = () => ({ name:'', characterName:'', description:'', categoryId:'', brandId:'', seriesId:'', productType:'COSTUME', gender:'UNISEX', size:'M', difficulty:'MEDIUM', conditionLevel:'LIKE_NEW', itemValue:'', careGuide:'', pricePerDay:'', depositAmount:'', quantity:1, minRentalDays:1, maxRentalDays:7, cleaningDays:1 })
const f = reactive(blank()), accessories = ref([])
const form = computed(() => meta.value?.productForm || {})
const options = key => (form.value[key] || []).map(x => ({value:x.id, label:x.name}))
const categoryOptions = computed(() => options('categories'))
const brandOptions = computed(() => [{value:'',label:'Không chọn'}, ...options('brands')])
const seriesOptions = computed(() => [{value:'',label:'Không chọn'}, ...options('series')])
const images = computed(() => imageText.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean))
const minDeposit = computed(() => Number(f.itemValue) >= (form.value.deposit?.fullDepositFrom || 5000000) ? Number(f.itemValue) : Math.round(Number(f.itemValue) * (form.value.deposit?.minRate || 0.5)))
const checklist = computed(() => [
 ['Tên từ 3 đến 150 ký tự', f.name.trim().length >= 3 && f.name.trim().length <= 150],
 ['Đã chọn danh mục', !!f.categoryId], ['Có ít nhất một ảnh', images.value.length > 0 && images.value.length <= 20],
 ['Giá thuê và cọc hợp lệ', Number(f.pricePerDay) > 0 && Number(f.depositAmount) >= minDeposit.value && Number(f.depositAmount) >= 0],
 ['Ngày thuê hợp lệ', Number.isInteger(Number(f.minRentalDays)) && Number.isInteger(Number(f.maxRentalDays)) && Number(f.minRentalDays) >= 1 && Number(f.maxRentalDays) >= Number(f.minRentalDays) && Number(f.maxRentalDays) <= 30],
])
const allDone = computed(() => checklist.value.every(x => x[1]))
const preview = computed(() => ({ rental: Number(f.pricePerDay || 0) * 2, deposit: Number(f.depositAmount || 0) }))
const draftKey = 'vendor_product_draft'
async function load() {
 loading.value = true; error.value = ''
 Object.assign(f, blank()); accessories.value = []; imageText.value = ''
 try {
  meta.value = await vendorService.meta()
  if (editId.value) {
   const p = await vendorService.product(editId.value)
   for (const key of Object.keys(blank())) f[key] = p[key] ?? blank()[key]
   accessories.value = (p.accessories || []).map(a => ({type:a.type, name:a.name, isRequired:a.isRequired}))
   imageText.value = (p.images || []).join('\n')
  } else {
   f.categoryId = form.value.categories?.[0]?.id || ''
   try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || 'null')
    if (draft) { for (const key of Object.keys(blank())) f[key] = draft.f?.[key] ?? f[key]; accessories.value = draft.accessories || []; imageText.value = draft.imageText || '' }
   } catch { /* Bỏ qua bản nháp hỏng. */ }
  }
 } catch(e) { error.value = errMsg(e, 'Không tải được biểu mẫu sản phẩm') }
 finally { loading.value = false }
}
onMounted(load)
watch(editId, load)
function body() {
 return {
  name:f.name.trim(), characterName:f.characterName.trim(), description:f.description.trim(),
  categoryId:f.categoryId, brandId:f.brandId || null, seriesId:f.seriesId || null,
  productType:f.productType, gender:f.gender, size:String(f.size), difficulty:f.difficulty, conditionLevel:f.conditionLevel,
  itemValue:f.itemValue === '' ? null : Number(f.itemValue), careGuide:f.careGuide.trim(),
  pricePerDay:Number(f.pricePerDay), depositAmount:Number(f.depositAmount), quantity:Number(f.quantity),
  minRentalDays:Number(f.minRentalDays), maxRentalDays:Number(f.maxRentalDays), cleaningDays:Number(f.cleaningDays),
  images:images.value, accessories:accessories.value.map(a => ({type:a.type, name:a.name.trim(), isRequired:!!a.isRequired})),
 }
}
async function submit() {
 if (!allDone.value) { ui.toast('Vui lòng hoàn tất danh sách kiểm tra'); return }
 if (accessories.value.some(a => !a.name.trim())) { ui.toast('Nhập tên các phụ kiện hoặc xóa dòng trống'); return }
 saving.value = true
 try {
  if (editId.value) await vendorService.updateProduct(editId.value, body())
  else await vendorService.createProduct(body())
  localStorage.removeItem(draftKey)
  ui.toast('Đã lưu sản phẩm và gửi kiểm duyệt')
  router.push({name:'ChuSanPham'})
 } catch(e) { ui.toast(errMsg(e, 'Không lưu được sản phẩm')) } finally { saving.value = false }
}
function saveDraft() { localStorage.setItem(draftKey, JSON.stringify({f:{...f}, accessories:accessories.value, imageText:imageText.value})); ui.toast('Đã lưu nháp trên trình duyệt') }
</script>
<template>
 <BoLayout role="owner" active="Sản phẩm của tôi" :title="editId ? 'Sửa sản phẩm' : 'Đăng sản phẩm'">
  <LoadState :loading="loading" :error="error" @retry="load" />
  <div v-if="!loading && !error" class="row as">
   <div class="col fl1">
    <div class="card"><h3>1. Ảnh sản phẩm</h3><FormField v-model="imageText" type="textarea" label="Đường dẫn ảnh (mỗi dòng một ảnh, dòng đầu là ảnh bìa)" /><div class="row g8"><ImgPh v-for="(url,i) in images" :key="i" :src="url" :label="'Ảnh ' + (i+1)" :w="80" :h="96" /></div></div>
    <div class="card"><h3>2. Thông tin cơ bản</h3><FormField v-model="f.name" label="Tên sản phẩm" /><div class="row"><div class="fl1"><FormField v-model="f.brandId" label="Thương hiệu" type="select" :options="brandOptions" /></div><div class="fl1"><FormField v-model="f.seriesId" label="Series" type="select" :options="seriesOptions" /></div><div class="fl1"><FormField v-model="f.characterName" label="Nhân vật" /></div></div><FormField v-model="f.categoryId" label="Danh mục" type="select" :options="categoryOptions" /><FormField v-model="f.description" label="Mô tả" type="textarea" /><div class="row"><div class="fl1"><FormField v-model="f.productType" type="select" label="Loại sản phẩm" :options="form.productTypes" /></div><div class="fl1"><FormField v-model="f.gender" type="select" label="Giới tính" :options="form.genders" /></div></div></div>
    <div class="card"><h3>3. Size, tình trạng &amp; phụ kiện</h3><div class="row"><div class="fl1"><FormField v-model="f.size" label="Size" /></div><div class="fl1"><FormField v-model="f.conditionLevel" label="Tình trạng" type="select" :options="form.conditions" /></div><div class="fl1"><FormField v-model="f.difficulty" label="Độ khó" type="select" :options="form.difficulties" /></div></div><div class="tw"><table class="tbl"><thead><tr><th>Loại</th><th>Tên phụ kiện</th><th>Bắt buộc</th><th></th></tr></thead><tbody><tr v-for="(a,i) in accessories" :key="i"><td><select v-model="a.type" class="sel"><option v-for="t in form.accessoryTypes" :key="t.value" :value="t.value">{{ t.label }}</option></select></td><td><input v-model="a.name" class="inp"></td><td><input v-model="a.isRequired" type="checkbox"></td><td><button class="btn s ro" @click="accessories.splice(i,1)">Xóa</button></td></tr></tbody></table></div><button class="btn o s mt12" @click="accessories.push({type:'OTHER',name:'',isRequired:false})">+ Thêm phụ kiện</button></div>
    <div class="card"><h3>4. Giá &amp; cọc</h3><div class="row"><div class="fl1"><FormField v-model="f.pricePerDay" type="number" label="Giá thuê / ngày" /></div><div class="fl1"><FormField v-model="f.itemValue" type="number" label="Giá trị đồ" /></div><div class="fl1"><FormField v-model="f.depositAmount" type="number" label="Tiền cọc" /></div></div><div class="muted">Cọc tối thiểu theo giá trị đồ: {{ vnd(minDeposit) }}. <a @click="f.depositAmount = minDeposit">Dùng mức này</a></div><div class="row mt12"><div class="fl1"><FormField v-model="f.minRentalDays" type="number" label="Thuê tối thiểu (ngày)" /></div><div class="fl1"><FormField v-model="f.maxRentalDays" type="number" label="Thuê tối đa (ngày)" /></div></div></div>
    <div class="card"><h3>5. Kho &amp; bảo quản</h3><div class="row"><div class="fl1"><FormField v-model="f.quantity" type="number" label="Số lượng" /></div><div class="fl1"><FormField v-model="f.cleaningDays" type="number" label="Số ngày giặt / bảo trì" /></div></div><FormField v-model="f.careGuide" type="textarea" label="Hướng dẫn giặt & bảo quản" /></div>
   </div>
   <div class="col" style="width:290px;flex:none"><div class="card"><h3>Danh sách kiểm tra</h3><div v-for="c in checklist" :key="c[0]" class="ck" :class="{on:c[1]}"><i></i>{{ c[0] }}</div></div><div class="card tint"><h3>Xem trước (thuê 2 ngày)</h3><div class="rw"><span>Tiền thuê</span><b>{{ vnd(preview.rental) }}</b></div><div class="rw"><span>Tiền cọc</span><b>{{ vnd(preview.deposit) }}</b></div></div><div class="card"><h3>Kiểm duyệt</h3><div class="muted mb12">Sản phẩm mới chờ Staff duyệt. Sản phẩm đang hoạt động hoặc bị từ chối sẽ về chờ duyệt khi sửa.</div><button class="btn w" :disabled="saving" @click="submit">{{ saving ? 'Đang gửi…' : 'Gửi kiểm duyệt' }}</button><button class="btn o w mt8" :disabled="saving" @click="saveDraft">Lưu nháp</button></div></div>
  </div>
 </BoLayout>
</template>
