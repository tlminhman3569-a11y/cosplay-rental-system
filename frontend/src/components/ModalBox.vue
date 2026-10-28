<script setup>
// <ModalBox v-model="show" title="..." > nội dung <template #footer>nút</template></ModalBox>
defineProps({ modelValue: Boolean, title: String, width: { type: Number, default: 560 } })
defineEmits(['update:modelValue'])
</script>
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="vendor-area"><div class="overlay" @click.self="$emit('update:modelValue', false)">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="title" :style="{ width: width + 'px', maxWidth: '94vw', maxHeight: '90vh', overflow: 'auto' }">
        <div class="row jb ac mb12"><h3 style="margin:0">{{ title }}</h3><a style="cursor:pointer;font-size:20px" @click="$emit('update:modelValue', false)">×</a></div>
        <slot /><div class="row g12 mt16" style="justify-content:flex-end"><slot name="footer" /></div>
      </div>
    </div></div>
  </Teleport>
</template>
