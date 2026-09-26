<template>
  <div class="flex w-full flex-col gap-2" :class="{ 'h-full min-h-0': props.scrollContent }">
    <div class="flex shrink-0 items-center gap-4">
    <div class="min-w-0 flex-1 overflow-x-auto">
      <div role="tablist" class="tabs tabs-box min-w-full w-max flex-nowrap">
        <a
          v-for="tab in props.tabs"
          :key="tab.key"
          class="tab"
          role="tab"
          :class="tabClass(tab)"
          @click="handleTabChange(tab)"
        >
          {{ tab.label }}
        </a>
      </div>
    </div>
    <slot name="actions" />
    </div>
    <div
      v-if="activeTab"
      :key="activeTab"
      ref="scrollElement"
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
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

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
  activeTab.value =
    props.initialActiveTab && props.tabs.some((tab) => tab.key === props.initialActiveTab)
      ? props.initialActiveTab
      : props.tabs[0].key;
});

const tabClass = (tab: Tab) => {
  let classes = [];
  classes.push('min-w-32 flex-1');
  if (activeTab.value === tab.key) {
    classes.push('tab-active');
  }
  return classes;
};

const handleTabChange = (tab: Tab) => {
  activeTab.value = tab.key;
};
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
  mask-image: linear-gradient(to bottom, transparent, black 1rem, black calc(100% - 1rem), transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 1rem, black calc(100% - 1rem), transparent);
}
</style>
