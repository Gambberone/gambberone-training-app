export type CreatorGuideStage = 'name' | 'add' | 'exercise' | 'execution' | 'recovery' | 'configure' | 'commit' | 'sequence' | 'save';

export function creatorGuideStage(state: {
  name: string;
  nameConfirmed: boolean;
  stepType?: string;
  stepCount: number;
  selectedExercise: boolean;
  detail: number;
  reviewedSequence: boolean;
}): CreatorGuideStage {
  // Follow the current editor without changing the user's draft or navigation.
  if (state.stepType) {
    if (state.stepType === 'EXERCISE') {
      if (!state.selectedExercise) return 'exercise';
      return state.detail === 0 ? 'execution' : state.detail === 1 ? 'recovery' : 'commit';
    }
    return state.detail === 0 ? 'configure' : 'commit';
  }
  if (!state.nameConfirmed || !state.name.trim()) return 'name';
  if (!state.stepCount) return 'add';
  return state.reviewedSequence ? 'save' : 'sequence';
}
