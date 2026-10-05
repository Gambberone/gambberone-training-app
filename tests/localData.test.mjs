import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

class MemoryStorage {
  getItem(key) { return Object.hasOwn(this, key) ? this[key] : null; }
  setItem(key, value) { this[key] = String(value); }
  removeItem(key) { delete this[key]; }
}
globalThis.localStorage = new MemoryStorage();
const source = readFileSync(new URL('../src/composables/localRef.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace(/from 'vue'/g, `from '${import.meta.resolve('vue')}'`);
const load = (id) => import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${id}`);

localStorage.setItem('gtt:workouts', JSON.stringify([{ id: 'legacy' }]));
const store = await load('guest-first');
const workouts = store.localRef('gtt:workouts', () => []);
store.selectLocalDataOwner(null);
assert.deepEqual(workouts.value, [{ id: 'legacy' }]);
workouts.value.push({ id: 'guest' });
localStorage.setItem(store.localStorageKey('gtt:workout-playback'), 'guest-checkpoint');
store.selectLocalDataOwner('account-a');
assert.deepEqual(workouts.value, [], 'Guest workouts must not become account data');
assert.equal(localStorage.getItem(store.localStorageKey('gtt:workout-playback')), null);
workouts.value.push({ id: 'account' });
store.selectLocalDataOwner('account-b');
assert.deepEqual(workouts.value, [], 'Accounts must have separate caches');
store.selectLocalDataOwner(null);
assert.deepEqual(workouts.value, [{ id: 'legacy' }, { id: 'guest' }]);
assert.equal(localStorage.getItem(store.localStorageKey('gtt:workout-playback')), 'guest-checkpoint');
store.selectLocalDataOwner('account-a');
assert.deepEqual(workouts.value, [{ id: 'account' }]);
const reloaded = await load('reload');
assert.deepEqual(reloaded.localRef('gtt:workouts', () => []).value, [{ id: 'account' }]);

// Existing authenticated installations adopt their legacy cache, not the guest archive.
globalThis.localStorage = new MemoryStorage();
localStorage.setItem('gtt:workouts', JSON.stringify([{ id: 'existing-account' }]));
const legacy = await load('account-first');
const existing = legacy.localRef('gtt:workouts', () => []);
legacy.selectLocalDataOwner('existing-user');
assert.deepEqual(existing.value, [{ id: 'existing-account' }]);
legacy.selectLocalDataOwner(null);
assert.deepEqual(existing.value, []);
console.log('Local data isolation, persistence, checkpoints and legacy migration passed.');
