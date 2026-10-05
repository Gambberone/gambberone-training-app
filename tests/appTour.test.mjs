import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { nextTick, readonly, ref, watch } from 'vue';

const source = readFileSync(new URL('../src/composables/useAppTour.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace(/^import .*;$/gm, '').replace(/export /g, '');
const waveBinderStatus = ref('loading');
const activeWorkoutSessionRef = ref(null);
const languageReady = ref(true);
let targetMounted = false;
let config;
const highlighted = [];
const saved = new Map();
const auth = { currentUser: null };
const router = {
  currentRoute: ref({ name: 'home', matched: [{ meta: { appRoute: true } }] }),
  async push() {},
};
const driver = (options) => {
  config = options;
  return {
    drive(index) {
      assert.equal(targetMounted, true, 'Never show a tour before navigation mounts');
      highlighted.push(options.steps[index].element);
    },
    isActive: () => false,
    destroy: () => options.onDestroyed(),
  };
};
const document = { querySelector: () => targetMounted ? {} : null };
const window = { matchMedia: () => ({ matches: false }) };
const localStorage = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
const dependencies = {
  auth, db: {}, i18n: { global: { t: (key) => key } }, router, waveBinderStatus,
  activeWorkoutSessionRef, driver, onAuthStateChanged: (_auth, callback) => callback(null),
  doc: () => ({}), onSnapshot: () => {}, setDoc: async () => {}, nextTick, readonly, ref, watch,
  useLanguage: () => ({ isLanguageReady: languageReady }), localStorageKey: (key) => key,
  document, window, localStorage, requestAnimationFrame: (callback) => queueMicrotask(callback),
};
const createTour = new Function(...Object.keys(dependencies), compiled + '\nreturn { initializeAppTour, useAppTour };');
const tour = createTour(...Object.values(dependencies));
const settle = async () => { for (let i = 0; i < 10; i++) await nextTick(); };
tour.initializeAppTour();
await settle();
assert.deepEqual(highlighted, [], 'First-time guest must wait for runtime readiness');
// Navigation becomes available when the app leaves its loading screen.
targetMounted = true;
waveBinderStatus.value = 'ready';
await settle();
assert.deepEqual(highlighted, ['[data-tour="nav-home"]']);
config.onDestroyed();
assert.equal(saved.get('gtt:tour-seen'), '1');

// A missing target must not produce a floating popover or mark onboarding complete.
saved.clear();
targetMounted = false;
await tour.useAppTour().startTour();
assert.equal(highlighted.length, 1);
assert.equal(saved.get('gtt:tour-seen'), undefined);
assert.equal(tour.useAppTour().tourError.value, true);
console.log('PASS: first-time guest waits for mounted Home; missing targets do not display or complete onboarding.');
