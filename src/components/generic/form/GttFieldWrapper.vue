<template>
    <div class="fieldset w-full pt-5">
        <label v-if="label" :for="id" class="label">{{ label }}</label>
        <slot />
        <p v-if="hint" class="label">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
import type { FieldProps } from './form.types'

defineProps<Pick<FieldProps, 'id' | 'label' | 'hint'>>()
</script>
