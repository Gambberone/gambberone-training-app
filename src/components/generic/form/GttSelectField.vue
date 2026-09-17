<template>
  <GttFieldWrapper
    :id="props.id"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :compact="props.compact"
  >
    <div class="w-full" :class="{ join: props.splitAction }">
      <select
        :id="props.id"
        v-model="modelValue"
        class="select select-bordered w-full"
        :class="{ 'join-item flex-1': props.splitAction, 'select-error': props.error }"
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
      <button
        v-if="props.splitAction"
        class="btn btn-primary join-item"
        type="button"
        :disabled="!modelValue || props.disabled"
        :aria-label="props.splitActionLabel"
        @click="emit('action')"
      >
        <slot name="split-action">Aggiungi</slot>
      </button>
    </div>
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
  splitAction?: boolean;
  splitActionLabel?: string;
}

const props = withDefaults(defineProps<SelectFieldProps>(), {
  splitAction: false,
  splitActionLabel: 'Esegui azione sulla selezione',
});
const emit = defineEmits<{ action: [] }>();
const modelValue = defineModel<string | undefined>({ default: undefined });
</script>
