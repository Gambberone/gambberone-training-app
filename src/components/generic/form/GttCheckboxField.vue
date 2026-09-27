<template>
  <label :for="id" class="flex cursor-pointer items-center gap-3">
    <input :id="id" v-model="modelValue" type="checkbox" class="checkbox checkbox-error shrink-0" :disabled="disabled" :required="required" />
    <span class="text-sm">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ id: string; label: string; disabled?: boolean; required?: boolean }>();
const modelValue = defineModel<boolean>({ required: true });
</script>
