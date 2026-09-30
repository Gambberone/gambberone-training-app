<template>
  <GttFieldWrapper :id="id" :label="label" compact>
    <input
      :id="id"
      v-model.number="modelValue"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      class="range range-primary w-full"
      :disabled="disabled"
    />
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import GttFieldWrapper from './GttFieldWrapper.vue';

withDefaults(
  defineProps<{
    id: string;
    label: string;
    min: number;
    max: number;
    step?: number;
    disabled?: boolean;
  }>(),
  { step: 1 },
);
const modelValue = defineModel<number>({ required: true });
</script>
