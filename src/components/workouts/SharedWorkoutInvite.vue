<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { tr } from "@/localization";
import {
  declineSharedRoom,
  sharedAction,
  sharedBusy,
  sharedError,
  sharedRoomId,
  type SharedRoom,
} from "@/services/sharedWorkout";
import { activeWorkoutSessionRef } from "@/stores/workoutCreator";
const props = defineProps<{ room: SharedRoom }>();
defineEmits<{ join: [] }>();
const dismissed = ref(false);
const stop = onSnapshot(
  doc(db, "workoutRooms", props.room.id, "members", auth.currentUser!.uid),
  (snapshot) => {
    dismissed.value =
      snapshot.data()?.left === true || snapshot.data()?.accepted === true;
  },
  () => {
    sharedError.value = true;
  },
);
onUnmounted(stop);
const disabled = computed(
  () =>
    sharedBusy.value || !!activeWorkoutSessionRef.value || !!sharedRoomId.value,
);
</script>
<template>
  <div
    v-if="!dismissed"
    class="rounded-box border border-primary/30 bg-base-100 p-3"
  >
    <p class="text-sm font-semibold">
      {{
        tr("together.invited", {
          name: room.names[room.hostId] ?? tr("together.friend"),
          workout: room.workout.name,
        })
      }}
    </p>
    <div class="mt-2 flex flex-wrap gap-2">
      <GttButton
        color="primary"
        size="sm"
        :disabled="disabled"
        @click="$emit('join')"
        >{{ tr("together.accept") }}</GttButton
      >
      <GttButton
        mode="ghost"
        size="sm"
        :disabled="sharedBusy"
        @click="sharedAction(() => declineSharedRoom(room.id))"
        >{{ tr("together.decline") }}</GttButton
      >
    </div>
    <p v-if="disabled && !sharedBusy" class="mt-2 text-xs text-base-content/65">
      {{ tr("together.busy") }}
    </p>
    <p v-if="sharedError" role="alert" class="mt-2 text-xs text-error">
      {{ tr("together.error") }}
    </p>
  </div>
</template>
