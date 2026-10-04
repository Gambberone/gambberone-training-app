// Expired sessions never keep a friend online after an interrupted connection.
export function isPresenceOnline(timestamps: number[], now = Date.now()) {
  return timestamps.some(
    (time) =>
      Number.isFinite(time) &&
      time > 0 &&
      time <= now + 10000 &&
      now - time < 90000,
  );
}
