<template>
  <input
    ref="input"
    class="sr-only"
    type="file"
    :accept="accept"
    :aria-label="label"
    :disabled="disabled"
    @change="onChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ label: string; accept?: string; disabled?: boolean }>();
const emit = defineEmits<{ change: [file: File] }>();
const input = ref<HTMLInputElement>();
function open() {
  input.value?.click();
}
function onChange(event: Event) {
  const element = event.target as HTMLInputElement;
  const file = element.files?.[0];
  element.value = '';
  if (file) emit('change', file);
}
defineExpose({ open });
</script>
