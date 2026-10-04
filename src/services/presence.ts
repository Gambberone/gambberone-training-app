import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { ref } from "vue";

export const presenceEnabled = ref(false);
export const presenceReady = ref(false);
export const presenceSaving = ref(false);
export const presenceError = ref(false);
const clientId = crypto.randomUUID();
let started = false;
let session: DocumentReference | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let version = 0;
const prunedUsers = new Set<string>();
async function pruneExpiredSessions(userId: string) {
  if (prunedUsers.has(userId)) return;
  prunedUsers.add(userId);
  try {
    const expired = await getDocs(
      query(
        collection(db, "friendPresence", userId, "sessions"),
        where("updatedAt", "<", Timestamp.fromMillis(Date.now() - 90000)),
      ),
    );
    for (let offset = 0; offset < expired.docs.length; offset += 400) {
      const batch = writeBatch(db);
      expired.docs
        .slice(offset, offset + 400)
        .forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
  } catch {
    prunedUsers.delete(userId);
  }
}
function clearSession() {
  if (timer) clearInterval(timer);
  timer = undefined;
  const previous = session;
  session = undefined;
  if (previous) void deleteDoc(previous).catch(() => {});
}
function refreshSession() {
  clearSession();
  const user = auth.currentUser;
  if (
    !user ||
    !presenceEnabled.value ||
    document.visibilityState !== "visible" ||
    !navigator.onLine
  )
    return;
  void pruneExpiredSessions(user.uid);
  const target = doc(db, "friendPresence", user.uid, "sessions", clientId);
  session = target;
  const heartbeat = () => {
    void setDoc(target, { updatedAt: serverTimestamp() }).catch(() => {});
  };
  heartbeat();
  timer = setInterval(heartbeat, 30000);
}
export function startPresence() {
  if (started) return;
  started = true;
  let stop: (() => void) | undefined;
  onAuthStateChanged(auth, (user) => {
    stop?.();
    clearSession();
    version++;
    presenceEnabled.value = false;
    presenceReady.value = false;
    presenceError.value = false;
    if (!user) return;
    const generation = version;
    stop = onSnapshot(
      doc(db, "friendPresence", user.uid),
      (snapshot) => {
        if (generation !== version) return;
        const enabled = snapshot.data()?.enabled === true;
        const changed = enabled !== presenceEnabled.value;
        presenceEnabled.value = enabled;
        presenceReady.value = true;
        if (changed) refreshSession();
      },
      () => {
        if (generation !== version) return;
        presenceError.value = true;
        presenceEnabled.value = false;
        clearSession();
      },
    );
  });
  document.addEventListener("visibilitychange", refreshSession);
  window.addEventListener("online", refreshSession);
  window.addEventListener("offline", clearSession);
  window.addEventListener("pagehide", clearSession);
  window.addEventListener("pageshow", refreshSession);
}
export async function setPresenceEnabled(enabled: boolean) {
  const user = auth.currentUser;
  if (!user || !presenceReady.value || presenceSaving.value) return;
  const generation = version;
  presenceSaving.value = true;
  presenceError.value = false;
  try {
    await setDoc(doc(db, "friendPresence", user.uid), { enabled });
    if (generation === version) {
      presenceEnabled.value = enabled;
      refreshSession();
    }
  } catch {
    if (generation === version) presenceError.value = true;
  } finally {
    presenceSaving.value = false;
  }
}
export function listenFriendPresence(
  userId: string,
  callback: (timestamps: number[]) => void,
) {
  let stopSessions: (() => void) | undefined;
  let enabled = false;
  const stop = onSnapshot(
    doc(db, "friendPresence", userId),
    (snapshot) => {
      stopSessions?.();
      stopSessions = undefined;
      callback([]);
      enabled = snapshot.data()?.enabled === true;
      if (!enabled) return;
      stopSessions = onSnapshot(
        collection(db, "friendPresence", userId, "sessions"),
        (sessions) => {
          if (enabled)
            callback(
              sessions.docs.map(
                (item) => item.data().updatedAt?.toMillis?.() ?? 0,
              ),
            );
        },
        () => callback([]),
      );
    },
    () => {
      enabled = false;
      stopSessions?.();
      callback([]);
    },
  );
  return () => {
    enabled = false;
    stop();
    stopSessions?.();
  };
}
