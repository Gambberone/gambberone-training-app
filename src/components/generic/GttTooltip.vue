<template>
  <button v-bind="$attrs" type="button" :aria-label="text" :aria-describedby="visible ? tooltipId : undefined"
    @mouseenter="show" @mouseleave="hideUnlessPinned" @focus="show" @blur="hide"
    @click="toggle" @keydown.esc.stop="hide">
    <slot />
  </button>
  <Teleport to="body">
    <div ref="popover" :id="tooltipId" popover="manual" role="tooltip"
      class="gtt-floating-tooltip" :style="{ left: `${left}px`, top: `${top}px` }">{{ text }}</div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, useId } from 'vue';
defineOptions({ inheritAttrs: false });
defineProps<{ text: string }>();
const tooltipId = useId();
const popover = ref<HTMLDivElement>();
const visible = ref(false);
const left = ref(0);
const top = ref(0);
let pinned = false;
let anchor: HTMLElement | undefined;
async function show(event: Event) {
  anchor = event.currentTarget as HTMLElement;
  visible.value = true;
  await nextTick();
  if (!visible.value || !popover.value || !anchor?.isConnected) return;
  popover.value.showPopover();
  const rect = anchor.getBoundingClientRect();
  const tip = popover.value.getBoundingClientRect();
  const padding = 8;
  left.value = Math.max(padding, Math.min(rect.left + rect.width / 2 - tip.width / 2, window.innerWidth - tip.width - padding));
  const above = rect.top - tip.height - padding;
  top.value = above >= padding ? above : Math.min(rect.bottom + padding, window.innerHeight - tip.height - padding);
}
function hide() {
  pinned = false;
  visible.value = false;
  popover.value?.hidePopover();
}
function hideUnlessPinned() { if (!pinned) hide(); }
function toggle(event: Event) {
  if (pinned) hide();
  else { pinned = true; void show(event); }
}
function outside(event: PointerEvent) {
  if (visible.value && event.target instanceof Node && !anchor?.contains(event.target) && !popover.value?.contains(event.target)) hide();
}
onMounted(() => {
  document.addEventListener('pointerdown', outside);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside);
  window.removeEventListener('scroll', hide, true);
  window.removeEventListener('resize', hide);
  hide();
});
</script>

<style scoped>
.gtt-floating-tooltip {
  position: fixed;
  inset: auto;
  margin: 0;
  max-width: min(22rem, calc(100vw - 1rem));
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: var(--radius-field);
  background: var(--color-neutral);
  color: var(--color-neutral-content);
  font-size: 0.75rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-neutral) 20%, transparent);
}
</style>
