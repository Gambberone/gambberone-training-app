<template>
  <section
    ref="friendsPage"
    class="mx-auto w-full max-w-5xl friends-page space-y-6 pb-8"
  >
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl font-bold">{{ t("friends.title") }}</h1>
        <p class="mt-2 text-sm text-base-content/65">
          {{ t("friends.intro") }}
        </p>
      </div>
      <GttButton
        v-if="loading || accepted.length || activeTab !== 'friends'"
        color="primary"
        class="whitespace-nowrap"
        @click="openAdd"
        ><UserPlus :size="18" />{{ t("friends.add") }}</GttButton
      >
    </header>

    <p v-if="loadError" class="alert alert-error" role="alert">
      {{ loadError }}
    </p>
    <p v-if="pageError" class="alert alert-error" role="alert">
      {{ pageError }}
    </p>
    <button
      v-if="!friendsLoading && requests.length && activeTab !== 'requests'"
      type="button"
      class="friends-notice flex w-full items-center gap-3 rounded-box border border-primary/30 bg-base-100 p-4 text-left"
      @click="activeTab = 'requests'"
    >
      <UserPlus :size="20" class="shrink-0 text-primary" aria-hidden="true" />
      <span class="min-w-0 flex-1 text-sm font-semibold">{{
        t("friends.pendingRequests", { count: requests.length })
      }}</span>
      <ChevronRight :size="18" class="shrink-0" aria-hidden="true" />
    </button>
    <GttTabs
      v-model="activeTab"
      :tabs="tabs"
      initial-active-tab="friends"
      class="gap-5!"
    >
      <template v-for="tab in tabs" :key="tab.key" #[tab.key]>
        <div
          v-if="loading"
          class="space-y-3"
          role="status"
          :aria-label="t('friends.loading')"
        >
          <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl" />
        </div>
        <template v-else-if="activeTab === 'friends'">
          <div
            v-if="!accepted.length"
            class="rounded-box border border-base-300/50 bg-base-100 px-5 py-12 text-center"
          >
            <Users
              class="mx-auto mb-4 size-10 text-primary"
              aria-hidden="true"
            />
            <h2 class="text-lg font-bold">{{ t("friends.emptyTitle") }}</h2>
            <p class="mx-auto mt-2 max-w-sm text-sm text-base-content/60">
              {{ t("friends.noFriends") }}
            </p>
            <GttButton color="primary" class="mt-5" @click="openAdd">{{
              t("friends.add")
            }}</GttButton>
          </div>
          <ul
            v-else
            class="divide-y divide-base-300/50 rounded-box border border-base-300/50 bg-base-100"
          >
            <li
              v-for="friend in accepted"
              :key="friend.id"
              class="friend-row grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:p-5"
            >
              <div class="indicator size-11 shrink-0">
                <span
                  v-if="isFriendOnline(otherId(friend))"
                  class="indicator-item indicator-top indicator-end top-1.5! right-1.5! status status-primary size-3 ring-2 ring-base-100"
                  role="img"
                  :aria-label="t('friends.online')"
                  :title="t('friends.online')"
                ></span>
                <div
                  class="grid size-11 place-items-center rounded-full bg-base-200 font-bold text-base-content"
                  aria-hidden="true"
                >
                  {{ initials(otherId(friend)) }}
                </div>
              </div>
              <div class="min-w-0">
                <p class="friend-name font-semibold">
                  {{ name(otherId(friend)) }}
                </p>
                <p
                  v-if="names[otherId(friend)] && emails[otherId(friend)]"
                  class="friend-name mt-1 text-xs text-base-content/60"
                >
                  {{ emails[otherId(friend)] }}
                </p>
              </div>
              <div
                class="friend-inline-actions flex items-center gap-1 sm:gap-2"
              >
                <GttButton
                  mode="outline"
                  size="sm"
                  class="friend-share"
                  :aria-label="t('friends.shareWorkout')"
                  :title="t('friends.shareWorkout')"
                  :disabled="pending.has(friend.id)"
                  @click="openShare(friend)"
                  ><Send :size="16" aria-hidden="true" /><span
                    class="hidden sm:inline"
                    >{{ t("friends.shareWorkout") }}</span
                  ></GttButton
                >
                <details class="dropdown dropdown-end">
                  <summary
                    class="btn btn-ghost btn-sm btn-square"
                    :aria-label="
                      t('friends.optionsFor', { name: name(otherId(friend)) })
                    "
                  >
                    <Ellipsis :size="20" />
                  </summary>
                  <ul
                    class="dropdown-content menu z-10 w-44 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                  >
                    <li>
                      <button
                        class="text-error"
                        :disabled="pending.has(friend.id)"
                        @click="confirmRemove(friend, $event)"
                      >
                        {{ t("friends.remove") }}
                      </button>
                    </li>
                  </ul>
                </details>
              </div>
            </li>
          </ul>
        </template>
        <div v-else-if="activeTab === 'requests'" class="space-y-7">
          <section v-for="group in requestGroups" :key="group.key">
            <h2 class="mb-3 font-bold">
              {{ group.title }}
              <span class="ml-1 text-sm font-normal text-base-content/50">{{
                group.items.length
              }}</span>
            </h2>
            <p
              v-if="!group.items.length"
              class="rounded-xl bg-base-200/50 p-4 text-sm text-base-content/60"
            >
              {{ group.empty }}
            </p>
            <ul
              v-else
              class="divide-y divide-base-300/50 rounded-box border border-base-300/50 bg-base-100"
            >
              <li
                v-for="friend in group.items"
                :key="friend.id"
                class="friend-row grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 p-4 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:p-5"
              >
                <div
                  class="grid size-10 shrink-0 place-items-center rounded-full bg-base-200 font-bold"
                  aria-hidden="true"
                >
                  {{ initials(otherId(friend)) }}
                </div>
                <span class="friend-name min-w-0 font-semibold">{{
                  name(otherId(friend))
                }}</span>
                <div
                  class="friend-actions col-start-2 flex items-center gap-2 sm:col-start-auto"
                >
                  <GttButton
                    v-if="group.key === 'incoming'"
                    color="primary"
                    size="sm"
                    :disabled="pending.has(friend.id)"
                    @click="act(friend.id, () => acceptFriend(friend))"
                    ><span
                      v-if="pending.has(friend.id)"
                      class="loading loading-spinner loading-xs"
                    />{{ t("friends.accept") }}</GttButton
                  >
                  <GttButton
                    mode="ghost"
                    size="sm"
                    :disabled="pending.has(friend.id)"
                    @click="act(friend.id, () => removeFriend(friend))"
                    >{{
                      t(
                        group.key === "incoming"
                          ? "friends.decline"
                          : "friends.cancel",
                      )
                    }}</GttButton
                  >
                </div>
              </li>
            </ul>
          </section>
        </div>
        <template v-else>
          <div
            v-if="!shared.length"
            class="rounded-box border border-base-300/50 bg-base-100 px-5 py-12 text-center"
          >
            <Inbox
              class="mx-auto mb-4 size-10 text-primary"
              aria-hidden="true"
            />
            <h2 class="text-lg font-bold">{{ t("friends.noReceived") }}</h2>
            <p class="mt-2 text-sm text-base-content/60">
              {{ t("friends.receivedHint") }}
            </p>
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="item in sortedShared"
              :key="item.id"
              class="received-workout rounded-box border border-base-300/50 bg-base-100 p-4 sm:p-5"
            >
              <h2 class="wrap-break-word font-bold">{{ item.workout.name }}</h2>
              <p class="mt-1 wrap-break-word text-sm text-base-content/60">
                {{ t("friends.from", { name: name(item.from) }) }} ·
                {{ sharedDate(item.sharedAt) }}
              </p>
              <p
                class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/65"
              >
                <span class="inline-flex items-center gap-1.5 tabular-nums"
                  ><Clock :size="15" aria-hidden="true" />{{
                    t("friends.estimatedMinutes", {
                      count: Math.ceil(
                        workoutEstimatedDuration(item.workout) / 60,
                      ),
                    })
                  }}</span
                >
                <span>{{
                  t("friends.steps", {
                    count: item.workout.steps.filter(
                      (step) => step.type !== "SETPAUSE",
                    ).length,
                  })
                }}</span>
              </p>
              <div
                class="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-base-300/50 pt-3"
              >
                <GttButton
                  mode="ghost"
                  size="sm"
                  :disabled="pending.has(item.id)"
                  @click="act(item.id, () => dismissSharedWorkout(item.id))"
                  >{{ t("friends.dismiss") }}</GttButton
                >
                <GttButton
                  color="primary"
                  size="sm"
                  :disabled="pending.has(item.id)"
                  @click="previewTarget = item"
                  ><span
                    v-if="pending.has(item.id)"
                    class="loading loading-spinner loading-xs"
                  />{{ t("friends.preview") }}</GttButton
                >
              </div>
            </li>
          </ul>
        </template>
      </template>
    </GttTabs>

    <GttModal
      v-model="previewOpen"
      :title="previewTarget?.workout.name"
      :before-close="() => !previewTarget || !pending.has(previewTarget.id)"
    >
      <template v-if="previewTarget">
        <p class="mb-4 text-sm text-base-content/65">
          {{ t("friends.from", { name: name(previewTarget.from) }) }}
        </p>
        <ReceivedWorkoutPreview :workout="previewTarget.workout" />
        <p v-if="pageError" class="mt-4 text-sm text-error" role="alert">
          {{ pageError }}
        </p>
        <div class="mt-5 flex flex-wrap items-center justify-end gap-2">
          <GttButton
            mode="ghost"
            :disabled="pending.has(previewTarget.id)"
            @click="dismissPreview"
            >{{ t("friends.decline") }}</GttButton
          >
          <GttButton
            color="primary"
            :disabled="pending.has(previewTarget.id)"
            @click="importWorkout(previewTarget)"
            >{{ t("friends.import") }}</GttButton
          >
        </div>
      </template>
    </GttModal>
    <GttModal
      v-model="addOpen"
      :title="t('friends.add')"
      :before-close="() => !pending.has('add')"
    >
      <form class="space-y-4" @submit.prevent="addFriend">
        <label for="friend-uid" class="block text-sm font-semibold">{{
          t("friends.friendId")
        }}</label>
        <input
          id="friend-uid"
          v-model="friendId"
          class="input input-bordered w-full"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          required
          :disabled="pending.has('add')"
        />
        <p v-if="addError" class="text-sm text-error" role="alert">
          {{ addError }}
        </p>
        <GttButton
          color="primary"
          type="submit"
          class="w-full"
          :disabled="pending.has('add') || !friendId.trim()"
          ><span
            v-if="pending.has('add')"
            class="loading loading-spinner loading-sm"
          />{{ t("friends.sendRequest") }}</GttButton
        >
      </form>
      <div class="mt-6 space-y-3 border-t border-base-300 pt-5">
        <h3 class="text-sm font-semibold">{{ t("friends.yourId") }}</h3>
        <p class="text-sm text-base-content/60">{{ t("friends.idHint") }}</p>
        <div class="flex items-center gap-2">
          <code
            class="min-w-0 flex-1 break-all rounded-lg bg-base-200 p-3 text-xs"
            >{{ currentUser?.uid }}</code
          >
          <GttButton
            mode="outline"
            size="sm"
            :disabled="!currentUser?.uid"
            @click="copyId"
            ><Copy :size="16" />{{ t("friends.copy") }}</GttButton
          >
        </div>
        <p v-if="copyError" class="text-sm text-error" role="alert">
          {{ copyError }}
        </p>
      </div>
    </GttModal>
    <GttModal
      v-model="shareOpen"
      :title="t('friends.shareWorkout')"
      :before-close="() => !shareTarget || !pending.has(shareTarget.id)"
    >
      <form class="space-y-4" @submit.prevent="sendWorkout">
        <p
          v-if="shareTarget"
          class="wrap-break-word text-sm text-base-content/65"
        >
          {{ t("friends.shareWith", { name: name(otherId(shareTarget)) }) }}
        </p>
        <p
          v-if="!workoutsRef.length"
          class="rounded-xl bg-base-200 p-4 text-sm"
        >
          {{ t("friends.noOwnWorkouts") }}
        </p>
        <template v-else>
          <label for="shared-workout" class="block text-sm font-semibold">{{
            t("friends.chooseWorkout")
          }}</label>
          <select
            id="shared-workout"
            v-model="selectedWorkoutId"
            class="select select-bordered w-full"
            required
            :disabled="!!shareTarget && pending.has(shareTarget.id)"
          >
            <option value="" disabled>{{ t("friends.chooseWorkout") }}</option>
            <option
              v-for="workout in workoutsRef"
              :key="workout.id"
              :value="workout.id"
            >
              {{ workout.name }}
            </option>
          </select>
          <div v-if="selectedWorkout" class="rounded-xl bg-base-200 p-4">
            <p class="wrap-break-word font-semibold">
              {{ selectedWorkout.name }}
            </p>
            <p class="mt-1 text-sm text-base-content/60">
              {{ t("friends.steps", { count: selectedWorkout.steps.length }) }}
            </p>
          </div>
          <GttButton
            color="primary"
            type="submit"
            class="w-full"
            :disabled="
              !selectedWorkout || !shareTarget || pending.has(shareTarget.id)
            "
            ><span
              v-if="shareTarget && pending.has(shareTarget.id)"
              class="loading loading-spinner loading-sm"
            />{{ t("friends.share") }}</GttButton
          >
        </template>
        <p v-if="shareError" class="text-sm text-error" role="alert">
          {{ shareError }}
        </p>
      </form>
    </GttModal>
    <GttModal
      v-model="removeOpen"
      :title="t('friends.removeTitle')"
      :before-close="() => !removeTarget || !pending.has(removeTarget.id)"
    >
      <p v-if="removeTarget" class="wrap-break-word">
        {{ t("friends.removeConfirm", { name: name(otherId(removeTarget)) }) }}
      </p>
      <p v-if="removeError" class="mt-3 text-sm text-error" role="alert">
        {{ removeError }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <GttButton
          mode="ghost"
          :disabled="!!removeTarget && pending.has(removeTarget.id)"
          @click="removeOpen = false"
          >{{ t("friends.cancel") }}</GttButton
        >
        <GttButton
          color="error"
          :disabled="!removeTarget || pending.has(removeTarget.id)"
          @click="deleteFriend"
          >{{ t("friends.remove") }}</GttButton
        >
      </div>
    </GttModal>
  </section>
</template>

<script setup lang="ts">
import ReceivedWorkoutPreview from "@/components/workouts/ReceivedWorkoutPreview.vue";
import { listenFriendPresence } from "@/services/presence";
import { isPresenceOnline } from "@/services/presenceStatus";
import GttButton from "@/components/generic/GttButton.vue";
import GttModal from "@/components/generic/GttModal.vue";
import GttTabs from "@/components/generic/GttTabs.vue";
import { showToast } from "@/composables/toast";
import { useAuth } from "@/composables/useAuth";
import { appLocale, tr as t } from "@/localization";
import {
  acceptFriend,
  dismissSharedWorkout,
  listenPublicProfile,
  listenFriendEmail,
  listenFriendships,
  listenSharedWorkouts,
  removeFriend,
  requestFriend,
  shareWorkout,
  type Friendship,
  type SharedWorkout,
} from "@/services/friends";
import { workoutsRef, workoutEstimatedDuration } from "@/stores/workoutCreator";
import {
  ChevronRight,
  Clock,
  Copy,
  Ellipsis,
  Inbox,
  Send,
  UserPlus,
  Users,
} from "@lucide/vue";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";

const { currentUser } = useAuth();
const friendsPage = ref<HTMLElement>();
function closeFriendMenus(event: Event) {
  const target = event.target;
  friendsPage.value
    ?.querySelectorAll<HTMLDetailsElement>("details[open]")
    .forEach((menu) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        menu.removeAttribute("open");
        menu.querySelector("summary")?.focus();
      } else if (target instanceof Node && !menu.contains(target)) {
        menu.removeAttribute("open");
      }
    });
}
onMounted(() => {
  document.addEventListener("pointerdown", closeFriendMenus);
  document.addEventListener("keydown", closeFriendMenus);
});

const friends = ref<Friendship[]>([]);
const shared = ref<SharedWorkout[]>([]);
const previewTarget = ref<SharedWorkout>();
const previewOpen = computed({
  get: () => !!previewTarget.value,
  set: (value) => {
    if (!value) previewTarget.value = undefined;
  },
});
const friendPresence = reactive<Record<string, number[]>>({});
const presenceListeners = new Map<string, () => void>();
const presenceNow = ref(Date.now());
const presenceClock = setInterval(() => {
  presenceNow.value = Date.now();
}, 10000);
const isFriendOnline = (id: string) =>
  isPresenceOnline(friendPresence[id] ?? [], presenceNow.value);

const names = reactive<Record<string, string>>({});
const emails = reactive<Record<string, string>>({});
const pending = reactive(new Set<string>());
const loadError = ref("");
const pageError = ref("");
const addError = ref("");
const copyError = ref("");
const shareError = ref("");
const removeError = ref("");
const friendsLoading = ref(true);
const sharedLoading = ref(true);
const activeTab = ref("friends");
const addOpen = ref(false);
const shareOpen = ref(false);
const removeOpen = ref(false);
const friendId = ref("");
const shareTarget = ref<Friendship>();
const removeTarget = ref<Friendship>();
const selectedWorkoutId = ref("");
const selectedWorkout = computed(() =>
  workoutsRef.value.find((w) => w.id === selectedWorkoutId.value),
);
const requests = computed(() =>
  friends.value.filter(
    (f) => f.status === "pending" && f.recipient === currentUser.value?.uid,
  ),
);
const sent = computed(() =>
  friends.value.filter(
    (f) => f.status === "pending" && f.requester === currentUser.value?.uid,
  ),
);
const accepted = computed(() =>
  friends.value
    .filter((f) => f.status === "accepted")
    .sort((a, b) =>
      name(otherId(a)).localeCompare(name(otherId(b)), appLocale()),
    ),
);
const sortedShared = computed(() =>
  [...shared.value].sort((a, b) => b.sharedAt.localeCompare(a.sharedAt)),
);
const loading = computed(() =>
  activeTab.value === "received" ? sharedLoading.value : friendsLoading.value,
);
const tabs = computed(() =>
  [
    { key: "friends", label: t("friends.title"), count: accepted.value.length },
    {
      key: "requests",
      label: t("friends.requestsTab"),
      count: requests.value.length,
    },
    {
      key: "received",
      label: t("friends.receivedTab"),
      count: shared.value.length,
    },
  ].map((tab) => ({
    key: tab.key,
    label: tab.count ? `${tab.label} (${tab.count})` : tab.label,
  })),
);
const requestGroups = computed(() => [
  {
    key: "incoming",
    title: t("friends.requests"),
    items: requests.value,
    empty: t("friends.noRequests"),
  },
  {
    key: "outgoing",
    title: t("friends.sent"),
    items: sent.value,
    empty: t("friends.noSent"),
  },
]);
const otherId = (friend: Friendship) =>
  friend.participants.find((id) => id !== currentUser.value?.uid) || "";
const name = (id: string) =>
  names[id] ||
  (friends.value.some(
    (friend) => friend.status === "accepted" && otherId(friend) === id,
  )
    ? emails[id]
    : "") ||
  t("friends.unnamed");
const initials = (id: string) =>
  names[id]
    ? names[id]!.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toLocaleUpperCase(appLocale())
    : "?";
function sharedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(appLocale(), { dateStyle: "medium" }).format(
        date,
      );
}
let unsubscribe: (() => void)[] = [];
let generation = 0;
const emailListeners = new Map<string, () => void>();
const profileListeners = new Map<string, () => void>();
function stopProfileListeners() {
  presenceListeners.forEach((stop) => stop());
  presenceListeners.clear();
  Object.keys(friendPresence).forEach((id) => delete friendPresence[id]);
  profileListeners.forEach((stop) => stop());
  profileListeners.clear();
  emailListeners.forEach((stop) => stop());
  emailListeners.clear();
  Object.keys(emails).forEach((id) => delete emails[id]);
}
watch([friends, shared], () => {
  const ids = new Set([
    ...friends.value.flatMap((f) => f.participants),
    ...shared.value.map((s) => s.from),
  ]);
  ids.delete(currentUser.value?.uid || "");
  profileListeners.forEach((stop, id) => {
    if (!ids.has(id)) {
      stop();
      profileListeners.delete(id);
      delete names[id];
    }
  });
  const version = generation;
  const acceptedIds = new Set(
    friends.value.filter((friend) => friend.status === "accepted").map(otherId),
  );
  emailListeners.forEach((stop, id) => {
    if (!acceptedIds.has(id)) {
      stop();
      emailListeners.delete(id);
      delete emails[id];
    }
  });
  presenceListeners.forEach((stop, id) => {
    if (!acceptedIds.has(id)) {
      stop();
      presenceListeners.delete(id);
      delete friendPresence[id];
    }
  });
  acceptedIds.forEach((id) => {
    if (!presenceListeners.has(id))
      presenceListeners.set(
        id,
        listenFriendPresence(id, (values) => {
          if (version === generation) friendPresence[id] = values;
        }),
      );
    if (emailListeners.has(id)) return;
    emailListeners.set(
      id,
      listenFriendEmail(
        id,
        (email) => {
          if (version !== generation || !emailListeners.has(id)) return;
          if (email) emails[id] = email;
          else delete emails[id];
        },
        () => {
          if (version === generation && emailListeners.has(id))
            delete emails[id];
        },
      ),
    );
  });
  ids.forEach((id) => {
    if (profileListeners.has(id)) return;
    profileListeners.set(
      id,
      listenPublicProfile(
        id,
        (displayName) => {
          if (version !== generation) return;
          if (displayName) names[id] = displayName;
          else delete names[id];
        },
        (error) => {
          if (version === generation)
            console.error("Unable to load friend profile", error);
        },
      ),
    );
  });
});
watch(
  () => currentUser.value?.uid,
  (uid) => {
    unsubscribe.forEach((stop) => stop());
    unsubscribe = [];
    stopProfileListeners();
    const version = ++generation;
    friends.value = [];
    shared.value = [];
    Object.keys(names).forEach((id) => delete names[id]);
    loadError.value = "";
    pageError.value = "";
    addOpen.value = shareOpen.value = removeOpen.value = false;
    previewTarget.value = undefined;
    friendsLoading.value = sharedLoading.value = !!uid;
    if (!uid) return;
    unsubscribe = [
      listenFriendships(
        (items) => {
          if (version !== generation) return;
          friends.value = items;
          friendsLoading.value = false;
        },
        () => {
          if (version !== generation) return;
          friendsLoading.value = false;
          loadError.value = t("friends.loadError");
        },
      ),
      listenSharedWorkouts(
        (items) => {
          if (version !== generation) return;
          shared.value = items;
          sharedLoading.value = false;
        },
        () => {
          if (version !== generation) return;
          sharedLoading.value = false;
          loadError.value = t("friends.loadError");
        },
      ),
    ];
  },
  { immediate: true },
);
onUnmounted(() => {
  clearInterval(presenceClock);
  document.removeEventListener("pointerdown", closeFriendMenus);
  document.removeEventListener("keydown", closeFriendMenus);
  generation++;
  unsubscribe.forEach((stop) => stop());
  stopProfileListeners();
});
async function act(
  key: string,
  action: () => Promise<void>,
  success = t("friends.done"),
  errorTarget = pageError,
) {
  if (pending.has(key)) return false;
  pending.add(key);
  errorTarget.value = "";
  try {
    await action();
    showToast({ title: success });
    return true;
  } catch {
    errorTarget.value = t("friends.actionError");
    return false;
  } finally {
    pending.delete(key);
  }
}
function openAdd() {
  addError.value = "";
  copyError.value = "";
  addOpen.value = true;
}
async function addFriend() {
  if (pending.has("add")) return;
  const id = friendId.value.trim();
  addError.value = "";
  if (!id) return;
  if (id === currentUser.value?.uid) {
    addError.value = t("friends.self");
    return;
  }
  if (friends.value.some((friend) => friend.participants.includes(id))) {
    addError.value = t("friends.exists");
    return;
  }
  pending.add("add");
  try {
    await requestFriend(id);
    friendId.value = "";
    addOpen.value = false;
    showToast({ title: t("friends.requestSent") });
  } catch (cause) {
    addError.value =
      cause instanceof Error && cause.message === "unknown"
        ? t("friends.unknown")
        : cause instanceof Error && cause.message === "exists"
          ? t("friends.exists")
          : t("friends.actionError");
  } finally {
    pending.delete("add");
  }
}
function openShare(friend: Friendship) {
  shareTarget.value = friend;
  selectedWorkoutId.value = "";
  shareError.value = "";
  shareOpen.value = true;
}
async function sendWorkout() {
  const friend = shareTarget.value;
  const workout = selectedWorkout.value;
  if (
    friend &&
    workout &&
    (await act(
      friend.id,
      () => shareWorkout(friend, workout),
      t("friends.workoutSent"),
      shareError,
    ))
  )
    shareOpen.value = false;
}
function confirmRemove(friend: Friendship, event: Event) {
  (event.currentTarget as HTMLElement)
    .closest("details")
    ?.removeAttribute("open");
  removeTarget.value = friend;
  removeError.value = "";
  removeOpen.value = true;
}
async function deleteFriend() {
  const friend = removeTarget.value;
  if (
    friend &&
    (await act(
      friend.id,
      () => removeFriend(friend),
      t("friends.done"),
      removeError,
    ))
  )
    removeOpen.value = false;
}
async function importWorkout(item: SharedWorkout) {
  const success = await act(
    item.id,
    async () => {
      const copy = JSON.parse(
        JSON.stringify(item.workout),
      ) as SharedWorkout["workout"];
      delete copy.exerciseNames;
      copy.id = crypto.randomUUID();
      workoutsRef.value = [...workoutsRef.value, copy];
      try {
        await dismissSharedWorkout(item.id);
      } catch (cause) {
        workoutsRef.value = workoutsRef.value.filter(
          (workout) => workout.id !== copy.id,
        );
        throw cause;
      }
    },
    t("friends.workoutImported"),
  );
  if (success) previewTarget.value = undefined;
}
async function dismissPreview() {
  const item = previewTarget.value;
  if (item && (await act(item.id, () => dismissSharedWorkout(item.id))))
    previewTarget.value = undefined;
}
async function copyId() {
  copyError.value = "";
  if (!currentUser.value?.uid) return;
  try {
    await navigator.clipboard.writeText(currentUser.value.uid);
    showToast({ title: t("friends.copied") });
  } catch {
    copyError.value = t("friends.actionError");
  }
}
</script>

<style scoped>
/* Hallmark · macrostructure: people directory / received workout inbox
 * existing training system · pre-emit critique: P4 H5 E4 S4 R5 V4 */
.friends-page :deep(.btn) {
  min-height: var(--size-ui-control);
  white-space: nowrap;
}
.friends-page h1,
.friend-name,
.received-workout h2 {
  overflow-wrap: anywhere;
  min-width: 0;
}
.friends-notice:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.friends-notice:hover {
  background: var(--color-base-200);
}
.friends-notice:active {
  background: var(--color-base-300);
}
@media (max-width: 39.9375rem) {
  .friend-share {
    width: var(--size-ui-control);
    padding-inline: 0;
  }
}
@media (max-width: 23rem) {
  .friend-actions {
    grid-column: 1 / -1;
  }
}
</style>
