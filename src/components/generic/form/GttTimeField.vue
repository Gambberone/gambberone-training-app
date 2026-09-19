<template>
  <GttFieldWrapper
    :id="props.id"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :compact="props.compact"
  >
    <div class="join w-full">
      <select
        :id="props.id"
        v-model="hour"
        class="gtt-time-select select select-bordered join-item w-1/2 text-center"
        aria-label="Ora"
        :disabled="props.disabled"
        @change="syncValue"
      >
        <option value="">HH</option>
        <option v-for="value in hours" :key="value" :value="value">{{ value }}</option>
      </select>
      <span
        class="join-item grid place-items-center bg-base-200 px-3 font-bold text-base-content/60"
        >:</span
      >
      <select
        v-model="minute"
        class="gtt-time-select select select-bordered join-item w-1/2 text-center"
        aria-label="Minuti"
        :disabled="props.disabled"
        @change="syncValue"
      >
        <option value="">MM</option>
        <option v-for="value in minutes" :key="value" :value="value">{{ value }}</option>
      </select>
    </div>
  </GttFieldWrapper>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types';

interface TimeFieldProps extends Omit<FieldProps, 'placeholder' | 'options' | 'valueKey'> {
  error?: string;
}

const props = defineProps<TimeFieldProps>();
const modelValue = defineModel<string>({ default: '' });
const hour = ref('');
const minute = ref('');
const hours = Array.from({ length: 24 }, (_, value) => String(value).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, '0'));

watch(
  modelValue,
  (value) => {
    const [nextHour = '', nextMinute = ''] = value.split(':');
    if (`${hour.value}:${minute.value}` !== value) {
      hour.value = nextHour;
      minute.value = nextMinute;
    }
  },
  { immediate: true },
);

const syncValue = () => {
  modelValue.value =
    hour.value.length === 2 && minute.value.length === 2 ? `${hour.value}:${minute.value}` : '';
};
</script>

<style scoped>
.gtt-time-select:focus {
  border-color: var(--color-primary);
  outline-color: var(--color-primary);
}
</style>
