<template>
  <aside v-if="open && !running" class="shrink-0" :aria-label="tr('creatorGuide.title')">
    <div v-if="offer" class="flex flex-wrap items-center justify-between gap-3 rounded-box border border-primary/30 bg-primary/5 p-3">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold">{{ tr('creatorGuide.title') }}</p>
        <p class="mt-1 text-sm text-base-content/75">{{ tr('creatorGuide.intro') }}</p>
      </div>
      <div class="flex gap-2">
        <GttButton size="sm" color="primary" type="button" @click="start">{{ tr('creatorGuide.start') }}</GttButton>
        <GttButton size="sm" mode="ghost" type="button" @click="stop">{{ tr('creatorGuide.skip') }}</GttButton>
      </div>
    </div>
    <GttButton v-else size="sm" mode="ghost" type="button" @click="start">{{ tr('creatorGuide.replay') }}</GttButton>
  </aside>
</template>

<script setup lang="ts">
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { localRef } from '@/composables/localRef';
import { useWaveBinderValue } from '@/composables/useWaveBinderNode';
import { creatorGuideStage } from '@/domain/creatorGuide';
import { tr } from '@/localization';
import { currentWorkoutCreatorStep, workoutCreatorDraft } from '@/stores/workoutCreator';
import { selectedExerciseNode } from '@/wavebinder/exerciseStep';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{ open: boolean; canCommit: boolean }>();
const seen = localRef('gtt:creator-guide-seen', () => false);
const selectedExercise = useWaveBinderValue(selectedExerciseNode());
const running = ref(false);
const offer = ref(false);
const detail = ref(0);
const nameConfirmed = ref(false);
const reviewedSequence = ref(false);
let tour: Driver | undefined;
let revision = 0;
let activeTarget: HTMLElement | undefined;
let activeContent = '';
const stage = computed(() => creatorGuideStage({
  name: workoutCreatorDraft.value.name,
  nameConfirmed: nameConfirmed.value,
  stepType: currentWorkoutCreatorStep.value?.type,
  stepCount: workoutCreatorDraft.value.steps.filter((step) => step.type !== 'SETPAUSE').length,
  selectedExercise: Boolean(selectedExercise.value),
  detail: detail.value,
  reviewedSequence: reviewedSequence.value,
}));
const canAdvance = computed(() => ['name', 'execution', 'recovery', 'configure', 'sequence'].includes(stage.value));
const targets = {
  name: 'name', add: 'add', exercise: 'exercise', execution: 'execution',
  recovery: 'recovery', configure: 'configure', commit: 'commit', sequence: 'sequence', save: 'save',
};
function clearHighlight() {
  const current = tour;
  tour = undefined;
  activeTarget = undefined;
  activeContent = '';
  current?.destroy();
}
async function highlight() {
  const token = ++revision;
  await nextTick();
  if (token !== revision || !running.value || !props.open) return;
  const root = document.querySelector('[data-creator-guide-root]');
  const candidates = root?.querySelectorAll<HTMLElement>(`[data-creator-guide="${targets[stage.value]}"]`);
  const target = Array.from(candidates ?? []).find((element) => element.getClientRects().length > 0);
  const dialog = root?.closest('dialog');
  if (!target || !dialog) {
    stop();
    return;
  }
  const description = tr(`creatorGuide.stages.${stage.value}.description`) +
    (stage.value === 'commit' && !props.canCommit ? ` ${tr('creatorGuide.validation')}` : '');
  const side = window.matchMedia('(min-width: 1024px)').matches ? 'right' : 'bottom';
  const content = `${stage.value}:${description}:${side}`;
  if (tour && activeTarget === target && activeContent === content) {
    // Reposition existing UI after a layout change without hiding it or moving focus.
    tour.refresh();
    return;
  }
  if (!tour) {
    tour = driver({
      // Animated transitions hide the popover between highlights in the modal.
      animate: false,
      overlayOpacity: 0.65,
      stagePadding: 8,
      stageRadius: 12,
      disableActiveInteraction: false,
      allowKeyboardControl: false,
      overlayClickBehavior: () => {},
      popoverClass: 'app-tour-popover',
      onNextClick: () => advance(),
      onCloseClick: () => stop(),
      onPopoverRender: (popover) => {
        // The creator is a native modal: tour elements must join its top layer.
        if (popover.wrapper.parentElement !== dialog) dialog.appendChild(popover.wrapper);
        popover.closeButton.setAttribute('aria-label', tr('tour.skip'));
        popover.closeButton.textContent = tr('tour.skip');
      },
      onHighlighted: (_element, _step, options) => {
        const overlay = options.driver.getState('__overlaySvg') as SVGSVGElement | undefined;
        if (overlay && overlay.parentElement !== dialog) dialog.appendChild(overlay);
      },
      onDestroyed: () => {
        running.value = false;
        tour = undefined;
      },
    });
  }
  activeTarget = target;
  activeContent = content;
  tour.highlight({
    element: target,
    popover: {
      title: tr(`creatorGuide.stages.${stage.value}.title`),
      description,
      showButtons: canAdvance.value ? ['next', 'close'] : ['close'],
      nextBtnText: tr('tour.next'),
      side,
      align: 'center',
    },
  });
}
function start() {
  seen.value = true;
  offer.value = false;
  nameConfirmed.value = Boolean(workoutCreatorDraft.value.name.trim());
  detail.value = 0;
  reviewedSequence.value = false;
  running.value = true;
  void highlight();
}
function stop() {
  seen.value = true;
  offer.value = false;
  running.value = false;
  revision++;
  clearHighlight();
}
function advance() {
  if (stage.value === 'name') {
    if (workoutCreatorDraft.value.name.trim()) nameConfirmed.value = true;
    return;
  }
  if (stage.value === 'sequence') reviewedSequence.value = true;
  else detail.value++;
}
watch(() => props.open, (open) => {
  running.value = false;
  nameConfirmed.value = false;
  detail.value = 0;
  reviewedSequence.value = false;
  offer.value = open && !seen.value;
  revision++;
  clearHighlight();
}, { immediate: true });
watch([currentWorkoutCreatorStep, () => workoutCreatorDraft.value.steps.length], () => {
  detail.value = 0;
  reviewedSequence.value = false;
});
watch([stage, running, () => props.open, () => props.canCommit], () => { void highlight(); }, { flush: 'post' });
window.addEventListener('resize', highlight);
onBeforeUnmount(() => {
  revision++;
  clearHighlight();
  window.removeEventListener('resize', highlight);
});
</script>

