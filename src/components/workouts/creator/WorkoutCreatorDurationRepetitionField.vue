<template>
  <GttFieldWrapper :id="props.id" :label="props.label" compact>
    <div class="join w-full">
      <button
        class="btn join-item btn-primary shadow-none"
        type="button"
        aria-label="Riduci durata"
        @click="decrease(true)"
      >
        -10
      </button>
      <button
        class="btn join-item text-primary shadow-none"
        type="button"
        aria-label="Riduci durata"
        @click="decrease(false)"
      >
        <Minus />
      </button>
      <input
        :id="props.id"
        v-model="modelValue"
        type="number"
        min="0"
        class="input input-bordered join-item flex-1 text-center focus:outline-none focus:ring-0 focus:border-base-300"
      />
      <button
        class="btn join-item text-primary shadow-none"
        type="button"
        aria-label="Aumenta durata"
        @click="increase(false)"
      >
        <Plus />
      </button>
      <button
        class="btn join-item btn-primary shadow-none"
        type="button"
        aria-label="Riduci durata"
        @click="increase(true)"
      >
        +10
      </button>
    </div>
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue';
import GttFieldWrapper from '../../generic/form/GttFieldWrapper.vue';
import { type FieldProps } from '../../generic/form/form.types.ts';

const props = defineProps<FieldProps>();
const modelValue = defineModel<string>({ default: '0' });

const increase = (increaseByTen: boolean) => {
  modelValue.value = String(Number(modelValue.value || 0) + (increaseByTen ? 10 : 1));
};

const decrease = (decreaseByTen: boolean) => {
  modelValue.value = String(Math.max(0, Number(modelValue.value || 0) - (decreaseByTen ? 10 : 1)));
};
</script>
