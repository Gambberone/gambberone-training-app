import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { computed, nextTick, reactive, ref, watch } from 'vue';
const compile = (source) => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const domain = compile(readFileSync(new URL('../src/domain/creatorGuide.ts', import.meta.url), 'utf8'));
const { creatorGuideStage } = await import(`data:text/javascript;base64,${Buffer.from(domain).toString('base64')}`);
const state = { name: '', nameConfirmed: false, stepCount: 0, selectedExercise: false, detail: 0, reviewedSequence: false };
assert.equal(creatorGuideStage(state), 'name');
assert.equal(creatorGuideStage({ ...state, name: 'Legs' }), 'name');
assert.equal(creatorGuideStage({ ...state, name: 'Legs', nameConfirmed: true }), 'add');
assert.equal(creatorGuideStage({ ...state, stepType: 'EXERCISE' }), 'exercise');
for (const [detail, expected] of [[0, 'execution'], [1, 'recovery'], [2, 'commit']]) {
  assert.equal(creatorGuideStage({ ...state, stepType: 'EXERCISE', selectedExercise: true, detail }), expected);
}
for (const stepType of ['WARMUP', 'STRETCHING', 'PAUSE']) {
  assert.equal(creatorGuideStage({ ...state, stepType }), 'configure');
  assert.equal(creatorGuideStage({ ...state, stepType, detail: 1 }), 'commit');
}
assert.equal(creatorGuideStage({ ...state, name: 'Legs', nameConfirmed: true, stepCount: 1 }), 'sequence');
assert.equal(creatorGuideStage({ ...state, name: 'Legs', nameConfirmed: true, stepCount: 1, reviewedSequence: true }), 'save');

// Exercise the component's reactive lifecycle without altering the editor draft.
const source = readFileSync(new URL('../src/components/workouts/creator/WorkoutCreatorGuide.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
const compiled = compile(source).replace(/^import .*;$/gm, '');
const props = reactive({ open: false, canCommit: false });
const seen = ref(false);
const workoutCreatorDraft = ref({ name: '', steps: [] });
const currentWorkoutCreatorStep = ref();
const selectedExercise = ref();
const highlights = new Set();
const appended = [];
const overlay = {};
const popoverWrapper = {};
const dialog = { appendChild: (element) => appended.push(element) };
const element = { getClientRects: () => [1] };
let driverConfig;
let lastStep;
let highlightCount = 0;
let refreshCount = 0;
const driver = (config) => {
  driverConfig = config;
  const instance = {
    highlight: (step) => {
      lastStep = step;
      highlightCount++;
      highlights.add('driver');
      config.onPopoverRender({ wrapper: popoverWrapper, closeButton: { setAttribute() {}, textContent: '' } });
      config.onHighlighted(element, step, { driver: instance });
    },
    refresh: () => { refreshCount++; },
    getState: () => overlay,
    destroy: () => { highlights.clear(); config.onDestroyed(); },
  };
  return instance;
};
let cleanup;
const dependencies = {
  driver, defineProps: () => props, localRef: () => seen, useWaveBinderValue: () => selectedExercise,
  selectedExerciseNode: () => ({}), creatorGuideStage, tr: (key) => key,
  currentWorkoutCreatorStep, workoutCreatorDraft, computed, nextTick, ref, watch,
  onBeforeUnmount: (callback) => { cleanup = callback; },
  document: { querySelector: () => ({ querySelectorAll: () => [element], closest: () => dialog }) },
  window: { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) },
};
const guide = new Function(...Object.keys(dependencies), compiled + '\nreturn { offer, running, stage, start, stop, advance };')(...Object.values(dependencies));
const settle = async () => { for (let i = 0; i < 5; i++) await nextTick(); };
props.open = true;
await settle();
assert.equal(guide.offer.value, true);
const draftBefore = JSON.stringify(workoutCreatorDraft.value);
guide.start();
await settle();
assert.equal(highlights.has('driver'), true);
assert.equal(driverConfig.popoverClass, 'app-tour-popover');
assert.equal(driverConfig.disableActiveInteraction, false);
assert.equal(driverConfig.animate, false, 'No fade-out gap between modal tutorial steps');
assert.ok(appended.includes(popoverWrapper), 'Popover belongs to the modal top layer');
assert.ok(appended.includes(overlay), 'Overlay belongs to the modal top layer');
assert.deepEqual(lastStep.popover.showButtons, ['next', 'close']);
assert.equal(seen.value, true);
guide.stop();
assert.equal(JSON.stringify(workoutCreatorDraft.value), draftBefore, 'Stopping does not modify the draft');
assert.equal(highlights.size, 0);
props.open = false;
await settle();
props.open = true;
await settle();
assert.equal(guide.offer.value, false, 'Do not repeat the first-use offer');
guide.start();
await settle();
driverConfig.onNextClick();
assert.equal(guide.stage.value, 'name', 'An empty name must not advance');
const initialPopover = lastStep;
for (const name of ['L', 'Le', 'Legs']) {
  workoutCreatorDraft.value.name = name;
  await settle();
  assert.equal(guide.stage.value, 'name', 'Typing must not advance the guide');
  assert.equal(lastStep, initialPopover, 'Typing must not rebuild the popover or steal focus');
}
driverConfig.onNextClick();
await settle();
assert.equal(guide.stage.value, 'add');
currentWorkoutCreatorStep.value = { type: 'EXERCISE' };
await settle();
assert.equal(guide.stage.value, 'exercise');
selectedExercise.value = { id: 'squat' };
await settle();
assert.equal(guide.stage.value, 'execution');
const beforeValidation = highlightCount;
props.canCommit = true;
await settle();
assert.equal(highlightCount, beforeValidation, 'Changing validity must not recreate the active popover');
assert.ok(refreshCount > 0, 'Refresh the geometry while retaining the popover');
guide.advance();
assert.equal(guide.stage.value, 'recovery');
guide.advance();
assert.equal(guide.stage.value, 'commit');
workoutCreatorDraft.value.steps.push({ type: 'EXERCISE' });
currentWorkoutCreatorStep.value = undefined;
await settle();
assert.equal(guide.stage.value, 'sequence');
guide.advance();
assert.equal(guide.stage.value, 'save');
props.open = false;
await settle();
assert.equal(guide.running.value, false);
assert.equal(highlights.size, 0);
cleanup();
console.log('PASS: contextual steps, skip/replay, draft preservation, first-use offer and highlight cleanup.');
