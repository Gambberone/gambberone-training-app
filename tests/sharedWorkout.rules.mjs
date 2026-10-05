import assert from "node:assert/strict";
const project = process.env.GCLOUD_PROJECT || "demo-gtt-presence";
const base = `http://${process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8189"}/v1/projects/${project}/databases/(default)/documents`;
function token(uid) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: uid, user_id: uid, aud: project, iss: `https://securetoken.google.com/${project}`, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, firebase: { sign_in_provider: "custom" } })}.`;
}
function value(data) {
  if (typeof data === "boolean") return { booleanValue: data };
  if (typeof data === "number") return { doubleValue: data };
  if (typeof data === "string") return { stringValue: data };
  if (Array.isArray(data)) return { arrayValue: { values: data.map(value) } };
  return { mapValue: { fields: fields(data) } };
}
const fields = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, data]) => [key, value(data)]),
  );
async function call(uid, path, method = "GET", data) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(uid ? { Authorization: `Bearer ${token(uid)}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}
function write(path, data, transforms = [], merge = false) {
  return {
    update: {
      name: `projects/${project}/databases/(default)/documents${path}`,
      fields: fields(data),
    },
    ...(merge ? { updateMask: { fieldPaths: Object.keys(data) } } : {}),
    ...(transforms.length
      ? {
          updateTransforms: transforms.map((fieldPath) => ({
            fieldPath,
            setToServerValue: "REQUEST_TIME",
          })),
        }
      : {}),
  };
}
const commit = (uid, writes) => call(uid, ":commit", "POST", { writes });
const roomPath = "/workoutRooms/sync-test";
const memberPath = (uid) => `${roomPath}/members/${uid}`;
const member = {
  accepted: true,
  ready: false,
  left: false,
  pauseRequested: false,
};
const room = {
  hostId: "sync-alice",
  guestId: "sync-bob",
  participants: ["sync-alice", "sync-bob"],
  names: { "sync-alice": "Alice", "sync-bob": "Bob" },
  workout: {
    id: "w1",
    name: "Intervals",
    steps: [{ type: "EXERCISE", exerciseDuration: 10 }],
    exerciseNames: {},
  },
  status: "waiting",
  elapsedMs: -4000,
};
assert.equal(
  (
    await commit("sync-alice", [
      write("/friendships/sync-alice_sync-bob", {
        participants: ["sync-alice", "sync-bob"],
        requester: "sync-alice",
        recipient: "sync-bob",
        status: "pending",
      }),
    ])
  ).status,
  200,
);
assert.equal(
  (
    await commit("sync-alice", [
      write(roomPath, room, ["anchor", "createdAt"]),
      write(memberPath("sync-alice"), member, ["updatedAt"]),
    ])
  ).status,
  403,
  "Cannot invite a pending friend",
);
assert.equal(
  (
    await commit("sync-bob", [
      write(
        "/friendships/sync-alice_sync-bob",
        { status: "accepted" },
        [],
        true,
      ),
    ])
  ).status,
  200,
);
assert.equal(
  (
    await commit("sync-alice", [
      write(roomPath, room, ["anchor", "createdAt"]),
      write(memberPath("sync-alice"), member, ["updatedAt"]),
    ])
  ).status,
  200,
  "Host creates room and membership atomically",
);
assert.equal((await call(null, roomPath)).status, 403);
assert.equal((await call("sync-eve", roomPath)).status, 403);
assert.equal(
  (await call("sync-bob", roomPath)).status,
  200,
  "Invited friend can inspect workout",
);
const command = (uid, status, elapsedMs = 0) =>
  commit(uid, [write(roomPath, { status, elapsedMs }, ["anchor"], true)]);
assert.equal(
  (await command("sync-bob", "running", -4000)).status,
  403,
  "Guest cannot start",
);
assert.equal(
  (await command("sync-alice", "running", -4000)).status,
  403,
  "Host must wait for readiness",
);
assert.equal(
  (
    await commit("sync-bob", [
      write(memberPath("sync-bob"), member, ["updatedAt"]),
    ])
  ).status,
  200,
  "Guest accepts",
);
assert.equal(
  (
    await commit("sync-eve", [
      write(memberPath("sync-eve"), member, ["updatedAt"]),
    ])
  ).status,
  403,
  "Only two invited participants",
);
assert.equal(
  (
    await commit("sync-bob", [
      write(memberPath("sync-alice"), { ready: true }, ["updatedAt"], true),
    ])
  ).status,
  403,
  "Cannot mark another user ready",
);
for (const uid of room.participants)
  assert.equal(
    (
      await commit(uid, [
        write(memberPath(uid), { ready: true }, ["updatedAt"], true),
      ])
    ).status,
    200,
  );
assert.equal(
  (await command("sync-alice", "running", -4000)).status,
  200,
  "Start once both ready",
);
assert.equal(
  (
    await commit("sync-bob", [
      write(
        memberPath("sync-bob"),
        { pauseRequested: true },
        ["updatedAt"],
        true,
      ),
    ])
  ).status,
  200,
);
assert.equal(
  (await command("sync-bob", "paused", 2500)).status,
  403,
  "Guest pause needs host action",
);
assert.equal((await command("sync-alice", "paused", 2500)).status, 200);
assert.equal((await command("sync-alice", "running", 2500)).status, 200);
assert.equal(
  (await command("sync-alice", "running", 13000)).status,
  200,
  "Host can seek",
);
assert.equal(
  (
    await commit("sync-alice", [
      write(
        roomPath,
        { participants: ["sync-alice", "sync-eve"] },
        ["anchor"],
        true,
      ),
    ])
  ).status,
  403,
  "Participant list immutable",
);
assert.equal(
  (
    await commit("sync-alice", [
      write(
        roomPath,
        { workout: { ...room.workout, name: "Changed" } },
        ["anchor"],
        true,
      ),
    ])
  ).status,
  403,
  "Workout snapshot immutable",
);
assert.equal(
  (
    await commit("sync-alice", [
      {
        update: {
          name: `projects/${project}/databases/(default)/documents${roomPath}`,
          fields: { anchor: { timestampValue: "2099-01-01T00:00:00Z" } },
        },
        updateMask: { fieldPaths: ["anchor"] },
      },
    ])
  ).status,
  403,
  "Anchor must be server time",
);
assert.equal(
  (
    await commit("sync-bob", [
      write(
        memberPath("sync-bob"),
        { left: true, ready: false },
        ["updatedAt"],
        true,
      ),
    ])
  ).status,
  200,
  "Guest can leave",
);
assert.equal(
  (
    await commit("sync-bob", [
      write(memberPath("sync-bob"), { left: false }, ["updatedAt"], true),
    ])
  ).status,
  403,
  "Cannot silently rejoin an active session",
);
assert.equal((await command("sync-alice", "completed", 33000)).status, 200);
assert.equal(
  (await command("sync-alice", "running", 0)).status,
  403,
  "Completed room cannot restart",
);
assert.equal(
  (await call("sync-bob", `${roomPath}/members/sync-alice`)).status,
  200,
);
assert.equal(
  (await call("sync-eve", `${roomPath}/members/sync-alice`)).status,
  403,
);
// Declining before start also prevents launch.
const declinedPath = "/workoutRooms/declined-test";
assert.equal(
  (
    await commit("sync-alice", [
      write(declinedPath, room, ["anchor", "createdAt"]),
      write(`${declinedPath}/members/sync-alice`, { ...member, ready: false }, [
        "updatedAt",
      ]),
    ])
  ).status,
  200,
);
assert.equal(
  (
    await commit("sync-bob", [
      write(
        `${declinedPath}/members/sync-bob`,
        { ...member, accepted: false, left: true },
        ["updatedAt"],
      ),
    ])
  ).status,
  200,
);
assert.equal(
  (
    await commit("sync-alice", [
      write(
        declinedPath,
        { status: "running", elapsedMs: -4000 },
        ["anchor"],
        true,
      ),
    ])
  ).status,
  403,
);
assert.equal(
  (
    await commit("sync-alice", [
      write(
        declinedPath,
        { status: "cancelled", elapsedMs: -4000 },
        ["anchor"],
        true,
      ),
    ])
  ).status,
  200,
);
console.log(
  "Shared workout rules: invitation, readiness, ownership, pause/seek, immutable snapshot, departure and completion passed",
);
