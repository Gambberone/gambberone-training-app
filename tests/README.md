Presence verification (Node 22+ and Firebase CLI):

```sh
node --experimental-strip-types tests/presenceStatus.test.ts
firebase emulators:exec --only firestore --project demo-gtt-presence --config firebase.presence-test.json 'node tests/presence.rules.mjs'
```

The demo project uses the local Firestore emulator and never writes production data.
