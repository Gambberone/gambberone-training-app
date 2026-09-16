<template>
  <div class="fab bottom-[calc(4rem+env(safe-area-inset-bottom))]">
    <button class="btn btn-lg btn-circle btn-primary rounded-xl" @click="emit('click')">
      <Plus />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue';

const emit = defineEmits(['click']);
</script>
