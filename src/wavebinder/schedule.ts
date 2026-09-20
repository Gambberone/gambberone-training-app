import { wb } from './index';
import type { SingleNode } from 'wave-binder';
import type { ScheduledWorkout } from '../stores/workoutCreator';

type ScheduleInput = {
  date?: string;
  workoutId?: string;
  time?: string;
  scheduled?: ScheduledWorkout[];
};

const inputNode = () => wb.getNodeByName('scheduleInput') as SingleNode;
const errorsNode = () => wb.getNodeByName('scheduleValidationErrors') as SingleNode;

export const scheduleValidationErrors = (input: ScheduleInput) => {
  inputNode().next(input);
  return (errorsNode().getNodeValue() as string[] | null) ?? [];
};
