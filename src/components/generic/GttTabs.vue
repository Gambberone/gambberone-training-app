<template>
  <div class="flex w-full flex-col gap-2" :class="{ 'h-full min-h-0': props.scrollContent }">
    <div class="flex shrink-0 items-center gap-4">
      <div class="min-w-0 flex-1 overflow-x-auto">
        <div role="tablist" class="tabs tabs-box min-w-full w-max flex-nowrap">
          <button
            v-for="tab in props.tabs"
            :key="tab.key"
            :data-tour-tab="tab.key"
            :id="`${tabId}-${tab.key}`"
            type="button"
            :aria-selected="activeTab === tab.key"
            :aria-controls="`${tabId}-panel`"
            :tabindex="activeTab === tab.key ? 0 : -1"
            class="tab"
            role="tab"
            :class="tabClass(tab)"
            @click="handleTabChange(tab)"
            @keydown="handleTabKeydown($event, tab)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <slot name="actions" />
    </div>
    <div
      v-if="activeTab"
      :key="activeTab"
      ref="scrollElement"
      :id="`${tabId}-panel`"
      role="tabpanel"
      :aria-labelledby="`${tabId}-${activeTab}`"
      tabindex="0"
      :class="{
        'gtt-tabs-scroll min-h-0 flex-1 overflow-y-auto': props.scrollContent,
        'fade-top': props.scrollContent && fadeTop,
        'fade-bottom': props.scrollContent && fadeBottom,
      }"
      @scroll="updateScrollFade"
    >
      <slot :name="activeTab"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, useId } from 'vue';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  initialActiveTab?: string;
  scrollContent?: boolean;
}

const props = defineProps<TabsProps>();
const tabId = useId();

const activeTab = defineModel<string>();
const scrollElement = ref<HTMLElement | null>(null);
const fadeTop = ref(false);
const fadeBottom = ref(false);
let resizeObserver: ResizeObserver | undefined;

function updateScrollFade() {
  const element = scrollElement.value;
  if (!element || !props.scrollContent) return;
  fadeTop.value = element.scrollTop > 1;
  fadeBottom.value = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
}

watch(activeTab, async () => {
  resizeObserver?.disconnect();
  await nextTick();
  if (!scrollElement.value || !props.scrollContent) return;
  resizeObserver ??= new ResizeObserver(updateScrollFade);
  resizeObserver.observe(scrollElement.value);
  if (scrollElement.value.firstElementChild) {
    resizeObserver.observe(scrollElement.value.firstElementChild);
  }
  updateScrollFade();
});

onBeforeUnmount(() => resizeObserver?.disconnect());

onMounted(() => {
  if (activeTab.value && props.tabs.some(tab => tab.key === activeTab.value)) return;
  activeTab.value =
    props.initialActiveTab && props.tabs.some((tab) => tab.key === props.initialActiveTab)
      ? props.initialActiveTab
      : props.tabs[0]?.key;
});

const tabClass = (tab: Tab) => {
  let classes = [];
  classes.push('min-h-11 flex-1 whitespace-nowrap');
  if (activeTab.value === tab.key) {
    classes.push('tab-active');
  }
  return classes;
};

const handleTabChange = (tab: Tab) => {
  activeTab.value = tab.key;
};
function handleTabKeydown(event: KeyboardEvent, tab: Tab) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(event.key) || !props.tabs.length) return;
  event.preventDefault();
  const index = props.tabs.findIndex(item => item.key === tab.key);
  const direction = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1;
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? props.tabs.length - 1
    : (index + (event.key === 'ArrowRight' ? direction : -direction) + props.tabs.length) % props.tabs.length;
  const target = props.tabs[next];
  if (!target) return;
  activeTab.value = target.key;
  document.getElementById(`${tabId}-${target.key}`)?.focus({ preventScroll: true });
}
watch(() => props.tabs.map(tab => tab.key), keys => {
  if (!keys.includes(activeTab.value ?? '')) activeTab.value = keys[0];
});
</script>

<style scoped>
.gtt-tabs-scroll.fade-top {
  mask-image: linear-gradient(to bottom, transparent, black 1rem);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 1rem);
}

.gtt-tabs-scroll.fade-bottom {
  mask-image: linear-gradient(to bottom, black calc(100% - 1rem), transparent);
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 1rem), transparent);
}

.gtt-tabs-scroll.fade-top.fade-bottom {
  mask-image: linear-gradient(
    to bottom,
    transparent,
    black 1rem,
    black calc(100% - 1rem),
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    black 1rem,
    black calc(100% - 1rem),
    transparent
  );
}
</style>
