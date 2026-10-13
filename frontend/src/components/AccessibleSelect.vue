<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  label: { type: String, required: true }
});
const emit = defineEmits(['update:modelValue']);
const root = ref(null);
const trigger = ref(null);
const optionButtons = ref([]);
const open = ref(false);
const activeIndex = ref(0);
const listId = `choice-list-${useId()}`;
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue));

function focusActiveOption() {
  nextTick(() => optionButtons.value[activeIndex.value]?.focus());
}

function showOptions() {
  const selectedIndex = props.options.findIndex((option) => option.value === props.modelValue);
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
  open.value = true;
  focusActiveOption();
}

function closeOptions(returnFocus = false) {
  open.value = false;
  if (returnFocus) nextTick(() => trigger.value?.focus());
}

function choose(option) {
  emit('update:modelValue', option.value);
  closeOptions(true);
}

function moveActiveOption(direction) {
  activeIndex.value = (activeIndex.value + direction + props.options.length) % props.options.length;
  focusActiveOption();
}

function onTriggerKeydown(event) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!open.value) showOptions();
    else moveActiveOption(event.key === 'ArrowDown' ? 1 : -1);
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (open.value) choose(props.options[activeIndex.value]);
    else showOptions();
  }
}

function onOptionKeydown(event, index) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveActiveOption(event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    activeIndex.value = event.key === 'Home' ? 0 : props.options.length - 1;
    focusActiveOption();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeOptions(true);
  } else if (event.key === 'Tab') {
    closeOptions();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    choose(props.options[index]);
  }
}

function onOutsidePointer(event) {
  if (open.value && !root.value?.contains(event.target)) closeOptions();
}

onMounted(() => document.addEventListener('pointerdown', onOutsidePointer));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsidePointer));
</script>

<template>
  <div ref="root" class="accessible-select">
    <button
      ref="trigger"
      type="button"
      class="form-select accessible-select-trigger"
      role="combobox"
      aria-autocomplete="none"
      :aria-label="label"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open ? closeOptions() : showOptions()"
      @keydown="onTriggerKeydown"
    >{{ selectedOption?.label || 'Chọn một mục' }}</button>
    <ul v-if="open" :id="listId" class="accessible-select-menu" role="listbox" :aria-label="label">
      <li v-for="(option, index) in options" :key="option.value" role="presentation">
        <button
          :ref="(element) => { optionButtons[index] = element; }"
          type="button"
          class="accessible-select-option"
          :class="{ selected: option.value === modelValue, active: index === activeIndex }"
          role="option"
          :aria-selected="option.value === modelValue"
          tabindex="-1"
          @click="choose(option)"
          @mouseenter="activeIndex = index"
          @keydown="onOptionKeydown($event, index)"
        >{{ option.label }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.accessible-select{position:relative;width:100%}
.accessible-select-trigger{width:100%;text-align:left;padding-right:2.5rem;background-color:#fff;color:#212529}
.accessible-select-trigger:focus-visible{border-color:#8c6b52;box-shadow:0 0 0 .2rem rgb(140 107 82 / 22%)}
.accessible-select-menu{position:absolute;z-index:1080;top:calc(100% + .2rem);left:0;right:0;max-height:16rem;overflow:auto;margin:0;padding:.35rem;list-style:none;background:#fff;border:1px solid #d9d0c8;border-radius:.5rem;box-shadow:0 .5rem 1.25rem rgb(33 37 41 / 20%)}
.accessible-select-option{display:block;width:100%;padding:.55rem .7rem;border:0;border-radius:.35rem;background:#fff;color:#212529;text-align:left;cursor:pointer}
.accessible-select-option.selected{background:#f3ede7;color:#4a3b32;font-weight:600}
.accessible-select-option:hover,.accessible-select-option.active,.accessible-select-option:focus-visible{background:#4a3b32;color:#fff;outline:none}
</style>
