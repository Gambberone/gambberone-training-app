<template>
  <div class="fieldset w-full" :class="{ 'pt-5': !props.compact }">
    <label v-if="label" :for="id" class="label">{{ label }}</label>
    <slot />
    <p v-if="error" :id="`${id}_error`" class="label text-error">
      {{ error }}
    </p>
    <p v-if="hint" class="label">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { FieldProps } from './form.types';

const props = defineProps<Pick<FieldProps, 'id' | 'label' | 'hint' | 'error' | 'compact'>>();
</script>
