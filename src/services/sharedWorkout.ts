import { computed, ref, watch } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { localRef } from "@/composables/localRef";
import { localizedExerciseName } from "@/localization";
import { exercisesRef } from "@/stores/exercises";
import {
  activeWorkoutSessionRef,
  clearWorkoutPlaybackCheckpoint,
  isWorkoutPlayerOpenRef,
  sharedWorkoutPendingRef,
  workoutSessionsRef,
  type Workout,
} from "@/stores/workoutCreator";
import { sharedElapsed } from "@/domain/sharedPlayback";

export type SharedWorkout = Workout & { exerciseNames: Record<string, string> };
export type SharedRoom = {
  id: string;
  hostId: string;
  guestId: string;
  participants: string[];
  names: Record<string, string>;
  workout: SharedWorkout;
  status: "waiting" | "running" | "paused" | "completed" | "cancelled";
  elapsedMs: number;
  anchor: Timestamp;
  createdAt: Timestamp;
};
export type SharedMember = {
  accepted: boolean;
  ready: boolean;
  left: boolean;
  pauseRequested: boolean;
  updatedAt: Timestamp;
};
export const selectedTogetherWorkout = ref<Workout>();
export const sharedRoomId = localRef<string | null>(
  "gtt:shared-room",
  () => null,
);
export const sharedRoom = ref<SharedRoom>();
export const sharedMembers = ref<Record<string, SharedMember>>({});
export const sharedInvites = ref<SharedRoom[]>([]);
export const sharedError = ref(false);
export const sharedBusy = ref(false);
export const sharedConnected = ref(false);
export const sharedNow = ref(Date.now());
let clockOffset = 0;
let authenticatedUid: string | undefined;
let generation = 0;
let started = false;
const roomRef = (id: string) => doc(db, "workoutRooms", id);
const memberRef = (id: string, uid: string) => doc(roomRef(id), "members", uid);
export const isSharedHost = computed(
  () => !!sharedRoom.value && sharedRoom.value.hostId === authenticatedUid,
);
export const isSharedPlayback = computed(
  () => !!activeWorkoutSessionRef.value?.sharedRoomId,
);
const sharedCommandAllowed = computed(
  () => isSharedHost.value && sharedConnected.value &&
    ["running", "paused"].includes(sharedRoom.value?.status ?? ""),
);
export const sharedCanControl = computed(
  () => !isSharedPlayback.value || (sharedCommandAllowed.value && !sharedBusy.value),
);
export const sharedPartner = computed(() => {
  const room = sharedRoom.value;
  return room
    ? (room.names[room.participants.find((id) => id !== authenticatedUid)!] ??
        "")
    : "";
});
export const partnerUnavailable = computed(() => {
  const room = sharedRoom.value;
  if (!room) return false;
  const other =
    sharedMembers.value[
      room.participants.find((id) => id !== authenticatedUid)!
    ];
  return (
    !other ||
    other.left ||
    sharedNow.value - (other.updatedAt?.toMillis() ?? 0) > 65000
  );
});
export function roomElapsed(room = sharedRoom.value) {
  if (!room?.anchor) return 0;
  return sharedElapsed(
    room.elapsedMs,
    room.anchor.toMillis(),
    Date.now() + clockOffset,
    room.status === "running",
  );
}
export async function sharedAction(action: () => Promise<unknown>) {
  if (sharedBusy.value) return;
  sharedBusy.value = true;
  sharedError.value = false;
  try {
    await action();
  } catch {
    sharedError.value = true;
  } finally {
    sharedBusy.value = false;
  }
}
export async function createSharedRoom(
  workout: Workout,
  guestId: string,
  guestName: string,
) {
  const user = auth.currentUser;
  if (
    !user ||
    activeWorkoutSessionRef.value ||
    sharedRoomId.value ||
    !navigator.onLine
  )
    throw new Error("Unavailable");
  const id = crypto.randomUUID();
  const exerciseIds = new Set(
    workout.steps.flatMap((step) => [
      step.exerciseId,
      ...(step.warmupExercises ?? []).map((exercise) => exercise.exerciseId),
      ...(step.stretchingExercises ?? []).map(
        (exercise) => exercise.exerciseId,
      ),
    ]),
  );
  const snapshot = JSON.parse(
    JSON.stringify({
      ...workout,
      exerciseNames: Object.fromEntries(
        exercisesRef.value
          .filter((exercise) => exerciseIds.has(exercise.id))
          .map((exercise) => [exercise.id, localizedExerciseName(exercise)]),
      ),
    }),
  ) as SharedWorkout;
  const batch = writeBatch(db);
  batch.set(roomRef(id), {
    hostId: user.uid,
    guestId,
    participants: [user.uid, guestId],
    names: {
      [user.uid]: user.displayName || user.email || "Io",
      [guestId]: guestName,
    },
    workout: snapshot,
    status: "waiting",
    elapsedMs: -4000,
    anchor: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  batch.set(memberRef(id, user.uid), {
    accepted: true,
    ready: false,
    left: false,
    pauseRequested: false,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  sharedRoomId.value = id;
  selectedTogetherWorkout.value = undefined;
}
export async function joinSharedRoom(id: string) {
  const uid = auth.currentUser?.uid;
  if (
    !uid ||
    activeWorkoutSessionRef.value ||
    sharedRoomId.value ||
    !navigator.onLine
  )
    throw new Error("Busy");
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef(id));
    const room = snapshot.data() as SharedRoom;
    if (!room || room.guestId !== uid || room.status !== "waiting")
      throw new Error("Expired");
    transaction.set(memberRef(id, uid), {
      accepted: true,
      ready: false,
      left: false,
      pauseRequested: false,
      updatedAt: serverTimestamp(),
    });
  });
  sharedRoomId.value = id;
}
export async function declineSharedRoom(id: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(memberRef(id, uid), {
    accepted: false,
    ready: false,
    left: true,
    pauseRequested: false,
    updatedAt: serverTimestamp(),
  });
}
export async function setSharedReady() {
  const room = sharedRoom.value,
    uid = auth.currentUser?.uid;
  if (!room || !uid || !sharedConnected.value) throw new Error("Disconnected");
  await setDoc(
    memberRef(room.id, uid),
    { ready: !sharedMembers.value[uid]?.ready, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
export async function startSharedRoom() {
  const id = sharedRoomId.value;
  if (!id) return;
  await runTransaction(db, async (transaction) => {
    const room = (await transaction.get(roomRef(id))).data() as SharedRoom;
    const host = (
      await transaction.get(memberRef(id, room.hostId))
    ).data() as SharedMember;
    const guest = (
      await transaction.get(memberRef(id, room.guestId))
    ).data() as SharedMember;
    if (
      room.status !== "waiting" ||
      !host?.ready ||
      !guest?.ready ||
      host.left ||
      guest.left ||
      partnerUnavailable.value
    )
      throw new Error("Not ready");
    transaction.update(roomRef(id), {
      status: "running",
      elapsedMs: -4000,
      anchor: serverTimestamp(),
    });
  });
}
export async function commandSharedRoom(
  action: "pause" | "resume" | "seek",
  elapsedMs?: number,
) {
  const id = sharedRoomId.value;
  // sharedAction sets busy before invoking this command. Busy disables new
  // button presses; it must not reject the command already being executed.
  if (!id || !sharedCommandAllowed.value) throw new Error("Not allowed");
  await runTransaction(db, async (transaction) => {
    const room = (await transaction.get(roomRef(id))).data() as SharedRoom;
    if (
      room.hostId !== auth.currentUser?.uid ||
      !["running", "paused"].includes(room.status)
    )
      throw new Error("Not allowed");
    transaction.update(roomRef(id), {
      elapsedMs: action === "seek" ? elapsedMs! : roomElapsed(room),
      status:
        action === "pause"
          ? "paused"
          : action === "resume"
            ? "running"
            : room.status,
      anchor: serverTimestamp(),
    });
  });
}
export async function requestSharedPause() {
  const id = sharedRoomId.value,
    uid = auth.currentUser?.uid;
  if (!id || !uid || !sharedConnected.value) throw new Error("Disconnected");
  await setDoc(
    memberRef(id, uid),
    {
      pauseRequested: !sharedMembers.value[uid]?.pauseRequested,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
export async function leaveSharedRoom(continueSolo = false) {
  const room = sharedRoom.value,
    uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Unavailable");
  if (!room) {
    // A cached workout can still be recovered when the room cannot be loaded.
    const session = activeWorkoutSessionRef.value;
    if (session?.sharedRoomId) {
      if (continueSolo) {
        delete session.sharedRoomId;
        session.isPaused = true;
      } else {
        activeWorkoutSessionRef.value = null;
        isWorkoutPlayerOpenRef.value = false;
        clearWorkoutPlaybackCheckpoint();
      }
    }
    sharedRoomId.value = null;
    return;
  }
  const elapsed = roomElapsed();
  const batch = writeBatch(db);
  batch.set(
    memberRef(room.id, uid),
    { left: true, ready: false, updatedAt: serverTimestamp() },
    { merge: true },
  );
  if (room.hostId === uid && !["completed", "cancelled"].includes(room.status))
    batch.update(roomRef(room.id), {
      status: "cancelled",
      elapsedMs: elapsed,
      anchor: serverTimestamp(),
    });
  const departure = batch.commit();
  // Offline departures stay in Firestore's write queue; solo playback can start immediately.
  if (navigator.onLine) await departure;
  else
    void departure.catch(() => {
      sharedError.value = true;
    });
  const session = activeWorkoutSessionRef.value;
  if (session?.sharedRoomId === room.id) {
    if (continueSolo) {
      delete session.sharedRoomId;
      session.isPaused = true;
    } else {
      activeWorkoutSessionRef.value = null;
      isWorkoutPlayerOpenRef.value = false;
      clearWorkoutPlaybackCheckpoint();
    }
  }
  sharedRoomId.value = null;
}

function attachPlayback() {
  const room = sharedRoom.value,
    uid = authenticatedUid;
  if (
    !room ||
    !uid ||
    sharedRoomId.value !== room.id ||
    activeWorkoutSessionRef.value ||
    !["running", "paused"].includes(room.status)
  )
    return;
  const member = sharedMembers.value[uid];
  if (
    !member?.accepted ||
    member.left ||
    workoutSessionsRef.value.some((item) => item.sharedRoomId === room.id)
  )
    return;
  clearWorkoutPlaybackCheckpoint();
  activeWorkoutSessionRef.value = {
    id: crypto.randomUUID(),
    workoutId: room.workout.id,
    workoutName: room.workout.name,
    sharedWorkout: room.workout,
    sharedRoomId: room.id,
    trainedWith:
      room.names[room.participants.find((item) => item !== uid)!] ?? "",
    startedAt: new Date().toISOString(),
    isPaused: room.status === "paused",
    currentStepIndex: 0,
    completedStepIndexes: [],
  };
  isWorkoutPlayerOpenRef.value = true;
}

export function startSharedWorkouts() {
  if (started) return;
  started = true;
  let stopInvites: (() => void) | undefined;
  let stopRoom: (() => void) | undefined;
  let stopMembers: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let startedForUser: string | undefined;
  const bindRoom = () => {
    const token = ++generation;
    stopRoom?.();
    stopMembers?.();
    clearInterval(heartbeat);
    sharedRoom.value = undefined;
    sharedMembers.value = {};
    sharedConnected.value = false;
    const id = sharedRoomId.value,
      uid = authenticatedUid;
    if (!id || !uid) return;
    const pulse = async () => {
      if (!navigator.onLine || document.visibilityState === "hidden") {
        sharedConnected.value = false;
        return;
      }
      const before = Date.now();
      try {
        await setDoc(
          memberRef(id, uid),
          { updatedAt: serverTimestamp() },
          { merge: true },
        );
        const snapshot = await getDocFromServer(memberRef(id, uid));
        if (token !== generation) return;
        const timestamp = snapshot.data()?.updatedAt?.toMillis();
        if (timestamp) clockOffset = timestamp - (before + Date.now()) / 2;
        sharedConnected.value = true;
      } catch (error) {
        console.warn("Unable to refresh shared workout connection", error);
        if (token === generation) sharedConnected.value = false;
      }
    };
    stopRoom = onSnapshot(
      roomRef(id),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (token !== generation) return;
        if (!snapshot.exists()) {
          if (!snapshot.metadata.fromCache) sharedRoomId.value = null;
          return;
        }
        // Wait for the authoritative timestamp, including our own commands.
        if (snapshot.metadata.hasPendingWrites) return;
        const room = { ...snapshot.data(), id } as SharedRoom;
        sharedRoom.value = room;
        attachPlayback();
      },
      () => {
        sharedError.value = true;
        sharedConnected.value = false;
      },
    );
    stopMembers = onSnapshot(
      collection(roomRef(id), "members"),
      (snapshots) => {
        if (token !== generation) return;
        sharedMembers.value = Object.fromEntries(
          snapshots.docs.map((item) => [item.id, item.data() as SharedMember]),
        );
        attachPlayback();
      },
      () => {
        sharedError.value = true;
      },
    );
    void pulse();
    heartbeat = setInterval(() => void pulse(), 20000);
  };
  watch(sharedRoomId, (id) => {
    sharedWorkoutPendingRef.value = !!id;
    bindRoom();
  });
  sharedWorkoutPendingRef.value = !!sharedRoomId.value;
  onAuthStateChanged(auth, (user) => {
    stopInvites?.();
    authenticatedUid = user?.uid;
    sharedInvites.value = [];
    if (!user || (startedForUser && startedForUser !== user.uid))
      sharedRoomId.value = null;
    startedForUser = user?.uid;
    bindRoom();
    if (!user) return;
    stopInvites = onSnapshot(
      query(
        collection(db, "workoutRooms"),
        where("participants", "array-contains", user.uid),
      ),
      (snapshots) => {
        sharedInvites.value = snapshots.docs
          .map((item) => ({ ...item.data(), id: item.id }) as SharedRoom)
          .filter(
            (room) =>
              room.guestId === user.uid &&
              room.status === "waiting" &&
              Date.now() + clockOffset - (room.createdAt?.toMillis() ?? 0) <
                3600000,
          );
      },
      () => {
        sharedError.value = true;
      },
    );
  });
  setInterval(() => {
    sharedNow.value = Date.now() + clockOffset;
  }, 1000);
  window.addEventListener("offline", () => {
    sharedConnected.value = false;
  });
  window.addEventListener("online", bindRoom);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") bindRoom();
  });
  watch(activeWorkoutSessionRef, (current, previous) => {
    if (!current) attachPlayback();
    if (
      !previous?.sharedRoomId ||
      current?.sharedRoomId === previous.sharedRoomId
    )
      return;
    if (current) return; // Explicit solo continuation is handled by leaveSharedRoom.
    const completed = workoutSessionsRef.value.some(
      (session) => session.id === previous.id && session.completedAt,
    );
    const id = previous.sharedRoomId;
    if (sharedRoom.value?.hostId === authenticatedUid && completed) {
      void runTransaction(db, async (transaction) => {
        const room = (await transaction.get(roomRef(id))).data() as SharedRoom;
        if (room && ["running", "paused"].includes(room.status))
          transaction.update(roomRef(id), {
            status: "completed",
            elapsedMs: roomElapsed(room),
            anchor: serverTimestamp(),
          });
      }).catch(() => {
        sharedError.value = true;
      });
    }
    if (completed) sharedRoomId.value = null;
  });
}
