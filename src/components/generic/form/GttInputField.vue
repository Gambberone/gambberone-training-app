<template>
  <GttFieldWrapper
    :id="props.id"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :compact="props.compact"
  >
    <input
      :id="props.id"
      v-model="modelValue"
      class="input input-bordered w-full"
      :class="{ 'input-error': props.error }"
      :disabled="props.disabled"
      :required="props.required"
      :placeholder="props.placeholder"
      :type="props.type"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="props.error ? `${props.id}_error` : undefined"
    />
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import type { InputTypeHTMLAttribute } from 'vue';
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types';

interface InputFieldProps extends FieldProps {
  type?: InputTypeHTMLAttribute;
  error?: string;
}

const props = withDefaults(defineProps<InputFieldProps>(), {
  type: 'text',
});

const modelValue = defineModel<string>({ default: '' });
</script>
