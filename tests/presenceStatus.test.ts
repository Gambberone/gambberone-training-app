import assert from 'node:assert/strict';
import { isPresenceOnline } from '../src/services/presenceStatus.ts';
const now = 1_000_000;
assert.equal(isPresenceOnline([], now), false);
assert.equal(isPresenceOnline([now - 30_000], now), true);
assert.equal(isPresenceOnline([now - 90_000], now), false);
assert.equal(isPresenceOnline([now - 100_000, now - 1_000], now), true, 'Another active tab keeps the friend online');
assert.equal(isPresenceOnline([NaN, Infinity, 0, now + 20_000], now), false);
console.log('Presence expiration and multiple tabs: passed');
