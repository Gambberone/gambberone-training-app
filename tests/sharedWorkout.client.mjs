// Isolated client using the actual Vue service and Firebase SDK against local emulators.
import { FetchXmlHttpRequest } from "./fetchXmlHttpRequest.mjs";
import { createServer } from "vite";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { fileURLToPath } from "node:url";
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.document = Object.assign(new EventTarget(), {
  visibilityState: "visible",
  documentElement: { lang: "" },
  createElement: () => ({}),
});
globalThis.window = Object.assign(new EventTarget(), {
  location: { href: "http://localhost/" },
});
Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true, userAgent: "Node integration test" },
  configurable: true,
});
globalThis.self = globalThis;
globalThis.XMLHttpRequest = FetchXmlHttpRequest;
process.env.VITE_FIREBASE_API_KEY = "fake-api-key";
process.env.VITE_FIREBASE_PROJECT_ID = "demo-gtt-presence";
process.env.VITE_FIREBASE_AUTH_DOMAIN = "demo-gtt-presence.firebaseapp.com";
const server = await createServer({
  resolve: {
    alias: {
      "firebase/firestore": fileURLToPath(
        new URL(
          "../node_modules/@firebase/firestore/dist/index.esm.js",
          import.meta.url,
        ),
      ),
    },
  },
  server: { middlewareMode: true, ws: { port: 0 }, watch: null },
  appType: "custom",
});
const { auth, db } = await server.ssrLoadModule("/src/firebase.ts");
connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
const { connectFirestoreEmulator, disableNetwork, enableNetwork } =
  await server.ssrLoadModule(
    "/node_modules/@firebase/firestore/dist/index.esm.js",
  );
connectFirestoreEmulator(db, "127.0.0.1", 8189);
const api = await server.ssrLoadModule("/src/services/sharedWorkout.ts");
const store = await server.ssrLoadModule("/src/stores/workoutCreator.ts");
const { exercisesRef } = await server.ssrLoadModule("/src/stores/exercises.ts");
if (process.argv[2] === "Host")
  exercisesRef.value.push({
    id: "custom-test",
    name: "Custom press",
    muscleGroupId: "CHEST",
  });
const user = (
  await createUserWithEmailAndPassword(
    auth,
    `${process.argv[2]}-${Date.now()}@example.test`,
    "test-password-only",
  )
).user;
await updateProfile(user, { displayName: process.argv[2] });
api.startSharedWorkouts();
const waitFor = async (predicate) => {
  const deadline = Date.now() + 15000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error(
        `Timed out: roomId=${api.sharedRoomId.value}, room=${api.sharedRoom.value?.status}, connected=${api.sharedConnected.value}, error=${api.sharedError.value}, members=${JSON.stringify(api.sharedMembers.value)}`,
      );
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
};
process.send({ ready: true, uid: user.uid });
process.on("message", async ({ id, action, args = [] }) => {
  try {
    let result;
    switch (action) {
      case "invite":
        await api.createSharedRoom(
          {
            id: "test-workout",
            name: "Shared intervals",
            steps: [
              {
                step: 1,
                type: "EXERCISE",
                exerciseId: "custom-test",
                exerciseModeType: "duration",
                exerciseDuration: 10,
                sets: 1,
                pauseBetweenSetsDuration: 0,
              },
            ],
          },
          ...args,
        );
        await waitFor(() => api.sharedConnected.value && api.sharedRoom.value);
        result = api.sharedRoomId.value;
        break;
      case "waitInvite":
        await waitFor(() =>
          api.sharedInvites.value.some((room) => room.id === args[0]),
        );
        break;
      case "join":
        await api.joinSharedRoom(args[0]);
        await waitFor(() => api.sharedConnected.value && api.sharedRoom.value);
        break;
      case "ready":
        await api.setSharedReady();
        await waitFor(() => api.sharedMembers.value[user.uid]?.ready);
        break;
      case "waitReady":
        await waitFor(
          () =>
            Object.values(api.sharedMembers.value).filter(
              (member) => member.ready,
            ).length === 2,
        );
        break;
      case "start":
        await api.startSharedRoom();
        break;
      case "waitStatus":
        await waitFor(() => api.sharedRoom.value?.status === args[0]);
        break;
      case "pause":
        await api.sharedAction(() => api.commandSharedRoom("pause"));
        if (api.sharedError.value) throw new Error("Wrapped pause failed");
        break;
      case "resume":
        await api.sharedAction(() => api.commandSharedRoom("resume"));
        if (api.sharedError.value) throw new Error("Wrapped resume failed");
        break;
      case "seek":
        await api.sharedAction(() => api.commandSharedRoom("seek", args[0]));
        if (api.sharedError.value) throw new Error("Wrapped seek failed");
        break;
      case "requestPause":
        await api.requestSharedPause();
        break;
      case "waitPauseRequest":
        await waitFor(() => api.sharedMembers.value[args[0]]?.pauseRequested);
        break;
      case "leaveSolo":
        await api.leaveSharedRoom(true);
        break;
      case "waitLeft":
        await waitFor(() => api.sharedMembers.value[args[0]]?.left);
        break;
      case "offlineSolo":
        await disableNetwork(db);
        navigator.onLine = false;
        window.dispatchEvent(new Event("offline"));
        await api.leaveSharedRoom(true);
        break;
      case "reconnect":
        navigator.onLine = true;
        await enableNetwork(db);
        window.dispatchEvent(new Event("online"));
        await waitFor(
          () => !api.sharedRoomId.value || api.sharedConnected.value,
        );
        break;
      case "waitElapsed":
        await waitFor(() => api.roomElapsed() >= args[0]);
        break;
      case "complete":
        store.completeWorkoutSession();
        break;
      case "inspect":
        result = {
          room: api.sharedRoom.value?.status,
          roomId: api.sharedRoomId.value,
          elapsed: api.roomElapsed(),
          session: store.activeWorkoutSessionRef.value,
          connected: api.sharedConnected.value,
          history: store.workoutSessionsRef.value,
        };
        break;
      case "close":
        process.exit(0);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    process.send({ id, result });
  } catch (error) {
    process.send({ id, error: error.stack });
  }
});
