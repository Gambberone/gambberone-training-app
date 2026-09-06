<template>
    <GttFieldWrapper :id="props.id" :label="props.label" :hint="props.hint">
        <input :id="props.id" v-model="modelValue" class="input input-bordered w-full" :disabled="props.disabled"
            :placeholder="props.placeholder" :type="props.type" />
    </GttFieldWrapper>
</template>

<script setup lang="ts">
import type { InputTypeHTMLAttribute } from 'vue'
import GttFieldWrapper from './GttFieldWrapper.vue';
import type { FieldProps } from './form.types'

interface InputFieldProps extends FieldProps {
    type?: InputTypeHTMLAttribute
}

const props = withDefaults(defineProps<InputFieldProps>(), {
    type: 'text',
})

const modelValue = defineModel<string>({ default: '' })
</script>
