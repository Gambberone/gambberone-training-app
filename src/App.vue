<script setup lang="ts">
import GttToast from './components/generic/GttToast.vue';
import { useTheme } from './composables/useTheme';

useTheme();
</script>

<template>
  <router-view />
  <GttToast />
</template>
