import { localDataOwner, localStorageKey } from '@/composables/localRef';
import type { WorkoutSession } from '@/constants';
import { MUSCLE_GROUPS, exercises as seedExercises } from '@/domain/exercises';
import { auth, db } from '@/firebase';
import { exercisesRef } from '@/stores/exercises';
import {
  activeWorkoutSessionRef,
  scheduledWorkoutsRef,
  workoutSessionsRef,
  workoutsRef,
} from '@/stores/workoutCreator';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  waitForPendingWrites,
  writeBatch,
} from 'firebase/firestore';
import { watch, type Ref } from 'vue';

type Entity = { id: string };

const collections: { name: string; state: Ref<Entity[]> }[] = [
  { name: 'exercises', state: exercisesRef as Ref<Entity[]> },
  { name: 'workouts', state: workoutsRef as Ref<Entity[]> },
  { name: 'scheduledWorkouts', state: scheduledWorkoutsRef as Ref<Entity[]> },
  { name: 'workoutSessions', state: workoutSessionsRef as Ref<Entity[]> },
];

let activeUserId: string | null = null;
let applyingRemoteChange = false;
let unsubscribeCallbacks: (() => void)[] = [];
const remoteIds = new Map<string, Set<string>>();

const userDocument = (userId: string) => doc(db, 'users', userId);
const collectionDocument = (userId: string, name: string, id: string) =>
  doc(db, 'users', userId, name, id);

async function syncCollection(name: string, state: Ref<Entity[]>) {
  if (!activeUserId || localDataOwner() !== activeUserId || applyingRemoteChange) return;

  const userId = activeUserId;
  const previousIds = remoteIds.get(name) ?? new Set<string>();
  const currentIds = new Set(state.value.map((item) => item.id));
  const batch = writeBatch(db);

  state.value.forEach((item) => batch.set(collectionDocument(userId, name, item.id), item));
  previousIds.forEach((id) => {
    if (!currentIds.has(id)) batch.delete(collectionDocument(userId, name, id));
  });

  remoteIds.set(name, currentIds);
  await batch.commit();
}

async function syncActiveSession() {
  if (!activeUserId || localDataOwner() !== activeUserId || applyingRemoteChange) return;
  await setDoc(doc(userDocument(activeUserId), 'state', 'activeWorkoutSession'), {
    value: activeWorkoutSessionRef.value,
  });
}

async function migrateLocalData(userId: string) {
  const migrationRef = doc(userDocument(userId), 'state', 'migration');
  const migrationSnapshot = await getDoc(migrationRef);
  const migrationVersion = migrationSnapshot.data()?.version ?? 0;

  // v1 copied the data stored on the device into a newly created user account.
  if (migrationVersion < 1) {
    const batch = writeBatch(db);
    collections.forEach(({ name, state }) => {
      state.value.forEach((item) => batch.set(collectionDocument(userId, name, item.id), item));
    });
    batch.set(doc(userDocument(userId), 'state', 'activeWorkoutSession'), {
      value: activeWorkoutSessionRef.value,
    });
    batch.set(migrationRef, { version: 1, migratedAt: new Date().toISOString() });
    await batch.commit();
  }

  // v2 publishes the built-in exercise catalogue to every account. Existing documents
  // are deliberately left untouched: a user may have renamed or removed an exercise.
  if (migrationVersion < 2) {
    const batch = writeBatch(db);
    const existingExercises = await getDocs(collection(userDocument(userId), 'exercises'));
    const existingExerciseIds = new Set(existingExercises.docs.map((exercise) => exercise.id));

    seedExercises.forEach((exercise) => {
      if (!existingExerciseIds.has(exercise.id)) {
        batch.set(collectionDocument(userId, 'exercises', exercise.id), exercise);
      }
    });
    batch.set(migrationRef, { version: 2, migratedAt: new Date().toISOString() });
    await batch.commit();
  }
  // Add only the new glute exercises; preserve the existing catalogue and user edits.
  if (migrationVersion < 3) {
    const batch = writeBatch(db);
    const existingExercises = await getDocs(collection(userDocument(userId), 'exercises'));
    const existingIds = new Set(existingExercises.docs.map((exercise) => exercise.id));
    seedExercises
      .filter((exercise) => exercise.muscleGroupId === MUSCLE_GROUPS.GLUTES)
      .forEach((exercise) => {
        if (!existingIds.has(exercise.id)) {
          batch.set(collectionDocument(userId, 'exercises', exercise.id), exercise);
        }
      });
    batch.set(migrationRef, { version: 3, migratedAt: new Date().toISOString() });
    await batch.commit();
  }
}

function subscribeToUserData(userId: string) {
  collections.forEach(({ name, state }) => {
    unsubscribeCallbacks.push(
      onSnapshot(collection(userDocument(userId), name), (snapshot) => {
        if (activeUserId !== userId || localDataOwner() !== userId) return;
        applyingRemoteChange = true;
        state.value = snapshot.docs.map((item) => item.data() as Entity);
        remoteIds.set(name, new Set(snapshot.docs.map((item) => item.id)));
        applyingRemoteChange = false;
      }),
    );
  });

  unsubscribeCallbacks.push(
    onSnapshot(doc(userDocument(userId), 'state', 'activeWorkoutSession'), (snapshot) => {
      if (activeUserId !== userId || localDataOwner() !== userId) return;
      applyingRemoteChange = true;
      activeWorkoutSessionRef.value =
        (snapshot.data()?.value as WorkoutSession | null | undefined) ?? null;
      applyingRemoteChange = false;
    }),
  );
}

collections.forEach(({ name, state }) => {
  watch(
    state,
    () => {
      void syncCollection(name, state).catch((error) =>
        console.error(`Unable to sync ${name} with Firestore`, error),
      );
    },
    { deep: true, flush: 'sync' },
  );
});

watch(
  activeWorkoutSessionRef,
  () => {
    void syncActiveSession().catch((error) =>
      console.error('Unable to sync the active workout session with Firestore', error),
    );
  },
  { deep: true, flush: 'sync' },
);

export function startFirestoreSync() {
  onAuthStateChanged(auth, async (user) => {
    unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    unsubscribeCallbacks = [];
    remoteIds.clear();
    activeUserId = user?.uid ?? null;

    if (!user) return;

    try {
      await migrateLocalData(user.uid);
      if (activeUserId === user.uid) subscribeToUserData(user.uid);
    } catch (error) {
      console.error('Unable to initialize Firestore synchronization', error);
    }
  });
}

// Stop local synchronization before removing documents so snapshots cannot recreate them.
export async function deleteAccountData(userId: string) {
  activeUserId = null;
  unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
  unsubscribeCallbacks = [];
  try {
    await waitForPendingWrites(db);
    for (const name of [...collections.map((item) => item.name), 'state', 'settings', 'sharedWorkouts']) {
      const snapshot = await getDocs(collection(userDocument(userId), name));
      for (let offset = 0; offset < snapshot.docs.length; offset += 400) {
        const batch = writeBatch(db);
        snapshot.docs.slice(offset, offset + 400).forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }
    }
    const batch = writeBatch(db);
    batch.delete(userDocument(userId));
    await batch.commit();
  } catch (error) {
    if (auth.currentUser?.uid === userId) {
      activeUserId = userId;
      subscribeToUserData(userId);
    }
    throw error;
  }
}

export function resetDeletedAccountData() {
  collections.forEach(({ state }) => {
    state.value = [];
  });
  activeWorkoutSessionRef.value = null;
  localStorage.removeItem(localStorageKey('gtt:workout-playback'));
}
