<script setup>
// Ô nhập chuẩn: <FormField label="Họ tên" v-model="x" /> ; type: text|password|date|number|select|textarea ; options cho select
defineProps({ label: String, modelValue: [String, Number], type: { type: String, default: 'text' }, placeholder: String, options: Array, hint: String, error: String })
defineEmits(['update:modelValue'])
</script>
<template>
  <div class="field">
    <label v-if="label" class="lbl">{{ label }}</label>
    <select v-if="type === 'select'" class="sel" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option v-for="o in options" :key="o.value ?? o" :value="o.value ?? o">{{ o.label ?? o }}</option>
    </select>
    <textarea v-else-if="type === 'textarea'" class="ta" :value="modelValue" :placeholder="placeholder" @input="$emit('update:modelValue', $event.target.value)" />
    <input v-else class="inp" :type="type" :value="modelValue" :placeholder="placeholder" @input="$emit('update:modelValue', $event.target.value)">
    <div v-if="hint" class="muted sm mt8">{{ hint }}</div>
    <div v-if="error" class="sm mt8" style="color:#B5432F">{{ error }}</div>
  </div>
</template>
