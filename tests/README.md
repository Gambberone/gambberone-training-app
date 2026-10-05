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

Local mode persistence and account isolation:

```sh
node tests/localData.test.mjs
```

Checks guest/account separation, reload persistence, playback checkpoints and
one-time adoption of existing local caches. Guest data is never automatically
imported into a connected account.

First-time local onboarding timing:

```sh
node tests/appTour.test.mjs
```

Simulates delayed runtime readiness on a fresh guest visit and checks that the
first step targets Home only after navigation mounts. Missing targets must not
produce a centered fallback popover or mark onboarding complete.

First-visit account/local choice:

```sh
node tests/entryChoice.test.mjs
```

Checks the initial login redirect, explicit local choice persisted across reloads,
optional account connection, verified sessions and account-only social routes.

Workout creator contextual guide:

```sh
node tests/creatorGuide.test.mjs
```

Covers context-dependent instructions for all step types, first-use offer,
skip/replay, preserving the draft and removing highlights when the editor closes.
Also checks the shared Driver.js popover style and that both popover and overlay
are attached to the creator dialog so they remain visible in its native top layer.
The guide preference is kept separately for each local/account archive.

The Wavebinder test also covers local catalog loading before runtime readiness:
selection must work once startup finishes without a Firebase snapshot, and local
catalog edits must continue updating the available choices.

Creator guide regression checks also verify that typing does not advance the
name step, validation changes reuse the active popover, and modal transitions
do not enable the fade animation.
