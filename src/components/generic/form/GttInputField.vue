<template>
  <GttFieldWrapper
    :id="props.id"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :compact="props.compact"
  >
    <div
      :class="
        hasAdornments
          ? [
              'input input-bordered flex w-full items-center gap-2',
              { 'input-error': props.error, 'input-disabled': props.disabled },
            ]
          : 'contents'
      "
    >
      <slot name="prefix" />
      <input
        v-bind="$attrs"
        :id="props.id"
        v-model="modelValue"
        :class="
          hasAdornments
            ? 'min-w-0 flex-1'
            : ['input input-bordered w-full', { 'input-error': props.error }]
        "
        :disabled="props.disabled"
        :required="props.required"
        :placeholder="props.placeholder"
        :type="props.type"
        :aria-invalid="Boolean(props.error)"
        :aria-describedby="props.error ? `${props.id}_error` : undefined"
      />
      <slot name="suffix" />
    </div>
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import { computed, useSlots, type InputTypeHTMLAttribute } from 'vue';
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types';

defineOptions({ inheritAttrs: false });
const slots = useSlots();
const hasAdornments = computed(() => Boolean(slots.prefix || slots.suffix));

interface InputFieldProps extends FieldProps {
  type?: InputTypeHTMLAttribute;
  error?: string;
}

const props = withDefaults(defineProps<InputFieldProps>(), {
  type: 'text',
});

const modelValue = defineModel<string>({ default: '' });
</script>
