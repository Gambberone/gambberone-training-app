<template>
  <GttButton unstyled
    v-bind="$attrs"
    type="button"
    :aria-label="text"
    :aria-describedby="visible ? tooltipId : undefined"
    @mouseenter="scheduleShow"
    @mouseleave="hideUnlessPinned"
    @focus="show"
    @blur="hideUnlessPinned"
    @click="toggle"
    @keydown.esc.stop="hide"
  >
    <slot />
  </GttButton>
  <Teleport to="body">
    <div
      ref="popover"
      :id="tooltipId"
      popover="manual"
      role="tooltip"
      @mouseenter="cancelHide"
      @mouseleave="hideUnlessPinned"
      class="gtt-floating-tooltip"
      :style="{ left: `${left}px`, top: `${top}px`, color: textColor }"
    >
      {{ text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';

defineOptions({ inheritAttrs: false });
defineProps<{ text: string; textColor?: string }>();
const tooltipId = useId();
const popover = ref<HTMLDivElement>();
const visible = ref(false);
const left = ref(0);
const top = ref(0);
let pinned = false;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
function cancelHide() { clearTimeout(hideTimer); hideTimer = undefined; }
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
function cancelHover() { clearTimeout(hoverTimer); hoverTimer = undefined; }
function scheduleShow(event: MouseEvent) {
  cancelHide();
  cancelHover();
  if (pinned || visible.value) return;
  const target = event.currentTarget as HTMLElement;
  hoverTimer = setTimeout(() => { void showAt(target); }, 800);
}
let anchor: HTMLElement | undefined;
async function show(event: Event) {
  cancelHide();
  cancelHover();
  return showAt(event.currentTarget as HTMLElement);
}
async function showAt(target: HTMLElement) {
  anchor = target;
  visible.value = true;
  await nextTick();
  if (!visible.value || !popover.value || !anchor?.isConnected) return;
  popover.value.showPopover();
  const rect = anchor.getBoundingClientRect();
  const tip = popover.value.getBoundingClientRect();
  const padding = 8;
  left.value = Math.max(
    padding,
    Math.min(rect.left + rect.width / 2 - tip.width / 2, window.innerWidth - tip.width - padding),
  );
  const above = rect.top - tip.height - padding;
  top.value =
    above >= padding
      ? above
      : Math.min(rect.bottom + padding, window.innerHeight - tip.height - padding);
}
function hide() {
  cancelHide();
  cancelHover();
  pinned = false;
  visible.value = false;
  popover.value?.hidePopover();
}
function hideUnlessPinned() {
  cancelHover();
  cancelHide();
  if (!pinned) {
    hideTimer = setTimeout(() => {
      if (document.activeElement !== anchor) hide();
    }, 150);
  }
}
function toggle(event: Event) {
  if (pinned) hide();
  else {
    pinned = true;
    void show(event);
  }
}
function dismissOnEscape(event: KeyboardEvent) {
  if (visible.value && event.key === 'Escape') hide();
}
function outside(event: PointerEvent) {
  if (
    visible.value &&
    event.target instanceof Node &&
    !anchor?.contains(event.target) &&
    !popover.value?.contains(event.target)
  )
    hide();
}
onMounted(() => {
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', dismissOnEscape);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside);
  document.removeEventListener('keydown', dismissOnEscape);
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
