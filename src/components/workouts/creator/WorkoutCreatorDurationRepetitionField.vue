<template>
  <GttNumberStepper
    v-model="modelValue"
    :id="props.id"
    :label="props.label"
    :disabled="props.disabled"
    :large-step="10"
  />
</template>

<script setup lang="ts">
import GttNumberStepper from '@/components/generic/form/GttNumberStepper.vue';
import type { FieldProps } from '@/components/generic/form/form.types';

const props = defineProps<FieldProps>();
const modelValue = defineModel<string>({ default: '0' });
</script>
