<script setup>
import { vendorMenu } from '@/router/vendorMenu'
import { useUiStore } from '@/store/ui'
import '@/assets/css/vendor.scss'
defineProps({ role: String, active: String, title: String, sub: String, crumb: String, publicPage: Boolean })
const items = vendorMenu
const ui = useUiStore()
</script>
<template>
 <div class="vendor-area" :class="{ bo: !publicPage }">
  <template v-if="publicPage"><slot /></template>
  <template v-else>
   <aside class="sb">
    <div class="logo"><i>C</i><div>Clarity<small>BACK OFFICE</small></div></div>
    <RouterLink v-for="[label,name] in items" :key="name" :to="{ name }" :class="{ on: label === active }"><b class="ic"></b>{{ label }}</RouterLink>
   </aside>
   <div class="bmain">
    <header class="top"><h3>{{ title }}</h3><div class="who"><span class="role">CHỦ CHO THUÊ</span></div></header>
    <main class="body">
     <div class="row jb ae mb16"><div><div class="crumb">Back Office › <b>{{ crumb || active }}</b></div><h1 class="h1">{{ title }}</h1><div v-if="sub" class="muted">{{ sub }}</div></div><div class="row g12"><slot name="actions" /></div></div>
     <slot />
    </main>
   </div>
  </template>
  <div class="toast-box" role="status" aria-live="polite"><div v-for="t in ui.state.toasts" :key="t.id" class="toast-item">{{ t.message }}</div></div>
 </div>
</template>
