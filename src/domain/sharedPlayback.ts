/** Position on a shared timeline. Negative time is the common countdown. */
export function sharedPosition(durations: number[], elapsed: number) {
  if (elapsed < 0)
    return {
      index: 0,
      elapsed: 0,
      countdown: Math.ceil(-elapsed / 1000),
      done: false,
    };
  let remaining = elapsed;
  for (let index = 0; index < durations.length; index++) {
    const duration = Math.max(1, durations[index]!);
    if (remaining < duration)
      return { index, elapsed: remaining, countdown: 0, done: false };
    remaining -= duration;
  }
  return {
    index: Math.max(0, durations.length - 1),
    elapsed: durations.at(-1) ?? 0,
    countdown: 0,
    done: true,
  };
}

export function sharedElapsed(
  elapsedMs: number,
  anchorMs: number,
  now: number,
  running: boolean,
) {
  return elapsedMs + (running ? Math.max(0, now - anchorMs) : 0);
}
