<template>
  <label :for="id" class="flex cursor-pointer items-center gap-3" :class="inline ? 'w-fit' : 'justify-between'">
    <span v-if="offLabel" class="text-sm">{{ offLabel }}</span>
    <span v-else class="min-w-0">
      <span class="block font-semibold text-base-content">{{ label }}</span>
      <span v-if="hint" class="mt-1 block text-sm text-base-content/65">{{ hint }}</span>
    </span>
    <input :id="id" v-model="modelValue" type="checkbox" class="toggle toggle-primary shrink-0" :class="{ 'toggle-sm': small }" :disabled="disabled" />
    <span v-if="offLabel" class="text-sm">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ id: string; label: string; offLabel?: string; hint?: string; disabled?: boolean; small?: boolean; inline?: boolean }>();
const modelValue = defineModel<boolean>({ required: true });
</script>
