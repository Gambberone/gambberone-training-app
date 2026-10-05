import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { effectScope } from 'vue';
import { NodeFactory } from '../node_modules/wave-binder/lib/wvb/node-factory.js';

// Test real local nodes and application functions without starting the license/network runtime.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const nodes = [];
try {
  const insights = await server.ssrLoadModule('/src/domain/workoutInsights.ts');
  const editor = await server.ssrLoadModule('/src/domain/exerciseValidation.ts');
  const agenda = await server.ssrLoadModule('/src/domain/agenda.ts');
  const choices = await server.ssrLoadModule('/src/domain/exerciseChoices.ts');
  const functions = { ...insights, ...editor, ...agenda, ...choices };
  const protoNodes = JSON.parse(await readFile(new URL('../src/wavebinder/protonodes.json', import.meta.url), 'utf8'));
  const names = new Set([
    'exerciseCatalog', 'selectedMuscleGroupId', 'selectedExercise',
    'catalogExerciseName', 'catalogExerciseMuscleGroup', 'catalogExerciseErrors', 'catalogExerciseCanSave',
    'insightSessions', 'insightScheduled', 'insightNow', 'historyFilter', 'completedWorkoutSessions',
    'workoutStatistics', 'filteredWorkoutHistory', 'pendingAgendaWorkouts',
  ]);
  const factory = new NodeFactory({}, { getNodes: () => nodes }, new Map(),
    Object.entries(functions).filter(([, fn]) => typeof fn === 'function')
      .map(([name, implementation]) => ({ name, implementation })));
  nodes.push(...protoNodes.filter((node) => names.has(node.name)).map((node) => factory.craftNode(node)));
  factory.tangleNodes(nodes);
  const node = (name) => factory.getNodeByName(name);
  const value = (name) => node(name).getNodeValue();

  const catalog = [
    { id: 'push-up', name: 'Push-up', muscleGroupId: 'CHEST' },
    { id: 'squat', name: 'Squat', muscleGroupId: 'LEGS' },
  ];
  node('exerciseCatalog').next(catalog);
  node('selectedMuscleGroupId').next('CHEST');
  assert.deepEqual(node('selectedExercise').choices.map((exercise) => exercise.id), ['push-up']);
  node('selectedExercise').setSelection(0);
  node('exerciseCatalog').next([...catalog, { id: 'fly', name: 'Fly', muscleGroupId: 'CHEST' }]);
  assert.deepEqual(node('selectedExercise').choices.map((exercise) => exercise.id), ['push-up', 'fly']);
  node('exerciseCatalog').next([catalog[1]]);
  assert.deepEqual(node('selectedExercise').choices, []);
  assert.equal(value('selectedExercise'), null);
  node('selectedMuscleGroupId').next('LEGS');
  assert.deepEqual(node('selectedExercise').choices.map((exercise) => exercise.id), ['squat']);

  const duration = await server.ssrLoadModule('/src/domain/workoutDuration.ts');
  const steps = [
    { type: 'WARMUP', warmupExercises: [{ modeType: 'repetitions', repetitions: 10 }, { modeType: 'duration', duration: 20 }] },
    { type: 'EXERCISE', exerciseModeType: 'repetitions', exerciseRepetitions: 10, repetitionIntervalSeconds: 4, sets: 3, pauseBetweenSetsDuration: 15 },
    { type: 'EXERCISE', exerciseModeType: 'duration', exerciseDuration: 20, sets: 2 },
    { type: 'PAUSE', pauseDuration: 30 },
    { type: 'STRETCHING', stretchingExercises: [{ duration: 25 }] },
    { type: 'SETPAUSE', pauseDuration: 100 },
  ];
  const snapshot = structuredClone(steps);
  assert.equal(duration.estimateWorkoutDuration(steps), 295);
  assert.equal(duration.estimateWorkoutDuration([]), 0);
  assert.equal(duration.estimateWorkoutDuration(null), 0);
  assert.equal(duration.estimateWorkoutDuration([steps[1]]), 150);
  assert.equal(duration.estimateWorkoutDuration(steps), 295);
  assert.deepEqual(steps, snapshot);

  const { createRuntimeStatus } = await server.ssrLoadModule('/src/wavebinder/runtime.ts');
  const ready = createRuntimeStatus();
  assert.equal(ready.status.value, 'loading');
  await ready.initialize({ waitUntilReady: async () => {}, isReady: () => true });
  assert.equal(ready.status.value, 'ready');
  ready.invalidate();
  assert.equal(ready.status.value, 'unavailable');
  const invalid = createRuntimeStatus();
  await invalid.initialize({ waitUntilReady: async () => {}, isReady: () => false });
  assert.equal(invalid.status.value, 'unavailable');
  const rejected = createRuntimeStatus();
  await rejected.initialize({ waitUntilReady: async () => { throw new Error('offline'); }, isReady: () => false });
  assert.equal(rejected.status.value, 'unavailable');
  const interrupted = createRuntimeStatus();
  let resolve;
  const initializing = interrupted.initialize({ waitUntilReady: () => new Promise((done) => { resolve = done; }), isReady: () => true });
  interrupted.invalidate();
  resolve();
  await initializing;
  assert.equal(interrupted.status.value, 'unavailable');

  assert.equal(value('catalogExerciseCanSave'), false);
  node('catalogExerciseName').next('   ');
  node('catalogExerciseMuscleGroup').next('CHEST');
  assert.equal(value('catalogExerciseCanSave'), false);
  node('catalogExerciseName').next('  Push-up  ');
  assert.equal(value('catalogExerciseCanSave'), true);
  node('catalogExerciseMuscleGroup').next(null);
  assert.equal(value('catalogExerciseCanSave'), false);
  assert.equal(value('catalogExerciseErrors').muscleGroup, 'ui.muscle_group_is_required');
  node('catalogExerciseMuscleGroup').next('unknown');
  assert.equal(value('catalogExerciseCanSave'), false);
  node('catalogExerciseMuscleGroup').next('WARMUP');
  assert.equal(value('catalogExerciseCanSave'), true);

  const session = (id, completedAt, minutes = 10, extra = {}) => ({
    id, workoutId: 'w1', startedAt: new Date(Date.parse(completedAt) - minutes * 60000).toISOString(),
    completedAt, completedStepIndexes: [], ...extra,
  });
  const now = new Date('2026-10-05T12:00:00').getTime();
  const sessions = [
    session('today', '2026-10-05T10:00:00', 12, { scheduledWorkoutId: 'scheduled-today' }),
    session('last-week', '2026-09-28T10:00:00', 20),
    session('october', '2026-10-01T10:00:00', 15),
    session('earlier-week', '2026-09-21T10:00:00', 5),
    session('future', '2026-10-06T10:00:00'),
    { id: 'unfinished', workoutId: 'w1', startedAt: '2026-10-05T10:00:00' },
    { id: 'invalid', workoutId: 'w1', startedAt: 'bad', completedAt: 'bad' },
  ];
  node('insightNow').next(now);
  node('insightSessions').next(sessions);
  assert.deepEqual(value('completedWorkoutSessions').map((item) => item.id),
    ['today', 'october', 'last-week', 'earlier-week']);
  let stats = value('workoutStatistics');
  assert.equal(stats.weekSessions.length, 1);
  assert.equal(stats.weeklyMinutes, 12);
  assert.equal(stats.currentMonthMinutes, 27);
  assert.equal(stats.previousMonthMinutes, 25);
  assert.equal(stats.monthDifference, 0);
  assert.equal(stats.weeks[5].count, 1);
  assert.equal(stats.weeks[6].count, 2);
  assert.equal(stats.weeks[7].count, 1);
  assert.equal(stats.weekDifference, 1);
  node('historyFilter').next({ period: '7', workoutId: 'all' });
  assert.deepEqual(value('filteredWorkoutHistory').map((item) => item.id), ['today', 'october']);
  node('historyFilter').next({ period: 'all', workoutId: 'absent' });
  assert.deepEqual(value('filteredWorkoutHistory'), []);

  node('insightScheduled').next([
    { id: 'scheduled-today', workoutId: 'w1', date: '2026-10-05' },
    { id: 'legacy-match', workoutId: 'w1', date: '2026-10-01' },
    { id: 'tomorrow', workoutId: 'w1', date: '2026-10-06' },
  ]);
  assert.deepEqual(value('pendingAgendaWorkouts').map((item) => item.id), ['tomorrow']);
  // Changing the clock updates statistics, history, and agenda through their dependencies.
  node('insightNow').next(new Date('2026-10-06T12:00:00').getTime());
  assert.equal(value('workoutStatistics').weeklyMinutes, 22);
  assert.deepEqual(value('pendingAgendaWorkouts'), []);
  node('insightNow').next(new Date('2026-11-01T12:00:00').getTime());
  stats = value('workoutStatistics');
  assert.equal(stats.currentMonthSessions.length, 0);
  assert.equal(stats.previousMonthMinutes, 37);
  assert.equal(insights.sessionMinutes({ startedAt: 'bad', completedAt: 'bad' }), 0);
  assert.equal(insights.sessionMinutes({ startedAt: '2026-10-05T11:00:00', completedAt: '2026-10-05T10:00:00' }), 0);
  // Replacing persisted data propagates removal and empty states to every downstream node.
  node('insightSessions').next([]);
  assert.deepEqual(value('completedWorkoutSessions'), []);
  assert.equal(value('workoutStatistics').previousMonthMinutes, 0);
  assert.equal(value('pendingAgendaWorkouts').length, 3);

  const bridge = await server.ssrLoadModule('/src/composables/useWaveBinderNode.ts');
  const scope = effectScope();
  let name;
  let canSave;
  scope.run(() => {
    name = bridge.useWaveBinderNode(node('catalogExerciseName'));
    canSave = bridge.useWaveBinderValue(node('catalogExerciseCanSave'));
  });
  name.value = '';
  assert.equal(value('catalogExerciseName'), '');
  assert.equal(canSave.value, false);
  name.value = 'Squat';
  assert.equal(canSave.value, true);
  scope.stop();
  node('catalogExerciseName').next('');
  assert.equal(value('catalogExerciseCanSave'), false);
  assert.equal(canSave.value, true); // Scope disposal releases the subscription.
  console.log('PASS: catalog dependencies, pure duration, runtime lifecycle, exercise editor, shared statistics, period filters, agenda, clock rollover, Vue bridge');
} finally {
  nodes.forEach((node) => node.dispose());
  await server.close();
}
