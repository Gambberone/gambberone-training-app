import type { SingleNode } from 'wave-binder';
import type { WorkoutCreatorStep } from '@/constants';
import { wb } from './index';

export const estimateWorkoutDuration = (steps: WorkoutCreatorStep[]) => {
  (wb.getNodeByName('workoutDurationSteps') as SingleNode).next(steps);
  return Number((wb.getNodeByName('workoutEstimatedDuration') as SingleNode).getNodeValue() ?? 0);
};
