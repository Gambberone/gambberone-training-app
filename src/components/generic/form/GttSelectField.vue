<template>
  <GttFieldWrapper :id="props.id" :label="props.label" :hint="props.hint" :error="props.error">
    <select
      :id="props.id"
      v-model="modelValue"
      class="select select-bordered w-full"
      :class="{ 'select-error': props.error }"
      :disabled="props.disabled"
      :required="props.required"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="props.error ? `${props.id}_error` : undefined"
    >
      <option v-if="props.placeholder" disabled value="">{{ props.placeholder }}</option>
      <option v-for="option in props.options" :value="option.id" :key="option.id">
        {{ props.valueKey ? option[props.valueKey] : option.label }}
      </option>
    </select>
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types';

interface SelectOption {
  id: string;
  label?: string;
  [key: string]: string | undefined;
}

interface SelectFieldProps extends FieldProps {
  options: SelectOption[];
  valueKey?: string;
  error?: string;
}

const props = defineProps<SelectFieldProps>();
const modelValue = defineModel<string | undefined>({ default: undefined });
</script>
