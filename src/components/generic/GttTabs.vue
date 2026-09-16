<template>
  <div class="flex flex-col gap-2 w-full">
    <div class="w-full overflow-x-auto">
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
    <div v-for="tab in props.tabs" :key="tab.key">
      <slot :name="tab.key" v-if="activeTab === tab.key"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  initialActiveTab?: string;
}

const props = defineProps<TabsProps>();

const emit = defineEmits(['change']);

const activeTab = defineModel();

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
