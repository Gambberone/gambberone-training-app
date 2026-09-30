<template>
  <button
    :type="type"
    :class="[
      !unstyled && 'btn',
      !unstyled && size && sizeClasses[size],
      !unstyled && color && colorClasses[color],
      !unstyled && mode && modeClasses[mode],
      !unstyled && shape && shapeClasses[shape],
    ]"
  >
    <slot v-if="$slots.default" />
    <template v-else>
      <slot name="icon">
        <component :is="icon" v-if="icon" aria-hidden="true" />
      </slot>
      <slot name="label">{{ label }}</slot>
    </template>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

const sizeClasses = { xs: 'btn-xs', sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg', xl: 'btn-xl' };
const colorClasses = {
  neutral: 'btn-neutral', primary: 'btn-primary', secondary: 'btn-secondary',
  accent: 'btn-accent', info: 'btn-info', success: 'btn-success',
  warning: 'btn-warning', error: 'btn-error',
};
const modeClasses = {
  solid: '', outline: 'btn-outline', outlined: 'btn-outline', ghost: 'btn-ghost',
  soft: 'btn-soft', link: 'btn-link', dash: 'btn-dash',
};
const shapeClasses = { square: 'btn-square', circle: 'btn-circle' };

withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
    mode?: 'solid' | 'outline' | 'outlined' | 'ghost' | 'soft' | 'link' | 'dash';
    shape?: 'square' | 'circle';
    icon?: Component;
    label?: string;
    unstyled?: boolean;
  }>(),
  { type: 'button', mode: 'solid' },
);
</script>
