<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartApi, productApi } from '../../services/customerApi';
import { demoProduct } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const product = ref(null);
const loading = ref(true);
const error = ref('');
const added = ref(false);
const form = ref({ quantity: 1, startDate: '', endDate: '', selectedAccessories: [] });
const heroImage = computed(() => product.value?.images?.find((image) => image.isPrimary)?.url || product.value?.images?.[0]?.url);
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

async function load() {
  if (route.query.demo === '1') { product.value = demoProduct; loading.value = false; return; }
  try { product.value = (await productApi.detail(route.params.id)).data; }
  catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể tải sản phẩm.'; }
  finally { loading.value = false; }
}
function toggleAccessory(accessory) {
  const index = form.value.selectedAccessories.findIndex((item) => item.accessoryId === accessory.id);
  if (index >= 0) form.value.selectedAccessories.splice(index, 1);
  else form.value.selectedAccessories.push({ accessoryId: accessory.id, quantity: 1 });
}
async function addToCart() {
    error.value = '';
  if (route.query.demo === '1') { added.value = true; return; }
  try {
    await cartApi.create({ productId: product.value.id, ...form.value });
    added.value = true;
  } catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể thêm vào giỏ.'; }
}
onMounted(load);
</script>

<template>
  <div class="container py-4">
    <div v-if="loading" class="text-center py-5">Đang tải sản phẩm...</div>
    <div v-else-if="error && !product" class="alert alert-danger">{{ error }}</div>
    <template v-else-if="product">
      <nav class="small text-muted mb-3">Khám phá / {{ product.category?.name }} / {{ product.name }}</nav>
      <div class="row g-4">
        <div class="col-lg-7"><div class="product-hero bg-light rounded-4 overflow-hidden"><img v-if="heroImage" :src="heroImage" :alt="product.name"><i v-else class="bi bi-image fs-1 text-muted"></i></div></div>
        <div class="col-lg-5">
          <span class="badge text-bg-light border">{{ product.category?.name }}</span>
          <h1 class="h2 mt-2">{{ product.name }}</h1>
          <p class="text-muted mb-2">{{ product.characterName }} · {{ product.gender }} · Size {{ product.size || 'Linh hoạt' }}</p>
          <div class="h4 text-danger">{{ money(product.pricePerDay) }} <small class="fs-6 text-muted">/ ngày</small></div>
          <p class="mb-3">Cọc hoàn lại: <strong>{{ money(product.depositAmount) }}</strong></p>
          <div class="border rounded-3 p-3 mb-3 bg-light">
            <div class="row g-2"><div class="col-6"><label class="form-label">Ngày nhận</label><input v-model="form.startDate" type="date" class="form-control"></div><div class="col-6"><label class="form-label">Ngày trả</label><input v-model="form.endDate" type="date" class="form-control"></div></div>
            <label class="form-label mt-3">Số lượng</label><input v-model.number="form.quantity" type="number" min="1" :max="product.quantity" class="form-control w-auto">
          </div>
          <div v-if="product.accessories?.length" class="mb-3"><div class="fw-semibold mb-2">Phụ kiện đi kèm</div><label v-for="accessory in product.accessories" :key="accessory.id" class="d-flex gap-2 border rounded p-2 mb-2"><input type="checkbox" :checked="form.selectedAccessories.some(item => item.accessoryId === accessory.id)" @change="toggleAccessory(accessory)"><span>{{ accessory.name }} <small class="text-muted">+ {{ money(accessory.rentalPricePerDay) }}/ngày</small></span></label></div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div><div v-if="added" class="alert alert-success py-2">Đã thêm vào giỏ thuê.</div>
          <button class="btn btn-primary w-100 py-2" @click="addToCart">Thêm vào giỏ thuê</button><button class="btn btn-outline-primary w-100 mt-2" @click="router.push('/customer/cart')">Xem giỏ thuê</button>
        </div>
      </div>
      <section v-if="product.description" class="mt-5"><h2 class="h4">Mô tả sản phẩm</h2><p class="text-muted">{{ product.description }}</p></section>
      <section v-if="product.similarProducts?.length" class="mt-5"><h2 class="h4 mb-3">Sản phẩm tương tự</h2><div class="row g-3"><div v-for="item in product.similarProducts" :key="item.id" class="col-6 col-md-3"><router-link :to="`/products/${item.id}`" class="card h-100 text-decoration-none text-dark"><div class="thumb bg-light"><img v-if="item.images?.[0]?.url" :src="item.images[0].url" :alt="item.name"></div><div class="card-body"><div class="fw-semibold small">{{ item.name }}</div><div class="text-danger small">{{ money(item.pricePerDay) }}/ngày</div></div></router-link></div></div></section>
    </template>
  </div>
</template>

<style scoped>.product-hero,.thumb{display:grid;place-items:center;aspect-ratio:1}.product-hero img,.thumb img{width:100%;height:100%;object-fit:cover}</style>
