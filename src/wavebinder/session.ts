import type { SingleNode } from 'wave-binder';
import type { WorkoutCreatorStep, WorkoutSession } from '@/constants';
import { wb } from './index';

export type SessionProgress = { total: number; completed: number; isComplete: boolean };

export const getSessionProgress = (session: WorkoutSession | null, steps: WorkoutCreatorStep[]) => {
  (wb.getNodeByName('sessionInput') as SingleNode).next({ session, steps });
  return (wb.getNodeByName('sessionProgress') as SingleNode).getNodeValue() as SessionProgress;
};
