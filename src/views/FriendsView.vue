<template>
  <section class="mx-auto w-full max-w-5xl space-y-5 pb-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('friends.title') }}</h1>
      <p class="mt-2 text-base-content/65">{{ t('friends.intro') }}</p>
    </header>
    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title">{{ t('friends.yourId') }}</h2>
        <div class="flex flex-wrap items-center gap-2">
          <code class="min-w-0 break-all rounded-lg bg-base-200 px-3 py-2 text-sm">{{ currentUser?.uid }}</code>
          <GttButton mode="outline" type="button" @click="copyId">{{ t('friends.copy') }}</GttButton>
        </div>
        <p class="text-sm text-base-content/60">{{ t('friends.idHint') }}</p>
      </div>
    </div>
    <form class="card border border-base-300 bg-base-100 shadow-sm" @submit.prevent="addFriend">
      <div class="card-body gap-3">
        <h2 class="card-title">{{ t('friends.add') }}</h2>
        <label class="text-sm font-semibold" for="friend-uid">{{ t('friends.friendId') }}</label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input id="friend-uid" v-model="friendId" class="input input-bordered min-w-0 flex-1" autocomplete="off" required />
          <GttButton color="primary" type="submit" :disabled="busy || !friendId.trim()">{{ t('friends.sendRequest') }}</GttButton>
        </div>
      </div>
    </form>
    <p v-if="message" class="alert alert-info" role="status">{{ message }}</p>
    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <div class="grid gap-5 lg:grid-cols-2">
      <div class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body gap-3">
          <h2 class="card-title">{{ t('friends.requests') }}</h2>
          <p v-if="!requests.length" class="text-sm text-base-content/60">{{ t('friends.noRequests') }}</p>
          <div v-for="friend in requests" :key="friend.id" class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 p-3">
            <span class="min-w-0 break-all font-medium">{{ names[friend.requester] || friend.requester }}</span>
            <div class="flex gap-2">
              <GttButton color="primary" size="sm" :disabled="busy" @click="act(() => acceptFriend(friend))">{{ t('friends.accept') }}</GttButton>
              <GttButton mode="outline" size="sm" :disabled="busy" @click="act(() => removeFriend(friend))">{{ t('friends.decline') }}</GttButton>
            </div>
          </div>
          <h3 class="mt-2 font-semibold">{{ t('friends.sent') }}</h3>
          <p v-if="!sent.length" class="text-sm text-base-content/60">{{ t('friends.noSent') }}</p>
          <div v-for="friend in sent" :key="friend.id" class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 p-3">
            <span class="min-w-0 break-all">{{ names[friend.recipient] || friend.recipient }}</span>
            <GttButton mode="outline" size="sm" :disabled="busy" @click="act(() => removeFriend(friend))">{{ t('friends.cancel') }}</GttButton>
          </div>
        </div>
      </div>
      <div class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body gap-3">
          <h2 class="card-title">{{ t('friends.myFriends') }}</h2>
          <p v-if="!accepted.length" class="text-sm text-base-content/60">{{ t('friends.noFriends') }}</p>
          <div v-for="friend in accepted" :key="friend.id" class="rounded-xl bg-base-200 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="min-w-0 break-all font-semibold">{{ names[otherId(friend)] || otherId(friend) }}</span>
              <GttButton mode="ghost" size="sm" :disabled="busy" @click="act(() => removeFriend(friend))">{{ t('friends.remove') }}</GttButton>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <select v-model="selectedWorkouts[friend.id]" class="select select-bordered min-w-0 flex-1" :aria-label="t('friends.chooseWorkout')">
                <option value="">{{ t('friends.chooseWorkout') }}</option>
                <option v-for="workout in workoutsRef" :key="workout.id" :value="workout.id">{{ workout.name }}</option>
              </select>
              <GttButton color="primary" size="sm" :disabled="busy || !selectedWorkouts[friend.id]" @click="sendWorkout(friend)">{{ t('friends.share') }}</GttButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-3">
        <h2 class="card-title">{{ t('friends.received') }}</h2>
        <p v-if="!shared.length" class="text-sm text-base-content/60">{{ t('friends.noReceived') }}</p>
        <div v-for="item in shared" :key="item.id" class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 p-3">
          <span><strong>{{ item.workout?.name }}</strong> · {{ names[item.from] || item.from }}</span>
          <div class="flex gap-2">
            <GttButton color="primary" size="sm" :disabled="busy" @click="importWorkout(item)">{{ t('friends.import') }}</GttButton>
            <GttButton mode="outline" size="sm" :disabled="busy" @click="act(() => dismissSharedWorkout(item.id))">{{ t('friends.dismiss') }}</GttButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import GttButton from '@/components/generic/GttButton.vue';
import { useAuth } from '@/composables/useAuth';
import { tr as t } from '@/localization';
import { acceptFriend, dismissSharedWorkout, findPublicProfile, listenFriendships, listenSharedWorkouts, removeFriend, requestFriend, shareWorkout, type Friendship, type SharedWorkout } from '@/services/friends';
import { workoutsRef } from '@/stores/workoutCreator';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

const { currentUser } = useAuth();
const friends = ref<Friendship[]>([]);
const shared = ref<SharedWorkout[]>([]);
const friendId = ref('');
const selectedWorkouts = reactive<Record<string, string>>({});
const names = reactive<Record<string, string>>({});
const busy = ref(false);
const error = ref('');
const message = ref('');
const requests = computed(() => friends.value.filter((f) => f.status === 'pending' && f.recipient === currentUser.value?.uid));
const sent = computed(() => friends.value.filter((f) => f.status === 'pending' && f.requester === currentUser.value?.uid));
const accepted = computed(() => friends.value.filter((f) => f.status === 'accepted'));
const otherId = (friend: Friendship) => friend.participants.find((id) => id !== currentUser.value?.uid) || '';
let unsubscribe: (() => void)[] = [];
async function loadNames() {
  const ids = new Set([...friends.value.flatMap((f) => f.participants), ...shared.value.map((s) => s.from)]);
  ids.delete(currentUser.value?.uid || '');
  await Promise.all([...ids].map(async (id) => {
    if (!names[id]) names[id] = (await findPublicProfile(id)) || id;
  }));
}
onMounted(() => {
  unsubscribe = [
    listenFriendships((items) => { friends.value = items; void loadNames(); }, () => { error.value = t('friends.loadError'); }),
    listenSharedWorkouts((items) => { shared.value = items; void loadNames(); }, () => { error.value = t('friends.loadError'); }),
  ];
});
onUnmounted(() => unsubscribe.forEach((stop) => stop()));
watch(currentUser, () => { Object.keys(names).forEach((id) => delete names[id]); });
async function act(action: () => Promise<void>, success = t('friends.done')) {
  busy.value = true; error.value = ''; message.value = '';
  try { await action(); message.value = success; }
  catch (cause) { error.value = t('friends.actionError'); console.error(cause); }
  finally { busy.value = false; }
}
async function addFriend() {
  const id = friendId.value.trim();
  if (id === currentUser.value?.uid) { error.value = t('friends.self'); return; }
  busy.value = true; error.value = ''; message.value = '';
  try { await requestFriend(id); friendId.value = ''; message.value = t('friends.requestSent'); }
  catch (cause) { error.value = cause instanceof Error && cause.message === 'unknown' ? t('friends.unknown') : cause instanceof Error && cause.message === 'exists' ? t('friends.exists') : t('friends.actionError'); }
  finally { busy.value = false; }
}
async function sendWorkout(friend: Friendship) {
  const workout = workoutsRef.value.find((item) => item.id === selectedWorkouts[friend.id]);
  if (workout) await act(() => shareWorkout(friend, workout), t('friends.workoutSent'));
}
async function importWorkout(item: SharedWorkout) {
  await act(async () => {
    // Firestore items are wrapped in Vue proxies, which structuredClone cannot copy.
    const copy = JSON.parse(JSON.stringify(item.workout)) as SharedWorkout['workout'];
    copy.id = crypto.randomUUID();
    workoutsRef.value = [...workoutsRef.value, copy];
    await dismissSharedWorkout(item.id);
  }, t('friends.workoutImported'));
}
async function copyId() {
  try { await navigator.clipboard.writeText(currentUser.value?.uid || ''); message.value = t('friends.copied'); }
  catch { error.value = t('friends.actionError'); }
}
</script>
