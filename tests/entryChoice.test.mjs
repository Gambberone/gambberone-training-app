import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const saved = new Map();
const storage = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
const loadChoice = () => new Function('localStorage', compile('../src/composables/localMode.ts').replace(/export /g, '') + '\nreturn { hasChosenLocalMode, chooseLocalMode };')(storage);
const choice = loadChoice();
let guard;
const currentUser = { value: null };
const isAuthenticated = { value: false };
const activeWorkoutSessionRef = { value: null };
const dependencies = {
  authReady: Promise.resolve(), useAuth: () => ({ currentUser, isAuthenticated }),
  createRouter: () => ({ beforeEach: (callback) => { guard = callback; } }),
  createWebHistory: () => ({}), routes: [], activeWorkoutSessionRef,
  hasChosenLocalMode: choice.hasChosenLocalMode,
};
new Function(...Object.keys(dependencies), compile('../src/router/index.ts').replace(/^import .*;$/gm, '').replace('export default router;', ''))(...Object.values(dependencies));
const app = (name) => ({ name, matched: [{ meta: { appRoute: true } }] });
const login = { name: 'login', matched: [{ meta: {} }] };
assert.deepEqual(await guard(app('home')), { name: 'login' });
assert.deepEqual(await guard(app('workouts')), { name: 'login' });
assert.equal(await guard(login), undefined);
activeWorkoutSessionRef.value = { id: 'cached-session' };
assert.equal(await guard(login), undefined, 'An old session must not cause a redirect loop before choosing');
activeWorkoutSessionRef.value = null;
choice.chooseLocalMode();
assert.equal(loadChoice().hasChosenLocalMode(), true, 'Choice survives module reload');
assert.equal(await guard(app('home')), undefined);
assert.equal(await guard(app('workouts')), undefined);
assert.deepEqual(await guard({ name: 'friends', matched: [{ meta: { appRoute: true, requiresAuth: true } }] }), { name: 'login' });
assert.equal(await guard(login), undefined, 'Guest can still choose to connect an account');
saved.clear();
isAuthenticated.value = true;
currentUser.value = { emailVerified: true };
assert.equal(await guard(app('home')), undefined, 'Existing signed-in users need no guest flag');
assert.deepEqual(await guard(login), { name: 'home' });
currentUser.value.emailVerified = false;
assert.deepEqual(await guard(app('home')), { name: 'verify-email' });
console.log('PASS: first visit, explicit guest choice, reload, account connection and protected social routes.');
