<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { auth } from '@/firebase';
import { Dumbbell, Clock3, Check, LogOut, Play } from '@lucide/vue';
import { tr } from '@/localization';
import { listenFriendships, listenPublicProfile } from '@/services/friends';
import { listenFriendPresence } from '@/services/presence';
import { isPresenceOnline } from '@/services/presenceStatus';
import {
  createSharedRoom,
  isSharedHost,
  joinSharedRoom,
  leaveSharedRoom,
  partnerUnavailable,
  selectedTogetherWorkout,
  setSharedReady,
  sharedAction,
  sharedBusy,
  sharedConnected,
  sharedError,
  sharedInvites,
  sharedMembers,
  sharedNow,
  sharedPartner,
  sharedRoom,
  sharedRoomId,
  startSharedRoom,
} from '@/services/sharedWorkout';
import { activeWorkoutSessionRef, workoutEstimatedDuration } from '@/stores/workoutCreator';
import SharedWorkoutInvite from './SharedWorkoutInvite.vue';

const friendsLoading = ref(false);
const friendsLoadError = ref(false);
const friends = ref<{ id: string; name: string }[]>([]);
const friendPresence = ref<Record<string, number[]>>({});
const isFriendOnline = (id: string) =>
  isPresenceOnline(friendPresence.value[id] ?? [], sharedNow.value);
const pickerOpen = computed({
  get: () => !!selectedTogetherWorkout.value,
  set: (value) => {
    if (!value) selectedTogetherWorkout.value = undefined;
  },
});
const lobbyOpen = ref(!!sharedRoomId.value);
const otherReady = computed(() => {
  const room = sharedRoom.value;
  return (
    !!room &&
    room.participants.every(
      (id) => sharedMembers.value[id]?.ready && !sharedMembers.value[id]?.left,
    )
  );
});
const myReady = computed(() => !!sharedMembers.value[auth.currentUser?.uid ?? '']?.ready);
const invites = computed(() =>
  sharedInvites.value.filter(
    (room) =>
      room.id !== sharedRoomId.value &&
      sharedNow.value - (room.createdAt?.toMillis() ?? 0) < 3600000,
  ),
);
let stopFriends: (() => void) | undefined;
let stopProfiles: (() => void)[] = [];
let friendsLoadVersion = 0;
function loadFriends() {
  const version = ++friendsLoadVersion;
  stopFriends?.();
  stopProfiles.forEach((stop) => stop());
  stopProfiles = [];
  friendPresence.value = {};
  friends.value = [];
  friendsLoadError.value = false;
  friendsLoading.value = pickerOpen.value;
  if (!pickerOpen.value) return;
  stopFriends = listenFriendships(
    (items) => {
      if (version !== friendsLoadVersion) return;
      friendsLoading.value = false;
      friendsLoadError.value = false;
      stopProfiles.forEach((stop) => stop());
      stopProfiles = [];
      friendPresence.value = {};
      friends.value = items
        .filter((item) => item.status === 'accepted')
        .map((item) => ({
          id: item.participants.find((id) => id !== auth.currentUser?.uid)!,
          name: tr('together.friend'),
        }));
      for (const friend of friends.value) {
        stopProfiles.push(listenFriendPresence(friend.id, (timestamps) => {
          if (version === friendsLoadVersion) friendPresence.value[friend.id] = timestamps;
        }));
        stopProfiles.push(
          listenPublicProfile(
            friend.id,
            (name) => {
              if (version !== friendsLoadVersion) return;
              friend.name = name || tr('together.friend');
              friends.value = [...friends.value];
            },
            () => {},
          ),
        );
      }
    },
    () => {
      if (version !== friendsLoadVersion) return;
      friendsLoading.value = false;
      friendsLoadError.value = true;
    },
  );
}
watch(pickerOpen, loadFriends, { immediate: true });
watch(sharedRoomId, (id) => {
  lobbyOpen.value = !!id;
});
onUnmounted(() => {
  friendsLoadVersion++;
  stopFriends?.();
  stopProfiles.forEach((stop) => stop());
});
async function acceptInvite(id: string) {
  await sharedAction(async () => {
    await joinSharedRoom(id);
    lobbyOpen.value = true;
  });
}
function invite(id: string, name: string) {
  const workout = selectedTogetherWorkout.value;
  if (workout) void sharedAction(() => createSharedRoom(workout, id, name));
}
</script>

<template>
  <div v-if="invites.length || sharedRoomId" class="mx-auto w-full max-w-2xl space-y-2 px-4 pt-3">
    <SharedWorkoutInvite
      v-for="invite in invites"
      :key="invite.id"
      :room="invite"
      @join="acceptInvite(invite.id)"
    />
    <div
      v-if="sharedRoomId && !activeWorkoutSessionRef"
      class="flex items-center justify-between gap-3 rounded-box border border-primary/30 bg-base-100 p-3"
    >
      <span class="text-sm font-semibold"
        >{{ tr('together.title') }} · {{ sharedRoom?.workout.name }}</span
      >
      <GttButton size="sm" @click="lobbyOpen = true">{{ tr('together.openLobby') }}</GttButton>
    </div>
  </div>
  <GttModal v-model="pickerOpen" :title="tr('together.title')">
    <section class="invite-workout" aria-labelledby="invite-workout-name">
      <div class="invite-workout-icon" aria-hidden="true"><Dumbbell :size="24" /></div>
      <div class="invite-workout-copy">
        <p class="invite-workout-label">{{ tr('together.selectedWorkout') }}</p>
        <h3 id="invite-workout-name" class="invite-workout-name">{{ selectedTogetherWorkout?.name }}</h3>
        <p v-if="selectedTogetherWorkout" class="invite-workout-duration">
          <Clock3 :size="15" aria-hidden="true" />
          {{ tr('together.estimatedDuration', { minutes: Math.ceil(workoutEstimatedDuration(selectedTogetherWorkout) / 60) }) }}
        </p>
      </div>
    </section>
    <div class="mb-2">
      <h3 class="font-bold">{{ tr('together.chooseFriend') }}</h3>
      <p class="mt-1 text-sm text-base-content/65">{{ tr('together.choose') }}</p>
    </div>
    <p v-if="friendsLoading" role="status" class="text-sm text-base-content/65">{{ tr('together.friendsLoading') }}</p>
    <div v-else-if="friendsLoadError" role="alert">
      <p class="text-sm text-error">{{ tr('together.friendsLoadError') }}</p>
      <GttButton mode="outline" class="mt-3" @click="loadFriends">{{ tr('together.retry') }}</GttButton>
    </div>
    <p v-else-if="!friends.length" class="text-sm">{{ tr('together.noFriends') }}</p>
    <ul v-else class="divide-y divide-base-200">
      <li
        v-for="friend in friends"
        :key="friend.id"
        class="flex items-center justify-between gap-3 py-3"
      >
        <div class="flex min-w-0 items-center gap-2">
          <p class="min-w-0 font-semibold wrap-break-word">{{ friend.name }}</p>
          <span
            v-if="isFriendOnline(friend.id)"
            class="size-2 shrink-0 rounded-full bg-success"
            role="img"
            :aria-label="tr('together.online')"
            :title="tr('together.online')"
          />
        </div>
        <GttButton
          color="primary"
          size="sm"
          class="shrink-0"
          :aria-label="tr('together.inviteFriend', { name: friend.name })"
          :disabled="sharedBusy || !!activeWorkoutSessionRef || !!sharedRoomId"
          @click="invite(friend.id, friend.name)"
          >{{ tr('together.invite') }}</GttButton
        >
      </li>
    </ul>
    <p v-if="activeWorkoutSessionRef || sharedRoomId" class="mt-3 text-sm">
      {{ tr('together.busy') }}
    </p>
    <p v-if="sharedError" role="alert" class="mt-3 text-sm text-error">
      {{ tr('together.error') }}
    </p>
  </GttModal>
  <GttModal
    v-if="sharedRoomId && !activeWorkoutSessionRef"
    v-model="lobbyOpen"
    :title="tr('together.lobby')"
  >
    <template v-if="sharedRoom">
      <section class="invite-workout" aria-labelledby="lobby-workout-name">
        <div class="invite-workout-icon" aria-hidden="true"><Dumbbell :size="24" /></div>
        <div class="invite-workout-copy">
          <p class="invite-workout-label">{{ tr('together.withLive', { name: sharedPartner }) }}</p>
          <h3 id="lobby-workout-name" class="invite-workout-name">{{ sharedRoom.workout.name }}</h3>
          <p class="invite-workout-duration"><Clock3 :size="15" aria-hidden="true" />
            {{ tr('together.estimatedDuration', { minutes: Math.ceil(workoutEstimatedDuration(sharedRoom.workout) / 60) }) }}
          </p>
        </div>
      </section>
      <h3 class="font-bold">{{ tr('together.preparation') }}</h3>
      <ul class="lobby-participants">
        <li v-for="id in sharedRoom.participants" :key="id" class="lobby-participant">
          <span class="lobby-participant-name">{{ sharedRoom.names[id] }}</span>
          <span class="lobby-participant-state" :class="{ 'text-success': sharedMembers[id]?.ready && !sharedMembers[id]?.left }">
            <Check v-if="sharedMembers[id]?.ready && !sharedMembers[id]?.left" :size="16" aria-hidden="true" />
            {{ sharedMembers[id]?.left
                ? tr('together.declined')
                : sharedMembers[id]?.ready
                  ? tr('together.ready')
                  : sharedMembers[id]?.accepted
                    ? tr('together.notReady')
                    : tr('together.waiting') }}
          </span>
        </li>
      </ul>
      <p v-if="!sharedConnected" role="status" class="mb-3 text-sm text-warning">
        {{ tr('together.reconnecting') }}
      </p>
      <p
        v-else-if="partnerUnavailable && sharedMembers[sharedRoom.guestId]?.accepted"
        class="mb-3 text-sm text-warning"
      >
        {{ tr('together.partnerOffline') }}
      </p>
      <p class="mb-4 text-sm text-base-content/65">
        {{ tr('together.controlsHint') }}
      </p>
      <div v-if="sharedRoom.status === 'waiting'" class="lobby-actions">
        <GttButton
          color="primary"
          :mode="myReady ? 'outline' : 'solid'"
          :disabled="sharedBusy || !sharedConnected"
          @click="sharedAction(setSharedReady)"
          ><Check :size="18" aria-hidden="true" />{{ myReady ? tr('together.notReady') : tr('together.imReady') }}</GttButton
        >
        <GttButton
          v-if="isSharedHost"
          color="primary"
          :disabled="sharedBusy || !sharedConnected || !otherReady || partnerUnavailable"
          @click="sharedAction(startSharedRoom)"
          ><Play :size="18" aria-hidden="true" />{{ tr('together.start') }}</GttButton
        >
      </div>
      <p v-else role="status" class="text-sm">{{ tr('together.ended') }}</p>
      <GttButton
        mode="ghost"
        class="lobby-leave"
        :disabled="sharedBusy"
        @click="sharedAction(() => leaveSharedRoom())"
        ><LogOut :size="16" aria-hidden="true" />{{ tr('together.leave') }}</GttButton
      >
    </template>
    <p v-else role="status">{{ tr('together.reconnecting') }}</p>
    <p v-if="sharedError" role="alert" class="mt-3 text-sm text-error">
      {{ tr('together.error') }}
    </p>
  </GttModal>
</template>

<style scoped>
/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 * Component: invite picker and preparation lobby · existing training theme · utilitarian.
 * Workout summary precedes friend selection; shared button states preserved. */
.invite-workout {
  display: flex;
  align-items: start;
  gap: var(--space-ui-sm);
  padding: var(--space-ui-md);
  margin-bottom: var(--space-ui-lg);
  border-inline-start: 3px solid var(--color-primary);
  border-radius: var(--radius-field);
  background: var(--color-base-200);
}
.invite-workout-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--size-ui-control);
  height: var(--size-ui-control);
  border-radius: var(--radius-field);
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.invite-workout-copy { min-width: 0; }
.invite-workout-label {
  font-size: var(--text-ui-small);
  color: var(--color-ui-muted);
}
.invite-workout-name {
  margin-top: var(--space-ui-xs);
  font-family: var(--font-ui-display);
  font-size: var(--text-ui-title);
  font-weight: 700;
  line-height: 1.15;
  font-style: normal;
  overflow-wrap: anywhere;
}
.invite-workout-duration {
  display: flex;
  align-items: center;
  gap: var(--space-ui-xs);
  margin-top: var(--space-ui-sm);
  font-size: var(--text-ui-small);
  color: var(--color-ui-muted);
}
.invite-workout-duration svg { flex-shrink: 0; }
.lobby-participants {
  margin-block: var(--space-ui-sm) var(--space-ui-lg);
}
.lobby-participant {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--space-ui-sm);
  padding-block: var(--space-ui-md);
  border-bottom: 1px solid var(--color-base-200);
}
.lobby-participant-name { font-weight: 600; overflow-wrap: anywhere; }
.lobby-participant-state {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: var(--space-ui-xs);
  text-align: end;
  font-size: var(--text-ui-small);
}
.lobby-participant-state svg { flex-shrink: 0; }
.lobby-actions {
  display: grid;
  gap: var(--space-ui-sm);
}
.lobby-leave {
  width: 100%;
  margin-top: var(--space-ui-md);
  color: var(--color-ui-muted);
}
</style>
