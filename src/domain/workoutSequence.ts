import type { WorkoutCreatorStep } from '../constants/workout';

function stepGroups(steps: WorkoutCreatorStep[]) {
  const groups: { index: number; steps: WorkoutCreatorStep[] }[] = [];
  steps.forEach((step, index) => {
    const previous = groups.at(-1);
    if (step.type === 'SETPAUSE' && previous?.steps[0]?.type === 'EXERCISE')
      previous.steps.push(step);
    else groups.push({ index, steps: [step] });
  });
  return groups;
}
function numberedSteps(groups: { steps: WorkoutCreatorStep[] }[]) {
  return groups
    .flatMap((group) => group.steps)
    .map((step, index) => ({ ...step, step: index + 1 }));
}
export function moveWorkoutStep(steps: WorkoutCreatorStep[], index: number, direction: -1 | 1) {
  const groups = stepGroups(steps);
  const position = groups.findIndex((group) => group.index === index);
  const target = position + direction;
  if (position < 0 || target < 0 || target >= groups.length) return steps;
  [groups[position], groups[target]] = [groups[target]!, groups[position]!];
  return numberedSteps(groups);
}
export function duplicateWorkoutStep(steps: WorkoutCreatorStep[], index: number) {
  const groups = stepGroups(steps);
  const position = groups.findIndex((group) => group.index === index);
  const group = groups[position];
  if (!group || group.steps[0]?.type === 'WARMUP') return steps;
  const copies = JSON.parse(JSON.stringify(group.steps)) as WorkoutCreatorStep[];
  copies.forEach((step) => {
    step.warmupExercises?.forEach((exercise) => {
      exercise.id = crypto.randomUUID();
    });
    step.stretchingExercises?.forEach((exercise) => {
      exercise.id = crypto.randomUUID();
    });
  });
  groups.splice(position + 1, 0, { index: -1, steps: copies });
  return numberedSteps(groups);
}

export function removeWorkoutStep(steps: WorkoutCreatorStep[], index: number) {
  const groups = stepGroups(steps);
  const position = groups.findIndex((group) => group.index === index);
  if (position < 0) return steps;
  groups.splice(position, 1);
  return numberedSteps(groups);
}
