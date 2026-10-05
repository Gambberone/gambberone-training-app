Presence verification (Node 22+ and Firebase CLI):

```sh
node --experimental-strip-types tests/presenceStatus.test.ts
firebase emulators:exec --only firestore --project demo-gtt-presence --config firebase.presence-test.json 'node tests/presence.rules.mjs'
```

The demo project uses the local Firestore emulator and never writes production data.

Shared workout verification:

```sh
node --experimental-strip-types tests/sharedPlayback.test.ts
firebase emulators:exec --only firestore --project demo-gtt-presence --config firebase.presence-test.json 'node tests/sharedWorkout.rules.mjs && node tests/presence.rules.mjs'
firebase emulators:exec --only auth,firestore --project demo-gtt-presence --config firebase.shared-test.json 'node tests/sharedWorkout.integration.mjs'
```

The integration test uses the browser Firebase SDK with a small fetch adapter for
unary XMLHttpRequest calls, avoiding the Node SDK's separate gRPC transport.
Optional `GTT_TEST_NODE` selects a different Node executable for the two clients.
The integration test runs the actual Vue
service in two isolated processes with local Firebase Auth accounts, and checks
invites, readiness, common timing, pause/resume, seeking, reconnect, solo departure
(including offline), and separate history entries. All writes target demo emulators.

Deploy the updated `firestore.rules` alongside the app to enable shared rooms.
Invites appear in the app; this version does not send push notifications.

Wavebinder exercise editor and workout insights verification:

```sh
TZ=Europe/Rome node tests/wavebinderInsights.test.mjs
```

Exercises the application's node definitions and domain functions with the real
local Wavebinder node factory, independently of license/network initialization.
Covers required fields, shared period statistics, history filters, agenda matching,
clock rollover, invalid dates, empty states, and Vue subscription disposal.

Also covers catalog updates and selection invalidation, pure duration calculations,
and runtime readiness/failure/invalidation states with a simulated runtime.
