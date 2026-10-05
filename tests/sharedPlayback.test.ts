import assert from "node:assert/strict";
import { sharedElapsed, sharedPosition } from "../src/domain/sharedPlayback.ts";
const durations = [10000, 3000, 20000];
assert.deepEqual(sharedPosition(durations, -4000), {
  index: 0,
  elapsed: 0,
  countdown: 4,
  done: false,
});
assert.equal(sharedPosition(durations, -1).countdown, 1);
assert.deepEqual(sharedPosition(durations, 0), {
  index: 0,
  elapsed: 0,
  countdown: 0,
  done: false,
});
assert.equal(sharedPosition(durations, 9999).index, 0);
assert.deepEqual(sharedPosition(durations, 10000), {
  index: 1,
  elapsed: 0,
  countdown: 0,
  done: false,
});
assert.deepEqual(sharedPosition(durations, 27000), {
  index: 2,
  elapsed: 14000,
  countdown: 0,
  done: false,
});
assert.equal(sharedPosition(durations, 33000).done, true);
assert.equal(sharedPosition(durations, 99000).done, true);
// Two devices with different local clocks, corrected to server time, agree.
assert.equal(
  sharedElapsed(-4000, 100000, 104500, true),
  sharedElapsed(-4000, 100000, 164500 - 60000, true),
);
assert.equal(sharedElapsed(12500, 100000, 900000, false), 12500);
assert.equal(sharedElapsed(12500, 100000, 100750, true), 13250);
assert.equal(sharedElapsed(-4000, 100000, 99999, true), -4000);
// Reconnect skips all elapsed phases instead of restarting the current exercise.
assert.equal(
  sharedPosition(durations, sharedElapsed(5000, 100000, 126000, true)).elapsed,
  18000,
);
assert.equal(sharedPosition([], 0).done, true);
console.log(
  "Shared playback: countdown, boundaries, clock correction, pause/resume and reconnect passed",
);
