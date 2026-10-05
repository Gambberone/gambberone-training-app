import assert from "node:assert/strict";
import { fork } from "node:child_process";
let sequence = 0;
const clients = [];
async function client(name) {
  const child = fork(
    new URL("./sharedWorkout.client.mjs", import.meta.url),
    [name],
    {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      execPath: process.env.GTT_TEST_NODE || process.execPath,
    },
  );
  clients.push(child);
  let logs = "";
  child.stdout.on("data", (data) => (logs += data));
  child.stderr.on("data", (data) => (logs += data));
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    child.once("exit", (code) =>
      reject(new Error(`Client exited ${code}: ${logs}`)),
    );
    child.on("message", (message) => {
      if (message.ready) resolve(message.uid);
      else {
        const target = pending.get(message.id);
        pending.delete(message.id);
        if (message.error)
          target?.reject(new Error(message.error + "\nClient logs: " + logs));
        else target?.resolve(message.result);
      }
    });
  });
  const uid = await ready;
  return {
    uid,
    call(action, ...args) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        child.send({ id, action, args });
      });
    },
  };
}
try {
  const [host, guest] = await Promise.all([client("Host"), client("Guest")]);
  const project = "demo-gtt-presence";
  const pair = [host.uid, guest.uid].sort().join("_");
  const seed = await fetch(
    `http://127.0.0.1:8189/v1/projects/${project}/databases/(default)/documents/friendships/${pair}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          participants: {
            arrayValue: {
              values: [{ stringValue: host.uid }, { stringValue: guest.uid }],
            },
          },
          requester: { stringValue: host.uid },
          recipient: { stringValue: guest.uid },
          status: { stringValue: "accepted" },
        },
      }),
    },
  );
  assert.equal(seed.status, 200);
  const id = await host.call("invite", guest.uid, "Guest");
  await guest.call("waitInvite", id);
  await guest.call("join", id);
  await Promise.all([host.call("ready"), guest.call("ready")]);
  await host.call("waitReady");
  await host.call("start");
  await Promise.all([
    host.call("waitStatus", "running"),
    guest.call("waitStatus", "running"),
  ]);
  const [a, b] = await Promise.all([
    host.call("inspect"),
    guest.call("inspect"),
  ]);
  assert.ok(a.session.sharedRoomId === id && b.session.sharedRoomId === id);
  assert.equal(
    b.session.sharedWorkout.name,
    "Shared intervals",
    "Guest uses snapshot without importing a workout",
  );
  assert.equal(b.session.trainedWith, "Host");
  assert.deepEqual(
    b.session.sharedWorkout.exerciseNames,
    { "custom-test": "Custom press" },
    "Snapshot includes only the exercises used by this workout",
  );
  assert.ok(
    Math.abs(a.elapsed - b.elapsed) < 500,
    `Clocks aligned: ${a.elapsed}, ${b.elapsed}`,
  );
  await guest.call("requestPause");
  await host.call("waitPauseRequest", guest.uid);
  await host.call("pause");
  await guest.call("waitStatus", "paused");
  const paused = await guest.call("inspect");
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(
    (await guest.call("inspect")).elapsed,
    paused.elapsed,
    "Paused timeline does not advance",
  );
  await host.call("seek", 7500);
  const waitSeek = async () => {
    for (let i = 0; i < 50; i++) {
      if ((await guest.call("inspect")).elapsed === 7500) return;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    throw new Error("Seek did not propagate");
  };
  await waitSeek();
  await host.call("resume");
  await guest.call("waitStatus", "running");
  await guest.call("leaveSolo");
  await host.call("waitLeft", guest.uid);
  const solo = await guest.call("inspect");
  assert.equal(solo.roomId, null);
  assert.equal(solo.session.sharedRoomId, undefined);
  assert.equal(solo.session.isPaused, true);
  assert.equal(
    solo.session.sharedWorkout.name,
    "Shared intervals",
    "Solo playback retains snapshot",
  );
  await host.call("offlineSolo");
  const offline = await host.call("inspect");
  assert.equal(offline.roomId, null, "Can continue alone without connection");
  assert.equal(offline.session.sharedRoomId, undefined);
  await Promise.all([host.call("complete"), guest.call("complete")]);
  assert.equal((await guest.call("inspect")).history[0].trainedWith, "Host");
  await host.call("reconnect");
  const secondId = await host.call("invite", guest.uid, "Guest");
  await guest.call("waitInvite", secondId);
  await guest.call("join", secondId);
  await Promise.all([host.call("ready"), guest.call("ready")]);
  await host.call("waitReady");
  await host.call("start");
  await Promise.all([
    host.call("waitStatus", "running"),
    guest.call("waitStatus", "running"),
  ]);
  // Rebinding the guest listeners preserves the session and shared position.
  const beforeReconnect = await guest.call("inspect");
  await guest.call("reconnect");
  assert.equal(
    (await guest.call("inspect")).session.id,
    beforeReconnect.session.id,
  );
  await host.call("seek", 10000);
  await guest.call("waitElapsed", 10000);
  await Promise.all([host.call("complete"), guest.call("complete")]);
  const [hostDone, guestDone] = await Promise.all([
    host.call("inspect"),
    guest.call("inspect"),
  ]);
  assert.equal(hostDone.history[0].sharedRoomId, secondId);
  assert.equal(guestDone.history[0].sharedRoomId, secondId);
  assert.equal(hostDone.history[0].trainedWith, "Guest");
  assert.equal(guestDone.history[0].trainedWith, "Host");
  assert.equal(hostDone.session, null);
  assert.equal(guestDone.session, null);
  const completionDeadline = Date.now() + 5000;
  let completed = false;
  while (Date.now() < completionDeadline) {
    const saved = await fetch(
      `http://127.0.0.1:8189/v1/projects/${project}/databases/(default)/documents/workoutRooms/${secondId}`,
      { headers: { Authorization: "Bearer owner" } },
    );
    if ((await saved.json()).fields?.status?.stringValue === "completed") {
      completed = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  assert.ok(completed, "Host publishes completion to the shared room");
  console.log(
    "Two actual clients: invite, accept, readiness, common clock, pause, seek, resume and reconnect, online/offline solo departure and individual history passed",
  );
} finally {
  for (const child of clients) child.kill();
}
