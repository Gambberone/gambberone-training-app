<template>
  <GttFieldWrapper :id="id" :label="label" :hint="hint" :error="error" compact>
    <div
      class="number-stepper flex h-12 items-center gap-1 rounded-field border border-base-300 bg-base-100 px-1 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
      :class="{ 'opacity-50': disabled, 'border-error': error }"
    >
      <GttButton unstyled
        v-if="largeStep"
        class="quick-step"
        type="button"
        :disabled="disabled || atMinimum"
        :aria-label="adjustmentLabel(-largeStep)"
        @click="adjust(-largeStep)"
      >
        −{{ largeStep }}
      </GttButton>
      <GttButton unstyled
        class="step-button"
        type="button"
        :disabled="disabled || atMinimum"
        :aria-label="adjustmentLabel(-step)"
        @click="adjust(-step)"
      >
        <Minus class="size-4" aria-hidden="true" />
      </GttButton>
      <div class="flex min-w-0 flex-1 items-baseline justify-center gap-1">
        <input
          :id="id"
          :value="modelValue"
          @input="modelValue = ($event.target as HTMLInputElement).value"
          type="number"
          :min="min"
          :step="step"
          :disabled="disabled"
          :aria-invalid="Boolean(error)"
          :aria-describedby="error ? `${id}_error` : undefined"
          class="step-value w-full min-w-0 bg-transparent text-center text-xl font-semibold tabular-nums text-primary focus:outline-none"
        />
        <span
          v-if="unit"
          class="pointer-events-none shrink-0 pr-1 text-xs text-base-content/50"
          aria-hidden="true"
          >{{ unit }}</span
        >
      </div>
      <GttButton unstyled
        class="step-button"
        type="button"
        :disabled="disabled"
        :aria-label="adjustmentLabel(step)"
        @click="adjust(step)"
      >
        <Plus class="size-4" aria-hidden="true" />
      </GttButton>
      <GttButton unstyled
        v-if="largeStep"
        class="quick-step"
        type="button"
        :disabled="disabled"
        :aria-label="adjustmentLabel(largeStep)"
        @click="adjust(largeStep)"
      >
        +{{ largeStep }}
      </GttButton>
    </div>
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Minus, Plus } from '@lucide/vue';
import { tr } from '@/localization';
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types';

const props = withDefaults(
  defineProps<FieldProps & { min?: number; step?: number; largeStep?: number; unit?: string }>(),
  { min: 0, step: 1 },
);
const modelValue = defineModel<string>({ default: '0' });
const atMinimum = computed(
  () => !Number.isFinite(Number(modelValue.value)) || Number(modelValue.value) <= props.min,
);
function adjust(amount: number) {
  const parsed = Number(modelValue.value);
  const value = Number.isFinite(parsed) ? parsed : props.min;
  modelValue.value = String(Math.max(props.min, Math.round((value + amount) * 1000) / 1000));
}
function adjustmentLabel(amount: number) {
  return tr(amount < 0 ? 'creator.decreaseValue' : 'creator.increaseValue', {
    field: props.label,
    count: Math.abs(amount),
  });
}
</script>

<style scoped>
.step-value {
  appearance: textfield;
  -moz-appearance: textfield;
}
.step-value::-webkit-inner-spin-button,
.step-value::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
.step-button,
.quick-step {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  height: 2.5rem;
  border-radius: var(--radius-field);
  color: var(--color-primary);
  cursor: pointer;
  transition: background-color 120ms ease;
}
.step-button {
  width: 2.5rem;
}
.quick-step {
  width: 2rem;
  font-size: 0.7rem;
  font-weight: 600;
}
@media (hover: hover) {
  .step-button:hover:not(:disabled),
  .quick-step:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
}
.step-button:active:not(:disabled),
.quick-step:active:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.step-button:focus-visible,
.quick-step:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.step-button:disabled,
.quick-step:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
