<template>
    <GttFieldWrapper :id="props.id" :label="props.label" :hint="props.hint">
        <select :id="props.id" v-model="modelValue" class="select select-bordered w-full" :disabled="props.disabled">
            <option v-if="props.placeholder" disabled value="">{{ props.placeholder }}</option>
            <option v-for="option in props.options" :value="option.id" :key="option.id">{{ props.valueKey ?
                option[props.valueKey] : option.label }}</option>
        </select>
    </GttFieldWrapper>
</template>

<script setup lang="ts">
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types'

interface SelectOption {
    id: string
    label?: string
    [key: string]: string | undefined
}

interface SelectFieldProps extends FieldProps {
    options: SelectOption[]
    valueKey?: string
}

const props = defineProps<SelectFieldProps>()
const modelValue = defineModel<string | undefined>({ default: undefined })
</script>
